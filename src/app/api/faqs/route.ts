import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/** GET /api/faqs — published FAQs (public). ?all=1 returns drafts for admin. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const isAdmin = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  const faqs = await db.faq.findMany({
    where: all && isAdmin ? {} : { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(faqs);
}

/** POST /api/faqs — create (admin) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.question || !body?.answer) {
    return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
  }
  const faq = await db.faq.create({
    data: {
      question: String(body.question),
      answer: String(body.answer),
      category: typeof body.category === "string" && body.category ? body.category : null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      published: body.published ?? true,
    },
  });
  await logAudit(db, session, "CREATE", "faq", faq.id, null);
  return NextResponse.json(faq, { status: 201 });
}
