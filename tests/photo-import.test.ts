/** Run with: npm test */
import {
  parsePhotoName, planPhotoImport, isIgnorableEntry, toSlug,
  type ParsedPhoto,
} from "../src/lib/photo-import";

let failed = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) { console.log(`      got:    ${JSON.stringify(got)}\n      wanted: ${JSON.stringify(want)}`); failed++; }
};

const parse = (n: string) => {
  const r = parsePhotoName(n);
  return "slug" in r ? { slug: r.slug, index: r.index } : { problem: r.problem };
};

// The requested format.
check("colon separator", parse("color_ballpoint_pen:1.jpg"), { slug: "color-ballpoint-pen", index: 1 });
// A colon is illegal on Windows, so these must work too.
check("underscore separator", parse("color_ballpoint_pen_2.jpg"), { slug: "color-ballpoint-pen", index: 2 });
check("hyphen separator", parse("color-ballpoint-pen-3.png"), { slug: "color-ballpoint-pen", index: 3 });
check("space separator", parse("color ballpoint pen 4.webp"), { slug: "color-ballpoint-pen", index: 4 });
check("finder duplicate form", parse("color_ballpoint_pen (2).jpg"), { slug: "color-ballpoint-pen", index: 2 });

// A trailing word is not an index, so a name ending in a word stays intact.
check("no index at all", parse("color_ballpoint_pen.jpg"), {
  problem: "No position number. Name files like colour_ballpoint_pen:1, where 1 is the hero.",
});
// Digits inside the name must not be mistaken for the index.
check("digits inside the name", parse("bottle_500ml:1.jpg"), { slug: "bottle-500ml", index: 1 });
check("nested folder uses the basename", parse("photos/batch1/pen:2.jpg"), { slug: "pen", index: 2 });
check("uppercase and extension case", parse("PEN:1.JPEG"), { slug: "pen", index: 1 });
check("zero is not a position", parse("pen:0.jpg"), { problem: "Position must be 1 or higher — 1 is the hero." });
check("non-image skipped", parse("notes.txt"), { problem: "Not an image file — skipped." });

// macOS resource forks would otherwise double every photograph.
check("macosx fork ignored", isIgnorableEntry("__MACOSX/._pen:1.jpg"), true);
check("dotfile ignored", isIgnorableEntry("photos/.DS_Store"), true);
check("directory entry ignored", isIgnorableEntry("photos/"), true);
check("real file kept", isIgnorableEntry("photos/pen:1.jpg"), false);

check("slugify underscores", toSlug("Color_Ballpoint_Pen"), "color-ballpoint-pen");

// --- planning ---
const products = [
  { slug: "color-ballpoint-pen", nameEn: "Color Ballpoint Pen" },
  { slug: "tote-bag", nameEn: "Canvas Tote Bag" },
];
const p = (file: string, slug: string, index: number): ParsedPhoto => ({ file, slug, index });

const plan = planPhotoImport([
  p("pen1.jpg", "color-ballpoint-pen", 1),
  p("pen3.jpg", "color-ballpoint-pen", 3),
  p("pen2.jpg", "color-ballpoint-pen", 2),
  p("ghost.jpg", "no-such-product", 1),
], products);

check("hero is position 1", plan.assignments[0].hero, "pen1.jpg");
check("gallery follows index order", plan.assignments[0].gallery, ["pen2.jpg", "pen3.jpg"]);
check("unmatched reported", plan.issues.map(i => i.problem), ['No product with the address "no-such-product".']);

// Matching by product name, for zips named from a spreadsheet column.
const byName = planPhotoImport([p("x.jpg", "canvas-tote-bag", 1)], products);
check("matches on product name too", byName.assignments[0].slug, "tote-bag");

// Two files claiming the same position is a conflict, not a silent overwrite.
const clash = planPhotoImport([
  p("a.jpg", "tote-bag", 1),
  p("b.jpg", "tote-bag", 1),
], products);
check("duplicate position kept once", clash.assignments[0].hero, "a.jpg");
check("duplicate position reported", clash.issues.length, 1);

// A product with only gallery shots and no hero is allowed.
const noHero = planPhotoImport([p("g.jpg", "tote-bag", 2)], products);
check("gallery without a hero", noHero.assignments[0].hero, null);
check("gallery still assigned", noHero.assignments[0].gallery, ["g.jpg"]);

if (failed) process.exitCode = 1;
