import Papa from "papaparse";
import { budgetTierFor } from "@/content/taxonomy";

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
 */

export const IMPORT_COLUMNS = [
  "slug", "name_en", "name_id", "short_en", "short_id", "why_en", "why_id",
  "category", "purposes", "industries", "availability", "indicative_price",
  "material", "dimensions", "capacity", "colours", "moq", "lead_time",
  "customisation", "tags_en", "tags_id", "hero_image", "featured", "is_new",
  "visibility",
] as const;

const AVAILABILITY = new Set([
  "READY_STOCK", "LOCAL_PRODUCTION", "IMPORT_SOURCING", "CUSTOM_MADE",
]);
const VISIBILITY = new Set(["DRAFT", "PUBLISHED", "HIDDEN"]);

export type ParsedRow = {
  line: number;
  slug: string;
  nameEn: string;
  nameId: string | null;
  shortEn: string;
  shortId: string | null;
  whyEn: string | null;
  whyId: string | null;
  termSlugs: string[];
  availability: string;
  indicativePrice: number | null;
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

const list = (v: string | undefined) =>
  (v ?? "").split(/[|;]/).map((s) => s.trim()).filter(Boolean);

const text = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const bool = (v: string | undefined) =>
  ["1", "true", "yes", "y"].includes((v ?? "").trim().toLowerCase());

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseProductCsv(csv: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const headers = parsed.meta.fields ?? [];
  // Only these two are structurally required; everything else has a sensible
  // default, because demanding a full row for every product would make the
  // import unusable for a partially-written catalogue.
  const required = ["name_en", "short_en"];
  const missingColumns = required.filter((c) => !headers.includes(c));
  if (missingColumns.length > 0) {
    return { rows: [], errors: [], missingColumns };
  }

  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  parsed.data.forEach((raw, i) => {
    // +2: one for the header row, one because humans count from 1.
    const line = i + 2;

    const nameEn = (raw.name_en ?? "").trim();
    if (!nameEn) {
      errors.push({ line, problem: "Missing name_en — every product needs an English name." });
      return;
    }

    const shortEn = (raw.short_en ?? "").trim();
    if (!shortEn) {
      errors.push({ line, slug: raw.slug, problem: `"${nameEn}" has no short_en. That one line is what makes the card read as an idea rather than a listing.` });
      return;
    }

    const slug = (raw.slug ?? "").trim() || slugify(nameEn);
    if (seen.has(slug)) {
      errors.push({ line, slug, problem: `Duplicate slug "${slug}" — it also appears earlier in this file.` });
      return;
    }
    seen.add(slug);

    const availability = (raw.availability ?? "").trim().toUpperCase() || "LOCAL_PRODUCTION";
    if (!AVAILABILITY.has(availability)) {
      errors.push({ line, slug, problem: `Availability "${raw.availability}" is not one of: ${[...AVAILABILITY].join(", ")}.` });
      return;
    }

    const visibility = (raw.visibility ?? "").trim().toUpperCase() || "DRAFT";
    if (!VISIBILITY.has(visibility)) {
      errors.push({ line, slug, problem: `Visibility "${raw.visibility}" is not one of: ${[...VISIBILITY].join(", ")}.` });
      return;
    }

    let price: number | null = null;
    const rawPrice = (raw.indicative_price ?? "").replace(/[^\d]/g, "");
    if (rawPrice) {
      price = Number(rawPrice);
      if (!Number.isFinite(price)) {
        errors.push({ line, slug, problem: `Could not read indicative_price "${raw.indicative_price}" as a number.` });
        return;
      }
    }

    const moqRaw = (raw.moq ?? "").replace(/[^\d]/g, "");

    // Budget tier is derived from price rather than tagged by hand — at this
    // catalogue size a fourth axis of manual tagging is not workable.
    const tier = price !== null ? budgetTierFor(price) : null;

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
      shortEn,
      shortId: text(raw.short_id),
      whyEn: text(raw.why_en),
      whyId: text(raw.why_id),
      termSlugs,
      availability,
      indicativePrice: price,
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
    "READY_STOCK", "45000", "12oz cotton canvas", "38 x 42 cm", "",
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
