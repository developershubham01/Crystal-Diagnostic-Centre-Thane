import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/categories/[id] — update (admin) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string" || body.description === null) data.description = body.description;
  if (typeof body.icon === "string" || body.icon === null) data.icon = body.icon;
  if (typeof body.image === "string" || body.image === null) data.image = body.image;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.published === "boolean") data.published = body.published;

  const category = await db.serviceCategory.update({ where: { id }, data });
  await logAudit(db, session, "UPDATE", "category", id, `Updated category ${category.name}`);
  return NextResponse.json(category);
}

/** DELETE /api/categories/[id] — delete (admin, blocked if services exist) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const count = await db.service.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `This category still has ${count} service(s). Move or delete them first.` },
      { status: 409 }
    );
  }
  await db.serviceCategory.delete({ where: { id } });
  await logAudit(db, session, "DELETE", "category", id, null);
  return NextResponse.json({ ok: true });
}
