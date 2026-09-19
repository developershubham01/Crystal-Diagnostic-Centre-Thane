/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments; protects public form
 * endpoints and admin login from spam / brute force.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

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
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key      unique key, e.g. `form:1.2.3.4` or `login:1.2.3.4`
 * @param limit    max requests within window
 * @param windowMs sliding window duration
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

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
