import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const MOBILE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;

/** Public tracking code alphabet — no 0/O/1/I to avoid misreading. */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

async function generateReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let suffix = "";
    for (let i = 0; i < 6; i++) suffix += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
    const reference = `CDC-${suffix}`;
    const clash = await db.appointmentRequest.findUnique({ where: { reference }, select: { id: true } });
    if (!clash) return reference;
  }
  // Practically unreachable — fall back to a timestamp-based suffix.
  return `CDC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * GET /api/appointments?status=&q=&from=&to= — list (admin)
 * POST /api/appointments — public appointment REQUEST with validation + rate limit
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const appointments = await db.appointmentRequest.findMany({
    where: {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { mobile: { contains: q } }, { testOrPackage: { contains: q } }, { reference: { contains: q.toUpperCase() } }] } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`appointment:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Honeypot — silently accept but discard (bot trap)
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.replace(/[\s-]/g, "") : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const testOrPackage = typeof body.testOrPackage === "string" ? body.testOrPackage.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate : "";
  const preferredTime = typeof body.preferredTime === "string" ? body.preferredTime : "";
  const consent = body.consent === true;

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!MOBILE_RE.test(mobile)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!testOrPackage) {
    return NextResponse.json({ error: "Please select a test or package." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Please provide consent to be contacted." }, { status: 400 });
  }
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return NextResponse.json({ error: "Invalid preferred date." }, { status: 400 });
  }

  const appointment = await db.appointmentRequest.create({
    data: {
      reference: await generateReference(),
      name,
      mobile,
      email: email || null,
      testOrPackage,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      homeCollection: body.homeCollection === true,
      message: message || null,
      consent,
    },
  });

  return NextResponse.json({ ok: true, id: appointment.id, reference: appointment.reference }, { status: 201 });
}
