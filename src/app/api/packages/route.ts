import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/** GET /api/packages?featured=1 — published packages (public) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured") === "1";
  const all = searchParams.get("all") === "1";

  const isAdmin = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const includeUnpublished = all && isAdmin;

  const packages = await db.healthPackage.findMany({
    where: includeUnpublished ? {} : { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { tests: { orderBy: { sortOrder: "asc" } } },
  });

  const safe = packages.map((p) => ({ ...p, price: p.priceVisible ? p.price : null }));
  return NextResponse.json(featured ? safe.filter((p) => p.featured) : safe);
}

/** POST /api/packages — create (admin) */
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

  const exists = await db.healthPackage.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "A package with this slug already exists" }, { status: 409 });

  const pkg = await db.healthPackage.create({
    data: {
      slug,
      name: body.name,
      description: body.description ?? null,
      detailedDescription: body.detailedDescription ?? null,
      price: typeof body.price === "number" ? body.price : null,
      priceVisible: body.priceVisible ?? false,
      preparation: body.preparation ?? null,
      applicability: body.applicability ?? null,
      image: body.image ?? null,
      featured: body.featured ?? false,
      published: body.published ?? true,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      tests: {
        create: Array.isArray(body.tests)
          ? (body.tests as string[]).map((t, i) => ({ name: String(t), sortOrder: i }))
          : [],
      },
    },
    include: { tests: { orderBy: { sortOrder: "asc" } } },
  });
  await logAudit(db, session, "CREATE", "package", pkg.id, `Created package ${pkg.name}`);
  return NextResponse.json(pkg, { status: 201 });
}
