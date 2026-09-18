import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/faqs/[id] */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.question === "string") data.question = body.question;
  if (typeof body.answer === "string") data.answer = body.answer;
  if (typeof body.category === "string" || body.category === null) data.category = body.category;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.published === "boolean") data.published = body.published;

  const faq = await db.faq.update({ where: { id }, data });
  await logAudit(db, session, "UPDATE", "faq", id, null);
  return NextResponse.json(faq);
}

/** DELETE /api/faqs/[id] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.faq.delete({ where: { id } });
  await logAudit(db, session, "DELETE", "faq", id, null);
  return NextResponse.json({ ok: true });
}
