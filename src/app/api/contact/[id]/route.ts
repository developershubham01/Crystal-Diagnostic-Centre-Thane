import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { MESSAGE_STATUSES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/contact/[id] — update status / notes (admin) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    if (!(MESSAGE_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (typeof body.internalNotes === "string" || body.internalNotes === null) {
    data.internalNotes = body.internalNotes;
  }

  const message = await db.contactMessage.update({ where: { id }, data });
  await logAudit(db, session, "UPDATE", "contact-message", id, `Status → ${message.status}`);
  return NextResponse.json(message);
}

/** DELETE /api/contact/[id] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.contactMessage.delete({ where: { id } });
  await logAudit(db, session, "DELETE", "contact-message", id, null);
  return NextResponse.json({ ok: true });
}
