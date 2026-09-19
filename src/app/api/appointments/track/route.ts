import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/appointments/track?reference=CDC-XXXXXX&mobile=9876543210
 * PUBLIC status lookup — requires BOTH the tracking reference and the
 * exact 10-digit mobile used at booking, so only the requester can see
 * their own request. Returns a minimal, privacy-safe projection.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`track:${ip}`, 20, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many lookups. Please try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const reference = (searchParams.get("reference") ?? "").trim().toUpperCase();
  const mobile = (searchParams.get("mobile") ?? "").replace(/[\s\-+]/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");

  if (!/^CDC-[A-Z2-9]{6,12}$/.test(reference)) {
    return NextResponse.json({ error: "Enter a valid reference code (e.g. CDC-7K2M9Q)." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ error: "Enter the 10-digit mobile number you provided at booking." }, { status: 400 });
  }

  const appointment = await db.appointmentRequest.findUnique({
    where: { reference },
    select: {
      reference: true,
      name: true,
      mobile: true,
      testOrPackage: true,
      preferredDate: true,
      preferredTime: true,
      homeCollection: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Same error for "not found" and "wrong mobile" — never confirm which part failed.
  if (!appointment || appointment.mobile !== mobile) {
    return NextResponse.json(
      { error: "No appointment request matches that reference and mobile number. Please double-check both, or call us for help." },
      { status: 404 }
    );
  }

  // Mask the name for privacy on shared screens: "Priya Sharma" → "P**** S****"
  const maskedName = appointment.name
    .split(/\s+/)
    .map((part) => (part.length > 0 ? `${part[0]}${"*".repeat(Math.max(part.length - 1, 1))}` : part))
    .join(" ");

  return NextResponse.json({
    reference: appointment.reference,
    name: maskedName,
    testOrPackage: appointment.testOrPackage,
    preferredDate: appointment.preferredDate,
    preferredTime: appointment.preferredTime,
    homeCollection: appointment.homeCollection,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  });
}
