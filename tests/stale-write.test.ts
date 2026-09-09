/**
 * Run with: npm test
 *
 * The optimistic-concurrency stamp. Two failure modes matter and they pull in
 * opposite directions: too loose and a stale tab silently reverts someone
 * else's work (and moves their Cloudinary files); too strict and every save in
 * the admin is refused. The round trip has to be exact.
 */
import {
  editStamp, expectedStamp, stampGuard, isStaleWrite, STALE_MESSAGE,
} from "../src/lib/editor-shared";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const form = (value?: string) => {
  const f = new FormData();
  if (value !== undefined) f.set("updatedAt", value);
  return f;
};

// ---------------------------------------------------------------- stamping
check("no record, no stamp", editStamp(null), "");
check("undefined is not a stamp", editStamp(undefined), "");
check("a date becomes its ISO form",
  editStamp(new Date("2026-09-10T08:15:30.123Z")), "2026-09-10T08:15:30.123Z");

// Postgres stores these as TIMESTAMP(3) — milliseconds, exactly what an ISO
// string carries. If the round trip lost precision the guard would never match
// and every save in the admin would be refused as stale.
const exact = new Date("2026-09-10T08:15:30.123Z");
check("milliseconds survive the round trip",
  expectedStamp(form(editStamp(exact)))?.getTime(), exact.getTime());
check("and a millisecond of difference is still a difference",
  expectedStamp(form(editStamp(new Date(exact.getTime() + 1))))?.getTime(),
  exact.getTime() + 1);

// --------------------------------------------------------------- reading
// No stamp means no guard, and that has to stay permissive: a record being
// created has nothing to conflict with, and a page opened before this shipped
// should be no worse off than it was.
check("a submission with no stamp is unguarded", expectedStamp(form()), undefined);
check("an empty stamp is unguarded", expectedStamp(form("")), undefined);
check("whitespace is unguarded", expectedStamp(form("   ")), undefined);
// Nonsense must not become an Invalid Date in a where clause, which would
// match nothing and lock the operator out of their own record.
check("nonsense is unguarded, not a broken filter", expectedStamp(form("yesterday")), undefined);

// ---------------------------------------------------------------- guarding
check("no stamp adds no filter", stampGuard(undefined), {});
check("a stamp filters on updatedAt", stampGuard(exact), { updatedAt: exact });

// ------------------------------------------------------------- detection
check("P2025 is a stale write", isStaleWrite({ code: "P2025" }), true);
check("another Prisma code is not", isStaleWrite({ code: "P2002" }), false);
check("a plain error is not", isStaleWrite(new Error("nope")), false);
check("null is not", isStaleWrite(null), false);
check("undefined is not", isStaleWrite(undefined), false);

// The message has to say what happened and what to do; a bare "conflict"
// leaves the operator retrying the same doomed save.
check("the message tells them nothing was written",
  STALE_MESSAGE.includes("nothing was changed"), true);
check("and what to do about it", STALE_MESSAGE.includes("Reload"), true);
