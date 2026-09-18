import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/services/[slug] — service detail by slug (public) */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const service = await db.service.findUnique({
    where: { slug },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  if (!service || !service.published) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  return NextResponse.json({ ...service, price: service.priceVisible ? service.price : null });
}

/** PATCH /api/services/[slug] — admin accepts either the slug or the cuid id */
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing =
    (await db.service.findUnique({ where: { slug } })) ??
    (await db.service.findUnique({ where: { id: slug } }));
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  const strFields = ["name", "shortDescription", "detailedDescription", "preparation", "sampleType", "turnaroundTime", "image", "seoTitle", "seoDescription"];
  for (const f of strFields) {
    if (typeof body[f] === "string" || body[f] === null) data[f] = body[f];
  }
  if (typeof body.categoryId === "string") data.categoryId = body.categoryId;
  if (typeof body.slug === "string" && body.slug) data.slug = body.slug;
  if (typeof body.price === "number" || body.price === null) data.price = body.price;
  if (typeof body.priceVisible === "boolean") data.priceVisible = body.priceVisible;
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const service = await db.service.update({ where: { id: existing.id }, data });
  await logAudit(db, session, "UPDATE", "service", service.id, `Updated service ${service.name}`);
  return NextResponse.json(service);
}

/** DELETE /api/services/[slug] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const existing =
    (await db.service.findUnique({ where: { slug } })) ??
    (await db.service.findUnique({ where: { id: slug } }));
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  await db.service.delete({ where: { id: existing.id } });
  await logAudit(db, session, "DELETE", "service", existing.id, `Deleted service ${existing.name}`);
  return NextResponse.json({ ok: true });
}
