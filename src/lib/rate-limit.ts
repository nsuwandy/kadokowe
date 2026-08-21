/**
 * Fixed-window rate limiting — NFR-3.5.
 *
 * In-process and deliberately so. The site runs on Vercel's free tier with
 * no Redis (SRS §13.2), and the realistic alternatives were an external
 * store the client does not have an account for, or nothing at all. Nothing
 * at all leaves the admin password open to unlimited guessing.
 *
 * The limitation is real and worth stating: each serverless instance keeps
 * its own counters, so an attacker spread across many cold starts sees a
 * higher effective limit than the numbers below. It still removes the case
 * that actually matters — thousands of attempts down one warm connection —
 * and it costs nothing. Moving to a shared store is a drop-in replacement of
 * this module when there is somewhere to put the counters.
 *
 * Fixed window rather than sliding: it needs one integer per key instead of a
 * list of timestamps, and the boundary effect it is criticised for (twice the
 * limit across a window edge) does not matter at these thresholds.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Purge expired entries so a long-lived instance does not grow without bound. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs, now = Date.now() }: { limit: number; windowMs: number; now?: number },
): RateLimitResult {
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}

/** Test seam — resets all counters. */
export function resetRateLimits() {
  buckets.clear();
}

/**
 * Best-effort client address.
 *
 * x-forwarded-for is client-controlled unless a proxy overwrites it, which
 * Vercel does. Behind anything else it is a hint, not an identity — which is
 * the honest reason this is a speed bump rather than an access control.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** The limits themselves, in one place so they can be reviewed together. */
export const LIMITS = {
  /** Password guessing. Deliberately the tightest. */
  login: { limit: 8, windowMs: 15 * 60_000 },
  /** A genuine enquirer sends one brief, not six. */
  enquiry: { limit: 5, windowMs: 10 * 60_000 },
  /** Signup triggers an email, so abuse here costs sending reputation. */
  newsletter: { limit: 5, windowMs: 60 * 60_000 },
} as const;
