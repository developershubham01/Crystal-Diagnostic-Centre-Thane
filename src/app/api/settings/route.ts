import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const rows = await db.siteSetting.findMany();
  return NextResponse.json(parseSettings(rows));
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (!(key in DEFAULT_SETTINGS)) continue; // whitelist keys
    if (typeof value !== "string") continue;
    updates.push({ key, value });
  }

  for (const { key, value } of updates) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  await logAudit(db, session, "UPDATE", "settings", null, `Updated ${updates.length} settings`);

  const rows = await db.siteSetting.findMany();
  return NextResponse.json(parseSettings(rows));
}
