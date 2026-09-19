import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

/** GET /api/audit-logs — recent audit trail (admin) */
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}
