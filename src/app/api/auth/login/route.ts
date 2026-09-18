import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/** POST /api/auth/login — admin login (rate limited, httpOnly session cookie) */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`login:${ip}`, 8, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { username } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = createSessionToken(admin);
  await logAudit(db, { adminId: admin.id, username: admin.username, role: admin.role, exp: 0 }, "LOGIN", "auth", admin.id, null);

  const res = NextResponse.json({
    ok: true,
    admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
