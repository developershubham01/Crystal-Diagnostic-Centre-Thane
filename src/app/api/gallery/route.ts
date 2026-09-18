import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/** GET /api/gallery — published images (public). ?all=1 includes drafts for admin. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const isAdmin = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  const images = await db.galleryImage.findMany({
    where: all && isAdmin ? {} : { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(images);
}

/** POST /api/gallery — add image (admin) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.url) {
    return NextResponse.json({ error: "Title and image are required" }, { status: 400 });
  }
  const image = await db.galleryImage.create({
    data: {
      title: String(body.title),
      category: typeof body.category === "string" && body.category ? body.category : "Other",
      url: String(body.url),
      alt: typeof body.alt === "string" ? body.alt : null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      published: body.published ?? true,
    },
  });
  await logAudit(db, session, "CREATE", "gallery", image.id, `Added ${image.title}`);
  return NextResponse.json(image, { status: 201 });
}
