/** Run with: npm test */
import {
  EXPORT_FIELDS, STANDARD_FIELD_KEYS, selectedFields, exportCode, PHOTO_FIELD,
} from "../src/lib/product-export-fields";
import type { ExportableProduct } from "../src/lib/product-export";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const keys = (ks: string[]) => selectedFields(ks).map((f) => f.key);

// ------------------------------------------------------------- selection
check("empty selection falls back to the standard set — never an empty file",
  keys([]), STANDARD_FIELD_KEYS);
check("unknown keys are dropped, not fatal", keys(["name_en", "nonsense"]), ["name_en"]);
check("a selection of only unknown keys still yields a usable sheet",
  keys(["nonsense"]), STANDARD_FIELD_KEYS);
// Two operators ticking the same boxes in a different order must get the same
// file, so the registry's order wins over the form's.
check("registry order, not tick order",
  keys(["visibility", "name_en", "code"]), ["code", "name_en", "visibility"]);
check("no duplicates when a key is repeated", keys(["name_en", "name_en"]), ["name_en"]);

// ------------------------------------------------------------------ code
check("code is zero-padded from one", [exportCode(0), exportCode(9), exportCode(13)],
  ["KDKW-001", "KDKW-010", "KDKW-014"]);
check("code keeps counting past three digits", exportCode(999), "KDKW-1000");
// It is a per-file running number, so it must not be ticked by default.
check("code is off unless asked for", STANDARD_FIELD_KEYS.includes("code"), false);

// ----------------------------------------------------------------- values
const product = (over: Partial<ExportableProduct> = {}): ExportableProduct => ({
  slug: "canvas-tote-bag", nameEn: "Canvas Tote Bag", nameId: null,
  shortEn: null, shortId: null, whyEn: null, whyId: null,
  availability: "READY_STOCK", indicativePrice: 30000, indicativePriceMax: 45000,
  material: null, dimensions: null, capacity: null, colours: ["Natural", "Black"],
  moq: null, leadTime: null, customisation: [], tagsEn: [], tagsId: [],
  heroImage: "kadokowe/tote-hero", featured: true, isNew: false,
  visibility: "PUBLISHED",
  terms: [
    { axis: "PRODUCT", slugEn: "bags-carry" },
    { axis: "PURPOSE", slugEn: "corporate-gifts" },
    { axis: "BUDGET", slugEn: "25-50k" },
  ],
  gallery: [{ publicId: "kadokowe/tote-1" }],
  ...over,
});

const value = (key: string, p: ExportableProduct, i = 0) =>
  EXPORT_FIELDS.find((f) => f.key === key)!.value(p, i);

// This sheet is read by a buyer, not by the importer — so machine values are
// spelled out rather than passed through.
check("availability reads as English", value("availability", product()), "Ready stock");
check("price is formatted, not raw", value("indicative_price", product()), "Rp 30.000–45.000");
check("a single price has no range", value("indicative_price",
  product({ indicativePriceMax: null })), "Rp 30.000");
check("booleans read as Yes or nothing",
  [value("featured", product()), value("is_new", product())], ["Yes", ""]);
check("status is capitalised", value("visibility", product()), "Published");
check("lists are comma-separated for reading, not bar-separated",
  value("colours", product()), "Natural, Black");
// Budget terms are derived from price; showing them as a category would be
// showing the same fact twice.
check("category is the product axis alone", value("category", product()), "bags-carry");
check("purposes come from their own axis", value("purposes", product()), "corporate-gifts");
check("blank optionals are empty strings, not the word null",
  [value("material", product()), value("name_id", product())], ["", ""]);

// ------------------------------------------------------------------ photo
check("photo prefers the hero", value(PHOTO_FIELD, product()), "kadokowe/tote-hero");
check("photo falls back to the first gallery still",
  value(PHOTO_FIELD, product({ heroImage: null })), "kadokowe/tote-1");
check("no photo at all is empty, not undefined",
  value(PHOTO_FIELD, product({ heroImage: null, gallery: [] })), "");
check("a product fetched without its gallery does not crash",
  value(PHOTO_FIELD, product({ heroImage: null, gallery: undefined })), "");

// The running number counts rows of the sheet, so it follows the index it is
// given rather than anything on the product.
check("code follows position in the file",
  [value("code", product(), 0), value("code", product(), 41)], ["KDKW-001", "KDKW-042"]);
