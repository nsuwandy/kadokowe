/** Run with: npm test */
import { rateLimit, resetRateLimits, clientIp, LIMITS } from "../src/lib/rate-limit";

let failed = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); failed++; }
};

resetRateLimits();
const opts = (now: number) => ({ limit: 3, windowMs: 1000, now });

check("first call allowed", rateLimit("a", opts(0)), { ok: true, remaining: 2 });
check("second allowed", rateLimit("a", opts(10)), { ok: true, remaining: 1 });
check("third allowed", rateLimit("a", opts(20)), { ok: true, remaining: 0 });
check("fourth blocked", rateLimit("a", opts(30)), { ok: false, retryAfterSeconds: 1 });
check("still blocked just before reset", rateLimit("a", opts(999)), { ok: false, retryAfterSeconds: 1 });
check("allowed again after the window", rateLimit("a", opts(1000)), { ok: true, remaining: 2 });

resetRateLimits();
check("keys are independent", rateLimit("b", opts(0)), { ok: true, remaining: 2 });
check("other key unaffected", rateLimit("c", opts(0)), { ok: true, remaining: 2 });

// x-forwarded-for may carry a proxy chain; the client is the first entry.
check("ip from forwarded chain",
  clientIp(new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" })), "203.0.113.9");
check("ip falls back to x-real-ip",
  clientIp(new Headers({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
check("unknown when neither header is present", clientIp(new Headers()), "unknown");

// The login limit is the one protecting the password; keep it tight.
check("login limit is the tightest", LIMITS.login.limit <= 10, true);

if (failed) process.exitCode = 1;
