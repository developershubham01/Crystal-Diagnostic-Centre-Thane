/**
 * In-memory rate limiter and failed login lockout manager.
 * Protects public forms from spam and admin login from brute-force attempts.
 */

interface Bucket {
  timestamps: number[];
}

interface LockoutState {
  failedCount: number;
  lockedUntil: number;
}

const buckets = new Map<string, Bucket>();
const loginLockouts = new Map<string, LockoutState>();

// Periodically clean expired buckets to avoid memory growth
let lastClean = Date.now();
function maybeClean() {
  const now = Date.now();
  if (now - lastClean < 60_000) return;
  lastClean = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 15 * 60_000);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
  for (const [key, state] of loginLockouts) {
    if (state.lockedUntil > 0 && state.lockedUntil <= now) {
      loginLockouts.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding window rate limit check.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  maybeClean();
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, retryAfterSeconds: 0 };
}

/**
 * Checks if a login key is currently locked out after 4 failed attempts (10-min duration).
 */
export function checkLoginLock(key: string): { locked: boolean; remainingSeconds: number } {
  maybeClean();
  const now = Date.now();
  const state = loginLockouts.get(key);
  if (!state) return { locked: false, remainingSeconds: 0 };
  if (state.lockedUntil > now) {
    return { locked: true, remainingSeconds: Math.ceil((state.lockedUntil - now) / 1000) };
  }
  if (state.lockedUntil <= now && state.lockedUntil > 0) {
    loginLockouts.delete(key);
  }
  return { locked: false, remainingSeconds: 0 };
}

/**
 * Records a failed login attempt. Locks key for lockDurationMs if maxAttempts (4) reached.
 */
export function recordFailedLogin(
  key: string,
  maxAttempts = 4,
  lockDurationMs = 10 * 60_000
): {
  locked: boolean;
  failedCount: number;
  attemptsLeft: number;
  remainingSeconds: number;
} {
  maybeClean();
  const now = Date.now();
  const state = loginLockouts.get(key) ?? { failedCount: 0, lockedUntil: 0 };
  state.failedCount += 1;

  if (state.failedCount >= maxAttempts) {
    state.lockedUntil = now + lockDurationMs;
    loginLockouts.set(key, state);
    return {
      locked: true,
      failedCount: state.failedCount,
      attemptsLeft: 0,
      remainingSeconds: Math.ceil(lockDurationMs / 1000),
    };
  }

  loginLockouts.set(key, state);
  return {
    locked: false,
    failedCount: state.failedCount,
    attemptsLeft: maxAttempts - state.failedCount,
    remainingSeconds: 0,
  };
}

/**
 * Resets failed login attempt counter upon successful login.
 */
export function resetFailedLogin(key: string) {
  loginLockouts.delete(key);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
