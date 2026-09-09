/**
 * Run with: npm test
 *
 * A narrow spreadsheet must correct what it names and leave everything else
 * alone. Before this, importing a CSV of `slug,name_en` blanked material,
 * colours, lead time, every tag and every taxonomy term on every product it
 * matched, and reset availability, visibility and both flags — reporting all
 * of it as a successful import.
 */
import { parseProductCsv, ALL_COLUMNS } from "../src/lib/product-import";
import {
  updateFields, productData, axesReplacedBy, termIdsForUpdate,
} from "../src/lib/product-import-plan";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const parse = (csv: string) => {
  const r = parseProductCsv(csv);
  if (r.errors.length) console.log("      unexpected errors:", JSON.stringify(r.errors));
  return r;
};

// ------------------------------------------------- which columns were there
const narrow = parse("slug,name_en,indicative_price\ntote,Canvas Tote,45000\n");
check("only the columns the file carried are present",
  [...narrow.present].sort(), ["indicative_price", "name_en", "slug"]);
// A misspelled heading is not a column. It now leaves that field alone rather
// than emptying it, which is the safer half of the same mistake.
const typo = parse("slug,name_en,materials\ntote,Canvas Tote,Canvas\n");
check("a misspelled heading is not a present column",
  [...typo.present].sort(), ["name_en", "slug"]);
check("and an unknown heading is not invented as a field",
  Object.keys(updateFields(typo.rows[0], typo.present)).sort(), ["nameEn"]);

// -------------------------------------------- an update writes only those
const update = updateFields(narrow.rows[0], narrow.present);
check("a narrow file updates only what it names",
  Object.keys(update).sort(), ["indicativePrice", "indicativePriceMax", "nameEn"]);
// The fields that used to be destroyed by this exact file.
for (const field of ["material", "colours", "leadTime", "tagsEn", "heroImage",
                     "availability", "visibility", "featured", "isNew", "moq"]) {
  check(`${field} is not in the update payload`, field in update, false);
}
// slug is the key an update is matched on, never something it writes.
check("slug is never written by an update", "slug" in update, false);

// ------------------------------------------- an empty cell still clears it
const cleared = parse("slug,name_en,material,colours,moq,featured\ntote,Canvas Tote,,,,\n");
const clearing = updateFields(cleared.rows[0], cleared.present);
check("an empty cell in a column you included clears that field",
  [clearing.material, clearing.colours, clearing.moq, clearing.featured],
  [null, [], null, false]);
check("clearing writes the field rather than skipping it",
  ["material", "colours", "moq", "featured"].every((f) => f in clearing), true);

// ------------------------------------------------- a create takes defaults
const created = productData(narrow.rows[0]);
check("a create still defaults availability", created.availability, "LOCAL_PRODUCTION");
check("a create still defaults visibility to draft", created.visibility, "DRAFT");
check("a create still defaults the flags", [created.featured, created.isNew], [false, false]);
check("a create still defaults lists to empty",
  [created.colours, created.tagsEn, created.customisation], [[], [], []]);
check("a create still defaults absent text to null",
  [created.material, created.leadTime, created.heroImage], [null, null, null]);
check("a create carries what the file did say",
  [created.nameEn, created.indicativePrice], ["Canvas Tote", 45000]);

// -------------------------------------------------------------- the axes
check("no taxonomy column and no price replaces no axis",
  [...axesReplacedBy(new Set(["slug", "name_en", "material"] as never))], []);
check("the price column governs the derived budget axis",
  [...axesReplacedBy(new Set(["indicative_price"] as never))], ["BUDGET"]);
check("each taxonomy column governs its own axis",
  [...axesReplacedBy(new Set(["category", "industries"] as never))].sort(),
  ["INDUSTRY", "PRODUCT"]);
check("a full file replaces all four", [...axesReplacedBy(ALL_COLUMNS)].sort(),
  ["BUDGET", "INDUSTRY", "PRODUCT", "PURPOSE"]);

// ------------------------------------------------------------- the terms
const existing = [
  { id: "t-cat", axis: "PRODUCT" },
  { id: "t-purpose", axis: "PURPOSE" },
  { id: "t-industry", axis: "INDUSTRY" },
  { id: "t-budget", axis: "BUDGET" },
];
check("nothing to replace leaves the relation alone entirely",
  termIdsForUpdate(existing, [], new Set()), null);
// A file carrying only `category` must not drop every purpose and industry.
check("replacing one axis keeps the other three",
  termIdsForUpdate(existing, [{ id: "t-cat2", axis: "PRODUCT" }], new Set(["PRODUCT"])),
  ["t-purpose", "t-industry", "t-budget", "t-cat2"]);
// A price change re-derives the tier without touching what was tagged by hand.
check("a price-only file moves the budget tier and nothing else",
  termIdsForUpdate(existing, [{ id: "t-budget2", axis: "BUDGET" }], new Set(["BUDGET"])),
  ["t-cat", "t-purpose", "t-industry", "t-budget2"]);
// An empty cell clears here too — that is how a category is deliberately removed.
check("an empty category column clears that axis alone",
  termIdsForUpdate(existing, [], new Set(["PRODUCT"])),
  ["t-purpose", "t-industry", "t-budget"]);
check("a term already attached is not duplicated",
  termIdsForUpdate(existing, [{ id: "t-cat", axis: "PRODUCT" }], new Set(["PRODUCT"])),
  ["t-purpose", "t-industry", "t-budget", "t-cat"]);
check("a file with every axis replaces the lot",
  termIdsForUpdate(existing, [{ id: "n1", axis: "PRODUCT" }, { id: "n2", axis: "BUDGET" }],
    new Set(["PRODUCT", "PURPOSE", "INDUSTRY", "BUDGET"])),
  ["n1", "n2"]);

// --------------------------------------------------- the whole-file case
// The grid and a full template still behave exactly as they did.
const full = parse(
  "slug,name_en,material,colours,availability,visibility\ntote,Canvas Tote,Canvas,Black|Navy,READY_STOCK,PUBLISHED\n",
);
const fullUpdate = updateFields(full.rows[0], full.present);
check("a file that carries a column writes it",
  [fullUpdate.material, fullUpdate.colours, fullUpdate.availability, fullUpdate.visibility],
  ["Canvas", ["Black", "Navy"], "READY_STOCK", "PUBLISHED"]);
// 21 columns, 22 fields — indicative_price writes both ends of a range.
check("ALL_COLUMNS writes every field a product has",
  Object.keys(updateFields(full.rows[0], ALL_COLUMNS)).sort(),
  ["availability", "capacity", "colours", "customisation", "dimensions",
   "featured", "heroImage", "indicativePrice", "indicativePriceMax", "isNew",
   "leadTime", "material", "moq", "nameEn", "nameId", "shortEn", "shortId",
   "tagsEn", "tagsId", "visibility", "whyEn", "whyId"]);
// Every field a create writes must be reachable from some column, or an
// importer could set something no spreadsheet can ever correct.
check("no field is writable on create but unreachable on update",
  Object.keys(productData(full.rows[0])).sort(),
  Object.keys(updateFields(full.rows[0], ALL_COLUMNS)).sort());
