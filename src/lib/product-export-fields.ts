import { formatPrice } from "./price";
import type { ExportableProduct } from "./product-export";

/**
 * The columns a presentation export can carry — the Excel and PDF sheets.
 *
 * Deliberately a different list from `productsToCsv`'s. That one exists to go
 * back into the importer, so it writes machine values: `READY_STOCK`, `true`,
 * `30000-45000`. This one is read by a person — a buyer looking at a sheet
 * Kadokowe sent them — so it writes "Ready stock", "Yes", "Rp 30.000–45.000".
 * Trying to serve both from one list would mean picking which of the two
 * audiences to disappoint.
 */

export type ExportFieldKey = string;

export type ExportField = {
  key: ExportFieldKey;
  label: string;
  /** Rough character width, used for the Excel column and the PDF layout. */
  width: number;
  value: (p: ExportableProduct, index: number) => string;
  /** Grouping in the picker, so 25 checkboxes are not one undifferentiated wall. */
  group: "Identity" | "Description" | "Specification" | "Classification" | "Commercial";
  /** Ticked when the page is first opened. */
  standard?: boolean;
};

const bar = (v: string[]) => v.join(", ");
const axis = (p: ExportableProduct, name: string) =>
  bar(p.terms.filter((t) => t.axis === name).map((t) => t.slugEn));

const AVAILABILITY_LABELS: Record<string, string> = {
  READY_STOCK: "Ready stock",
  LOCAL_PRODUCTION: "Local production",
  IMPORT_SOURCING: "Import & sourcing",
  CUSTOM_MADE: "Custom made",
};

/**
 * The running reference printed down the sheet — KDKW-001, KDKW-002.
 *
 * Numbered per file, not stored on the product. It orders and points at a row
 * within *this* sheet, which is what a buyer needs while reading it, but two
 * sheets exported a month apart will not agree about which product is 014 —
 * so it is off unless asked for, and should not be quoted back as a part
 * number.
 */
export const CODE_PREFIX = "KDKW";

export function exportCode(index: number): string {
  return `${CODE_PREFIX}-${String(index + 1).padStart(3, "0")}`;
}

/** The photograph. Handled by each writer directly, not through `value`. */
export const PHOTO_FIELD = "photo";

export const EXPORT_FIELDS: readonly ExportField[] = [
  {
    key: "code", label: "Code", width: 11, group: "Identity",
    value: (_p, i) => exportCode(i),
  },
  {
    key: PHOTO_FIELD, label: "Photo", width: 14, group: "Identity", standard: true,
    // The writers draw the picture; this is what a text-only format falls back
    // to, and what the cell holds underneath the image in Excel.
    value: (p) => p.heroImage ?? p.gallery?.[0]?.publicId ?? "",
  },
  {
    key: "name_en", label: "Name", width: 30, group: "Identity", standard: true,
    value: (p) => p.nameEn,
  },
  {
    key: "name_id", label: "Name (Indonesian)", width: 30, group: "Identity",
    value: (p) => p.nameId ?? "",
  },
  {
    key: "slug", label: "Web address", width: 24, group: "Identity",
    value: (p) => p.slug,
  },

  {
    key: "short_en", label: "One-liner", width: 36, group: "Description", standard: true,
    value: (p) => p.shortEn ?? "",
  },
  {
    key: "short_id", label: "One-liner (Indonesian)", width: 36, group: "Description",
    value: (p) => p.shortId ?? "",
  },
  {
    key: "why_en", label: "Why we like it", width: 44, group: "Description",
    value: (p) => p.whyEn ?? "",
  },
  {
    key: "why_id", label: "Why we like it (Indonesian)", width: 44, group: "Description",
    value: (p) => p.whyId ?? "",
  },

  {
    key: "material", label: "Material", width: 24, group: "Specification", standard: true,
    value: (p) => p.material ?? "",
  },
  {
    key: "dimensions", label: "Dimensions", width: 18, group: "Specification", standard: true,
    value: (p) => p.dimensions ?? "",
  },
  {
    key: "capacity", label: "Capacity", width: 14, group: "Specification", standard: true,
    value: (p) => p.capacity ?? "",
  },
  {
    key: "colours", label: "Colours", width: 26, group: "Specification", standard: true,
    value: (p) => bar(p.colours),
  },
  {
    key: "customisation", label: "Customisation", width: 30, group: "Specification",
    value: (p) => bar(p.customisation),
  },

  {
    key: "category", label: "Category", width: 20, group: "Classification", standard: true,
    value: (p) => axis(p, "PRODUCT"),
  },
  {
    key: "purposes", label: "Purposes", width: 24, group: "Classification",
    value: (p) => axis(p, "PURPOSE"),
  },
  {
    key: "industries", label: "Industries", width: 24, group: "Classification",
    value: (p) => axis(p, "INDUSTRY"),
  },
  {
    key: "tags_en", label: "Tags", width: 24, group: "Classification",
    value: (p) => bar(p.tagsEn),
  },
  {
    key: "tags_id", label: "Tags (Indonesian)", width: 24, group: "Classification",
    value: (p) => bar(p.tagsId),
  },

  {
    key: "indicative_price", label: "Indicative price", width: 20, group: "Commercial", standard: true,
    value: (p) => formatPrice(p.indicativePrice, p.indicativePriceMax) ?? "",
  },
  {
    key: "availability", label: "Availability", width: 18, group: "Commercial", standard: true,
    value: (p) => AVAILABILITY_LABELS[p.availability] ?? p.availability,
  },
  {
    key: "moq", label: "Minimum order", width: 14, group: "Commercial", standard: true,
    value: (p) => (p.moq === null ? "" : String(p.moq)),
  },
  {
    key: "lead_time", label: "Lead time", width: 16, group: "Commercial", standard: true,
    value: (p) => p.leadTime ?? "",
  },
  {
    key: "visibility", label: "Status", width: 13, group: "Commercial",
    value: (p) => p.visibility.charAt(0) + p.visibility.slice(1).toLowerCase(),
  },
  {
    key: "featured", label: "Featured", width: 11, group: "Commercial",
    value: (p) => (p.featured ? "Yes" : ""),
  },
  {
    key: "is_new", label: "New", width: 9, group: "Commercial",
    value: (p) => (p.isNew ? "Yes" : ""),
  },
];

export const FIELD_GROUPS = ["Identity", "Description", "Specification", "Classification", "Commercial"] as const;

const BY_KEY = new Map(EXPORT_FIELDS.map((f) => [f.key, f]));

export const STANDARD_FIELD_KEYS = EXPORT_FIELDS.filter((f) => f.standard).map((f) => f.key);

/**
 * Turn the picker's ticks into columns.
 *
 * Unknown keys are dropped rather than rejected — a stale bookmarked URL
 * should still produce a sheet. An empty selection falls back to the standard
 * set, because a file with no columns is not a smaller answer to the request,
 * it is a broken one.
 */
export function selectedFields(keys: string[]): ExportField[] {
  const chosen = keys.map((k) => BY_KEY.get(k)).filter((f): f is ExportField => f !== undefined);
  if (chosen.length === 0) {
    return EXPORT_FIELDS.filter((f) => f.standard);
  }
  // Kept in the registry's own order, not the order the checkboxes happened to
  // submit, so every export of the same selection looks the same.
  return EXPORT_FIELDS.filter((f) => chosen.includes(f));
}
