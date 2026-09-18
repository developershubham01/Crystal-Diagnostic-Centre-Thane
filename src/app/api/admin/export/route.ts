import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/admin/export?type=appointments|messages — CSV export (admin).
 * Privacy: exports only operational fields needed for follow-up;
 * includes a consent flag column so staff can filter opt-outs.
 */
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "appointments";

  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (type === "appointments") {
    const data = await db.appointmentRequest.findMany({ orderBy: { createdAt: "desc" } });
    headers = ["ID", "Received At", "Name", "Mobile", "Email", "Test/Package", "Preferred Date", "Preferred Time", "Home Collection", "Status", "Consent", "Message", "Internal Notes"];
    rows = data.map((a) => [a.id, a.createdAt.toISOString(), a.name, a.mobile, a.email, a.testOrPackage, a.preferredDate, a.preferredTime, a.homeCollection ? "yes" : "no", a.status, a.consent ? "yes" : "no", a.message, a.internalNotes]);
  } else if (type === "messages") {
    const data = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    headers = ["ID", "Received At", "Name", "Phone", "Email", "Subject", "Status", "Consent", "Message", "Internal Notes"];
    rows = data.map((m) => [m.id, m.createdAt.toISOString(), m.name, m.phone, m.email, m.subject, m.status, m.consent ? "yes" : "no", m.message, m.internalNotes]);
  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  await logAudit(db, session, "EXPORT", "csv", type, `Exported ${rows.length} rows`);

  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const filename = `crystal-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
