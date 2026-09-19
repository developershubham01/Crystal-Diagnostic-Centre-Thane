import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { rateLimit, checkLoginLock, recordFailedLogin, resetFailedLogin, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/** POST /api/auth/login — admin login (locks for 10 minutes after 4 failed attempts) */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const lockKey = `login_fail:${ip}`;

  // General rate limit safeguard
  const rl = rateLimit(`login:${ip}`, 20, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many total requests. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` },
      { status: 429 }
    );
  }

  // Check 4-attempt / 10-minute lockout rule
  const lockStatus = checkLoginLock(lockKey);
  if (lockStatus.locked) {
    const mins = Math.ceil(lockStatus.remainingSeconds / 60);
    return NextResponse.json(
      { error: `Account locked due to 4 consecutive failed login attempts. Please wait ${mins} minute(s) before trying again.` },
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
    const failStatus = recordFailedLogin(lockKey, 4, 10 * 60_000);
    if (failStatus.locked) {
      const mins = Math.ceil(failStatus.remainingSeconds / 60);
      return NextResponse.json(
        { error: `Account locked due to 4 consecutive failed login attempts. Please wait ${mins} minute(s) before trying again.` },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Invalid username or password. ${failStatus.attemptsLeft} attempt(s) remaining before 10-minute lockout.` },
      { status: 401 }
    );
  }

  // Login successful -> reset failed attempt counter
  resetFailedLogin(lockKey);

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
