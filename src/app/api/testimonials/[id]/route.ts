import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/testimonials/[id] */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.area === "string" || body.area === null) data.area = body.area;
  if (typeof body.rating === "number") {
    data.rating = Math.min(5, Math.max(1, Math.round(body.rating)));
  }
  if (typeof body.text === "string") data.text = body.text;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.published === "boolean") data.published = body.published;

  const testimonial = await db.testimonial.update({ where: { id }, data });
  await logAudit(db, session, "UPDATE", "testimonial", id, null);
  return NextResponse.json(testimonial);
}

/** DELETE /api/testimonials/[id] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.testimonial.delete({ where: { id } });
  await logAudit(db, session, "DELETE", "testimonial", id, null);
  return NextResponse.json({ ok: true });
}
