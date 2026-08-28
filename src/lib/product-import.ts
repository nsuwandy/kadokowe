import Papa from "papaparse";
import { budgetTierFor } from "@/content/taxonomy";
import { parsePrice } from "./price";
import {
  AVAILABILITY_VALUES,
  VISIBILITY_VALUES,
  IMPORT_COLUMNS,
  type ImportColumn,
} from "./product-grid";

/**
 * Bulk product import — FR-10.11.
 *
 * This is the mechanism the Phase 1a/1b split depends on: launch with a
 * curated 150–250 products, then load the remainder without a developer. It
 * therefore has to be usable by a non-technical operator working from a
 * spreadsheet, and it has to fail in a way that tells them what to fix.
 *
 * Validation is per row, not per file. A 900-row spreadsheet with three bad
 * rows should import 897 and report the three by line number — rejecting the
 * whole file would mean hunting for the problem with no clue where it is.
 *
 * Two front ends feed this module: the CSV upload and the on-screen grid.
 * Both funnel through `normalizeRecords`, so a row typed into the grid is
 * validated by exactly the same code as a row read from a file. Two importers
 * would drift, and the one used less often would drift silently.
 */

// The column list and the two closed value sets live in product-grid so the
// grid can read them without pulling papaparse into the browser bundle.
export { IMPORT_COLUMNS, AVAILABILITY_VALUES, VISIBILITY_VALUES } from "./product-grid";
export type { ImportColumn } from "./product-grid";

const AVAILABILITY = new Set<string>(AVAILABILITY_VALUES);
const VISIBILITY = new Set<string>(VISIBILITY_VALUES);

export type ParsedRow = {
  line: number;
  slug: string;
  nameEn: string;
  nameId: string | null;
  shortEn: string | null;
  shortId: string | null;
  whyEn: string | null;
  whyId: string | null;
  termSlugs: string[];
  availability: string;
  indicativePrice: number | null;
  indicativePriceMax: number | null;
  material: string | null;
  dimensions: string | null;
  capacity: string | null;
  colours: string[];
  moq: number | null;
  leadTime: string | null;
  customisation: string[];
  tagsEn: string[];
  tagsId: string[];
  heroImage: string | null;
  featured: boolean;
  isNew: boolean;
  visibility: string;
};

export type RowError = { line: number; slug?: string; problem: string };

export type ParseResult = {
  rows: ParsedRow[];
  errors: RowError[];
  missingColumns: string[];
};

/** One record as it arrives from either front end: every value a raw string. */
export type ImportRecord = Partial<Record<ImportColumn, string>>;

const list = (v: string | undefined) =>
  (v ?? "").split(/[|;]/).map((s) => s.trim()).filter(Boolean);

const text = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const bool = (v: string | undefined) =>
  ["1", "true", "yes", "y"].includes((v ?? "").trim().toLowerCase());

export function slugifyName(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Validate and normalise records from either front end.
 *
 * `firstLine` is what the operator sees as row 1 of their own data: line 2 in
 * a CSV (the header occupies line 1), row 1 in the grid. Reporting a problem
 * against a number they cannot find on screen is the same as not reporting it.
 */
export function normalizeRecords(
  records: ImportRecord[],
  firstLine: number,
): { rows: ParsedRow[]; errors: RowError[] } {
  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  records.forEach((raw, i) => {
    const line = i + firstLine;

    const nameEn = (raw.name_en ?? "").trim();
    if (!nameEn) {
      errors.push({ line, problem: "Missing name_en — every product needs an English name." });
      return;
    }

    const slug = (raw.slug ?? "").trim() || slugifyName(nameEn);
    if (seen.has(slug)) {
      errors.push({ line, slug, problem: `Duplicate slug "${slug}" — it also appears earlier in this import.` });
      return;
    }
    seen.add(slug);

    const availability = (raw.availability ?? "").trim().toUpperCase() || "LOCAL_PRODUCTION";
    if (!AVAILABILITY.has(availability)) {
      errors.push({ line, slug, problem: `Availability "${raw.availability}" is not one of: ${AVAILABILITY_VALUES.join(", ")}.` });
      return;
    }

    const visibility = (raw.visibility ?? "").trim().toUpperCase() || "DRAFT";
    if (!VISIBILITY.has(visibility)) {
      errors.push({ line, slug, problem: `Visibility "${raw.visibility}" is not one of: ${VISIBILITY_VALUES.join(", ")}.` });
      return;
    }

    // A figure or a range. This used to strip every non-digit and call the
    // result a number, which turned "30000-45000" into three billion rather
    // than into a range — wrong by a factor of a hundred thousand, and silent.
    const price = parsePrice(raw.indicative_price);
    if (raw.indicative_price?.trim() && price === null) {
      errors.push({ line, slug, problem: `Could not read indicative_price "${raw.indicative_price}" as a price. Use 45000, or 30000-45000 for a range.` });
      return;
    }

    const moqRaw = (raw.moq ?? "").replace(/[^\d]/g, "");

    // Budget tier is derived from price rather than tagged by hand — at this
    // catalogue size a fourth axis of manual tagging is not workable.
    const tier = price !== null ? budgetTierFor(price.min) : null;

    const termSlugs = [
      ...list(raw.category),
      ...list(raw.purposes),
      ...list(raw.industries),
      ...(tier ? [tier] : []),
    ];

    rows.push({
      line,
      slug,
      nameEn,
      nameId: text(raw.name_id),
      shortEn: text(raw.short_en),
      shortId: text(raw.short_id),
      whyEn: text(raw.why_en),
      whyId: text(raw.why_id),
      termSlugs,
      availability,
      indicativePrice: price?.min ?? null,
      indicativePriceMax: price?.max ?? null,
      material: text(raw.material),
      dimensions: text(raw.dimensions),
      capacity: text(raw.capacity),
      colours: list(raw.colours),
      moq: moqRaw ? Number(moqRaw) : null,
      leadTime: text(raw.lead_time),
      customisation: list(raw.customisation),
      tagsEn: list(raw.tags_en),
      tagsId: list(raw.tags_id),
      heroImage: text(raw.hero_image),
      featured: bool(raw.featured),
      isNew: bool(raw.is_new),
      visibility,
    });
  });

  return { rows, errors };
}

export function parseProductCsv(csv: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const headers = parsed.meta.fields ?? [];
  // The name is the only structurally required column. The one-liner was
  // required too until the catalogue revision, which meant a supplier list
  // could not be loaded until someone had written a sentence for every row —
  // and the products arrive well before the copy for them does.
  const required = ["name_en"];
  const missingColumns = required.filter((c) => !headers.includes(c));
  if (missingColumns.length > 0) {
    return { rows: [], errors: [], missingColumns };
  }

  // +2: one for the header row, one because humans count from 1.
  const { rows, errors } = normalizeRecords(parsed.data as ImportRecord[], 2);
  return { rows, errors, missingColumns: [] };
}

/** A template the operator can open in a spreadsheet and fill in. */
export function importTemplateCsv() {
  const example = [
    "canvas-tote-bag", "Canvas Tote Bag", "Tas Tote Kanvas",
    "The canvas everyone keeps.", "Kanvas yang semua orang simpan.",
    "Sturdy enough to outlive the event it was made for.",
    "Cukup kuat untuk bertahan lebih lama dari acaranya.",
    "bags-carry", "corporate-gifts|exhibition", "retail|events",
    "READY_STOCK", "30000-45000", "12oz cotton canvas", "38 x 42 cm", "",
    "Natural|Black", "300", "10-14 days",
    "Full-surface print|Logo printing", "Events|Retail", "Acara|Ritel",
    "", "false", "true", "DRAFT",
  ];
  return `${IMPORT_COLUMNS.join(",")}\n${example.map((v) => (v.includes(",") ? `"${v}"` : v)).join(",")}\n`;
}

/**
 * Result shape for the bulk import action.
 *
 * Lives here rather than beside the action because a "use server" module may
 * only export async functions — exporting a plain object from one yields
 * undefined at the import site, which is exactly how this was first written.
 */
export type ImportState = {
  ran: boolean;
  imported: number;
  issues: RowError[];
  missingColumns: string[];
  message?: string;
};

export const emptyImportState: ImportState = {
  ran: false,
  imported: 0,
  issues: [],
  missingColumns: [],
};
