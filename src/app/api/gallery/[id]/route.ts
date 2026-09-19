import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/gallery/[id] */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.alt === "string" || body.alt === null) data.alt = body.alt;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.published === "boolean") data.published = body.published;

  const image = await db.galleryImage.update({ where: { id }, data });
  await logAudit(db, session, "UPDATE", "gallery", id, null);
  return NextResponse.json(image);
}

/** DELETE /api/gallery/[id] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const image = await db.galleryImage.delete({ where: { id } }).catch(() => null);
  if (image) await logAudit(db, session, "DELETE", "gallery", id, `Deleted ${image.title}`);
  return NextResponse.json({ ok: true });
}
