/** Run with: npm test */
import { resolveTermOrder } from "../src/lib/term-order";

const check = (label: string, got: string[], want: string[]) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${got.join(",")}`);
  if (!ok) { console.log(`      wanted: ${want.join(",")}`); process.exitCode = 1; }
};

const ids = ["a", "b", "c", "d"];
const from = (m: Record<string, number | undefined>) => (id: string) => m[id];

check("untouched keeps order", resolveTermOrder(ids, from({ a: 1, b: 2, c: 3, d: 4 })), ["a","b","c","d"]);
check("send last to top beats the incumbent", resolveTermOrder(ids, from({ a: 1, b: 2, c: 3, d: 1 })), ["d","a","b","c"]);
check("gaps resolve", resolveTermOrder(ids, from({ a: 30, b: 10, c: 20, d: 40 })), ["b","c","a","d"]);
check("duplicates keep relative order", resolveTermOrder(ids, from({ a: 2, b: 2, c: 1, d: 3 })), ["c","a","b","d"]);
check("missing values fall back to position", resolveTermOrder(ids, from({})), ["a","b","c","d"]);
check("NaN falls back to position", resolveTermOrder(ids, () => Number("abc")), ["a","b","c","d"]);
check("zero is honoured, not treated as missing", resolveTermOrder(ids, from({ a: 1, b: 2, c: 0, d: 4 })), ["c","a","b","d"]);
check("negative sorts first", resolveTermOrder(ids, from({ a: 1, b: 2, c: 3, d: -5 })), ["d","a","b","c"]);
check("empty list", resolveTermOrder([], from({})), []);

// The real case from the browser: exhibition (index 5 of 12) set to 1.
const twelve = Array.from({ length: 12 }, (_, i) => `t${i}`);
const ranks: Record<string, number> = {};
twelve.forEach((id, i) => (ranks[id] = i + 1));
ranks["t5"] = 1;
check("exhibition to top", resolveTermOrder(twelve, from(ranks)).slice(0, 3), ["t5","t0","t1"]);
