/**
 * Run with: npm test
 *
 * Builds a real workbook and a real PDF and looks inside them. The writers are
 * the part of the export most able to fail quietly — a picture anchored to the
 * wrong row, or to no row, still produces a file that opens.
 */
import { unzipSync, strFromU8 } from "fflate";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import { productsToXlsx } from "../src/lib/product-export-xlsx";
import { productsToPdf } from "../src/lib/product-export-pdf";
import { selectedFields } from "../src/lib/product-export-fields";
import type { ExportableProduct } from "../src/lib/product-export";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const JPEG = new Uint8Array(readFileSync(new URL("./fixtures/swatch.jpg", import.meta.url)));

// Cloudinary is stood in for: the writers' job is to place bytes correctly,
// and a test that needed the network would fail for reasons that are not bugs.
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test-cloud";
const asked: string[] = [];
globalThis.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  asked.push(url);
  // One product's photo is missing, to prove a gap is survivable.
  if (url.includes("missing-photo")) return new Response("nope", { status: 404 });
  return new Response(JPEG.slice() as unknown as BodyInit, { status: 200 });
}) as typeof fetch;

const product = (over: Partial<ExportableProduct> = {}): ExportableProduct => ({
  slug: "canvas-tote-bag", nameEn: "Canvas Tote Bag", nameId: null,
  shortEn: "The canvas everyone keeps.", shortId: null, whyEn: null, whyId: null,
  availability: "READY_STOCK", indicativePrice: 30000, indicativePriceMax: 45000,
  material: "12oz cotton canvas", dimensions: "38 x 42 cm", capacity: null,
  colours: ["Natural", "Black"], moq: 300, leadTime: "10-14 days",
  customisation: [], tagsEn: [], tagsId: [],
  heroImage: "kadokowe/tote-hero", featured: false, isNew: false,
  visibility: "PUBLISHED",
  terms: [{ axis: "PRODUCT", slugEn: "bags-carry" }],
  gallery: [],
  ...over,
});

const products = [
  product(),
  product({ slug: "mug", nameEn: "Enamel Mug", heroImage: "kadokowe/missing-photo" }),
  product({ slug: "pen", nameEn: "Bamboo Pen", heroImage: null, gallery: [{ publicId: "kadokowe/pen-1" }] }),
];

const fields = selectedFields(["code", "photo", "name_en", "material", "indicative_price"]);

// ------------------------------------------------------------------ excel
const xlsx = await productsToXlsx(products, fields, { includePhotos: true });
check("workbook is a zip", String.fromCharCode(...xlsx.bytes.slice(0, 2)), "PK");
check("nothing was skipped for the cap", xlsx.photosSkipped, 0);

const zip = unzipSync(xlsx.bytes);
const names = Object.keys(zip);
// Two of the three products have a reachable photo; the 404 must not become
// a broken image part.
// Zips carry directory entries too, so count actual parts.
const media = names.filter((n) => n.startsWith("xl/media/") && zip[n].length > 0);
check("one media part per fetched photo", media.length, 2);
check("a drawing layer exists to anchor them", names.includes("xl/drawings/drawing1.xml"), true);
check("the sheet references its drawing",
  strFromU8(zip["xl/worksheets/sheet1.xml"]).includes("<drawing"), true);

const drawing = strFromU8(zip["xl/drawings/drawing1.xml"]);
// Row indices are zero-based in the drawing XML, and row 0 is the header — so
// the first product's picture belongs to row 1, not row 0. Anchoring off by
// one is the classic way these sheets go wrong, and it still opens cleanly.
const rows = [...drawing.matchAll(/<xdr:row>(\d+)<\/xdr:row>/g)].map((m) => Number(m[1]));
check("no picture is anchored over the header row", rows.includes(0), false);
check("pictures sit on the product rows that had one", [...new Set(rows)].sort(), [1, 3]);

const shared = strFromU8(zip["xl/sharedStrings.xml"]);
check("the running code is written down the sheet",
  ["KDKW-001", "KDKW-002", "KDKW-003"].every((c) => shared.includes(c)), true);
check("names are in the sheet", shared.includes("Canvas Tote Bag"), true);
check("prices are formatted for a reader", shared.includes("Rp 30.000–45.000"), true);
// The public ID is left in the cell only where no picture covers it.
check("the id of a missing photo stays as text", shared.includes("kadokowe/missing-photo"), true);
check("the id of a placed photo is cleared", shared.includes("kadokowe/tote-hero"), false);

// -------------------------------------------------------------------- pdf
const pdf = await productsToPdf(products, fields, {
  includePhotos: true, title: "Product catalogue", subtitle: "3 products",
});
check("pdf has a pdf header", String.fromCharCode(...pdf.bytes.slice(0, 5)), "%PDF-");
const reopened = await PDFDocument.load(pdf.bytes);
check("pdf opens and has a page", reopened.getPageCount() >= 1, true);
check("pdf is titled", reopened.getTitle(), "Product catalogue");

// ------------------------------------------------------------- no photos
asked.length = 0;
const text = await productsToXlsx(products, fields, { includePhotos: false });
check("photos off means no fetching at all", asked.length, 0);
const textZip = unzipSync(text.bytes);
check("and no media parts",
  Object.keys(textZip).filter((n) => n.startsWith("xl/media/") && textZip[n].length > 0).length, 0);
// With no picture over it, the public ID is the cell's value again.
check("the photo column falls back to the id as text",
  strFromU8(unzipSync(text.bytes)["xl/sharedStrings.xml"]).includes("kadokowe/tote-hero"), true);

// A sheet with no photo column must not fetch anything either, even asked to.
asked.length = 0;
await productsToXlsx(products, selectedFields(["name_en"]), { includePhotos: true });
check("no photo column means no fetching", asked.length, 0);

// Variants of one product routinely share a photograph. Embedding it once per
// row would multiply the file size by the size of the family.
const shared3 = [
  product({ slug: "a", nameEn: "A" }),
  product({ slug: "b", nameEn: "B" }),
  product({ slug: "c", nameEn: "C" }),
];
const deduped = await productsToXlsx(shared3, fields, { includePhotos: true });
const dedupedZip = unzipSync(deduped.bytes);
check("one shared photo is stored once, not three times",
  Object.keys(dedupedZip).filter((n) => n.startsWith("xl/media/") && dedupedZip[n].length > 0).length, 1);
check("but every row still gets a picture",
  [...strFromU8(dedupedZip["xl/drawings/drawing1.xml"]).matchAll(/<xdr:pic>/g)].length, 3);
