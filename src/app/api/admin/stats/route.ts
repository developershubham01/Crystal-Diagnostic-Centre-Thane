import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

/** GET /api/admin/stats — dashboard overview numbers (admin) */
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalAppointments,
    newAppointments,
    weekAppointments,
    totalMessages,
    newMessages,
    servicesCount,
    packagesCount,
    faqsCount,
    galleryCount,
  ] = await Promise.all([
    db.appointmentRequest.count(),
    db.appointmentRequest.count({ where: { status: "NEW" } }),
    db.appointmentRequest.count({ where: { createdAt: { gte: since } } }),
    db.contactMessage.count(),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.service.count(),
    db.healthPackage.count(),
    db.faq.count(),
    db.galleryImage.count(),
  ]);

  // Appointments grouped by status
  const byStatus = await db.appointmentRequest.groupBy({ by: ["status"], _count: { status: true } });
  const statusCounts: Record<string, number> = {};
  for (const g of byStatus) statusCounts[g.status] = g._count.status;

  // Most requested tests/packages (top 5 by booking count)
  const byTest = await db.appointmentRequest.groupBy({
    by: ["testOrPackage"],
    _count: { testOrPackage: true },
    orderBy: { _count: { testOrPackage: "desc" } },
    take: 5,
  });
  const topTests = byTest.map((g) => ({ name: g.testOrPackage, count: g._count.testOrPackage }));

  // Last 14 days trend for enquiries
  const recent = await db.appointmentRequest.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true },
  });
  const trend: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: 0 });
  }
  for (const r of recent) {
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    const bucket = trend.find((t) => t.date === key);
    if (bucket) bucket.count++;
  }

  return NextResponse.json({
    totalAppointments,
    newAppointments,
    weekAppointments,
    totalMessages,
    newMessages,
    servicesCount,
    packagesCount,
    faqsCount,
    galleryCount,
    statusCounts,
    trend,
    topTests,
  });
}
