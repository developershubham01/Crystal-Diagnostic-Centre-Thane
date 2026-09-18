import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/packages/[slug] — public detail */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const pkg = await db.healthPackage.findUnique({
    where: { slug },
    include: { tests: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pkg || !pkg.published) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  return NextResponse.json({ ...pkg, price: pkg.priceVisible ? pkg.price : null });
}

/** PATCH /api/packages/[slug] — update (admin). Accepts slug or cuid id. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing =
    (await db.healthPackage.findUnique({ where: { slug } })) ??
    (await db.healthPackage.findUnique({ where: { id: slug } }));
  if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  const strFields = ["name", "description", "detailedDescription", "preparation", "applicability", "image", "slug"];
  for (const f of strFields) {
    if (typeof body[f] === "string" || body[f] === null) data[f] = body[f];
  }
  if (typeof body.price === "number" || body.price === null) data.price = body.price;
  if (typeof body.priceVisible === "boolean") data.priceVisible = body.priceVisible;
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  // Replace included tests when provided
  if (Array.isArray(body.tests)) {
    await db.packageTest.deleteMany({ where: { packageId: existing.id } });
    await db.packageTest.createMany({
      data: (body.tests as string[]).map((t, i) => ({ packageId: existing.id, name: String(t), sortOrder: i })),
    });
  }

  const pkg = await db.healthPackage.update({
    where: { id: existing.id },
    data,
    include: { tests: { orderBy: { sortOrder: "asc" } } },
  });
  await logAudit(db, session, "UPDATE", "package", pkg.id, `Updated package ${pkg.name}`);
  return NextResponse.json(pkg);
}

/** DELETE /api/packages/[slug] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const existing =
    (await db.healthPackage.findUnique({ where: { slug } })) ??
    (await db.healthPackage.findUnique({ where: { id: slug } }));
  if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  await db.healthPackage.delete({ where: { id: existing.id } });
  await logAudit(db, session, "DELETE", "package", existing.id, `Deleted package ${existing.name}`);
  return NextResponse.json({ ok: true });
}
