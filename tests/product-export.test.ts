/** Run with: npm test */
import { productsToCsv, type ExportableProduct } from "../src/lib/product-export";
import { parseProductCsv } from "../src/lib/product-import";
import { IMPORT_COLUMNS as ALL } from "../src/lib/product-grid";
import { IMPORT_COLUMNS } from "../src/lib/product-grid";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const product = (over: Partial<ExportableProduct> = {}): ExportableProduct => ({
  slug: "canvas-tote-bag",
  nameEn: "Canvas Tote Bag",
  nameId: "Tas Tote Kanvas",
  shortEn: "The canvas everyone keeps.",
  shortId: null,
  whyEn: null,
  whyId: null,
  availability: "READY_STOCK",
  indicativePrice: 30000,
  indicativePriceMax: 45000,
  material: "12oz cotton canvas",
  dimensions: "38 x 42 cm",
  capacity: null,
  colours: ["Natural", "Black"],
  moq: 300,
  leadTime: "10-14 days",
  customisation: ["Logo printing"],
  tagsEn: ["Events"],
  tagsId: ["Acara"],
  heroImage: null,
  featured: false,
  isNew: true,
  visibility: "PUBLISHED",
  terms: [
    { axis: "PRODUCT", slugEn: "bags-carry" },
    { axis: "PURPOSE", slugEn: "corporate-gifts" },
    { axis: "PURPOSE", slugEn: "exhibition" },
    { axis: "INDUSTRY", slugEn: "retail" },
    // Derived from price on the way in; must not come back out as a column.
    { axis: "BUDGET", slugEn: "25-50k" },
  ],
  ...over,
});

check("header is the import template's own columns",
  productsToCsv([]).split("\n")[0], IMPORT_COLUMNS.join(","));
// The importer now only writes the columns a file carries, so a full export
// re-imported must still declare every one of them — otherwise the round trip
// would quietly stop updating whatever the export had dropped.
check("a full export carries every column, so it updates every field",
  [...parseProductCsv(productsToCsv([])).present].sort(), [...ALL].sort());

// The whole point of the feature: a file that goes straight back in.
const round = (p: ExportableProduct) => {
  const result = parseProductCsv(productsToCsv([p]));
  check(`no missing columns (${p.slug})`, result.missingColumns, []);
  check(`no errors (${p.slug})`, result.errors, []);
  return result.rows[0];
};

const back = round(product());
check("slug survives", back.slug, "canvas-tote-bag");
check("name survives", back.nameEn, "Canvas Tote Bag");
check("price range survives", [back.indicativePrice, back.indicativePriceMax], [30000, 45000]);
check("colours survive", back.colours, ["Natural", "Black"]);
check("moq survives", back.moq, 300);
check("booleans survive", [back.featured, back.isNew], [false, true]);
check("visibility survives — an export must not silently unpublish", back.visibility, "PUBLISHED");
check("availability survives", back.availability, "READY_STOCK");
// Terms come back on all three axes, and the budget tier is re-derived from
// the price rather than carried across as an editable column.
check("terms survive, budget re-derived once — not duplicated", back.termSlugs.sort(),
  ["25-50k", "bags-carry", "corporate-gifts", "exhibition", "retail"]);

// Copy carries commas, quotes and the occasional newline. Any of these
// shifting a row by one column would corrupt every field after it.
const awkward = round(product({
  slug: "awkward",
  nameEn: 'Mug, "Classic"',
  whyEn: "One line.\nAnother line.",
  colours: ["Off, White", "Black"],
}));
check("comma and quotes in a name", awkward.nameEn, 'Mug, "Classic"');
check("newline inside a field", awkward.whyEn, "One line.\nAnother line.");
check("a comma inside a list value", awkward.colours, ["Off, White", "Black"]);

// Empty optional fields must come back empty, not as the string "null".
const bare = round(product({
  slug: "bare", nameId: null, shortEn: null, material: null,
  indicativePrice: null, indicativePriceMax: null, moq: null,
  colours: [], tagsEn: [], tagsId: [], customisation: [], terms: [],
}));
check("blank text is null", [bare.nameId, bare.shortEn, bare.material], [null, null, null]);
check("blank price is null", [bare.indicativePrice, bare.indicativePriceMax], [null, null]);
check("blank moq is null", bare.moq, null);
check("blank lists are empty", [bare.colours, bare.tagsEn, bare.termSlugs], [[], [], []]);

// A single figure must not come back as a range of itself.
const single = round(product({ slug: "single", indicativePrice: 45000, indicativePriceMax: null }));
check("single price stays single", [single.indicativePrice, single.indicativePriceMax], [45000, null]);
