import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/services?category=&search=&featured=1 — published services (public)
 * POST /api/services — create service (admin)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const search = searchParams.get("search")?.trim();
  const featured = searchParams.get("featured") === "1";
  const all = searchParams.get("all") === "1";

  const isAdmin = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const includeUnpublished = all && isAdmin;

  const services = await db.service.findMany({
    where: {
      ...(includeUnpublished ? {} : { published: true }),
      ...(featured ? { featured: true } : {}),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { shortDescription: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  // Prices are hidden publicly unless explicitly approved (priceVisible)
  const safe = services.map((s) => ({
    ...s,
    price: s.priceVisible ? s.price : null,
  }));
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string" || !body.categoryId) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug
      ? body.slug
      : body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const exists = await db.service.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "A service with this slug already exists" }, { status: 409 });

  const category = await db.serviceCategory.findUnique({ where: { id: body.categoryId } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 400 });

  const service = await db.service.create({
    data: {
      slug,
      categoryId: body.categoryId,
      name: body.name,
      shortDescription: body.shortDescription ?? null,
      detailedDescription: body.detailedDescription ?? null,
      preparation: body.preparation ?? null,
      sampleType: body.sampleType ?? null,
      turnaroundTime: body.turnaroundTime ?? null,
      price: typeof body.price === "number" ? body.price : null,
      priceVisible: body.priceVisible ?? false,
      image: body.image ?? null,
      featured: body.featured ?? false,
      published: body.published ?? true,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });
  await logAudit(db, session, "CREATE", "service", service.id, `Created service ${service.name}`);
  return NextResponse.json(service, { status: 201 });
}
