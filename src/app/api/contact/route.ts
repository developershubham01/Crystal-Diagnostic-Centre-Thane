import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MOBILE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;

/** GET /api/contact — list messages (admin) */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const messages = await db.contactMessage.findMany({
    where: status && status !== "ALL" ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(messages);
}

/** POST /api/contact — public contact form with validation + rate limit */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Honeypot
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s-]/g, "") : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 3000) : "";
  const consent = body.consent === true;

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!MOBILE_RE.test(phone)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Please enter your message." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Please provide consent to be contacted." }, { status: 400 });
  }

  await db.contactMessage.create({
    data: {
      name,
      phone,
      email: email || null,
      subject: subject || null,
      message,
      consent,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
