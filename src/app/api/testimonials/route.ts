import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/** GET /api/testimonials — published testimonials (public). ?all=1 returns drafts for admin. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const isAdmin = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  const testimonials = await db.testimonial.findMany({
    where: all && isAdmin ? {} : { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(testimonials);
}

/** POST /api/testimonials — create (admin) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.text) {
    return NextResponse.json({ error: "Name and text are required" }, { status: 400 });
  }
  const rating = Number(body.rating);
  const testimonial = await db.testimonial.create({
    data: {
      name: String(body.name),
      area: typeof body.area === "string" && body.area ? body.area : null,
      rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
      text: String(body.text),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      published: body.published ?? true,
    },
  });
  await logAudit(db, session, "CREATE", "testimonial", testimonial.id, null);
  return NextResponse.json(testimonial, { status: 201 });
}
