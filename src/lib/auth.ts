import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Authentication utilities for the admin dashboard.
 * - Passwords hashed with scrypt + per-user random salt.
 * - Sessions are HMAC-signed tokens stored in an httpOnly cookie.
 * - No hardcoded credentials: admin is seeded from env variables.
 */

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "crystal-diagnostic-dev-secret-change-me";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export interface SessionPayload {
  adminId: string;
  username: string;
  role: string;
  exp: number;
}

function sign(data: string): string {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

export function createSessionToken(admin: { id: string; username: string; role: string }): string {
  const payload: SessionPayload = {
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "cdc_admin_session";
export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000;
