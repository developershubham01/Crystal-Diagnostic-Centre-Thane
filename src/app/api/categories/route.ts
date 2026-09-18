import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

/** GET /api/categories — published categories with service counts (public) */
export async function GET() {
  const categories = await db.serviceCategory.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { services: { where: { published: true } } } } },
  });
  return NextResponse.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      image: c.image,
      sortOrder: c.sortOrder,
      published: c.published,
      serviceCount: c._count.services,
    }))
  );
}

/** POST /api/categories — create (admin) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug
      ? body.slug
      : body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const exists = await db.serviceCategory.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });

  const category = await db.serviceCategory.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? null,
      icon: body.icon ?? null,
      image: body.image ?? null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      published: body.published ?? true,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
