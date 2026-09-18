import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { APPOINTMENT_STATUSES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/appointments/[id] — update status / notes (admin) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    if (!(APPOINTMENT_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (typeof body.internalNotes === "string" || body.internalNotes === null) {
    data.internalNotes = body.internalNotes;
  }

  const appointment = await db.appointmentRequest.update({ where: { id }, data });
  await logAudit(db, session, "UPDATE", "appointment", id, `Status → ${appointment.status}`);
  return NextResponse.json(appointment);
}

/** DELETE /api/appointments/[id] (admin) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.appointmentRequest.delete({ where: { id } });
  await logAudit(db, session, "DELETE", "appointment", id, null);
  return NextResponse.json({ ok: true });
}
