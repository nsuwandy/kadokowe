import type { ParsedRow, PresentColumns } from "./product-import";
import type { ImportColumn } from "./product-grid";

/**
 * What an import should change — decided separately from carrying it out.
 *
 * The rule these encode is that an update touches only the columns the file
 * actually carried. Getting it wrong is expensive and quiet: a CSV of
 * `slug,name_en` used to blank material, colours, lead time, every tag and
 * every taxonomy term on every product it matched, and reset availability,
 * visibility and both flags to their defaults, reporting all of it as a
 * successful import.
 *
 * Kept out of `product-import-run` so the rule can be tested without a
 * database. The writer there is then a thin thing that does as it is told,
 * which is the part that does not need arguing about.
 */

/**
 * Which product fields each import column is responsible for.
 *
 * The authority on what an absent column protects. `slug` is deliberately
 * absent from it: it is the key an update is matched on, never something an
 * update writes.
 */
export const COLUMN_FIELDS = {
  name_en: ["nameEn"],
  name_id: ["nameId"],
  short_en: ["shortEn"],
  short_id: ["shortId"],
  why_en: ["whyEn"],
  why_id: ["whyId"],
  material: ["material"],
  dimensions: ["dimensions"],
  capacity: ["capacity"],
  colours: ["colours"],
  moq: ["moq"],
  lead_time: ["leadTime"],
  customisation: ["customisation"],
  availability: ["availability"],
  // One column, two fields: a range writes both ends of it.
  indicative_price: ["indicativePrice", "indicativePriceMax"],
  tags_en: ["tagsEn"],
  tags_id: ["tagsId"],
  hero_image: ["heroImage"],
  featured: ["featured"],
  is_new: ["isNew"],
  visibility: ["visibility"],
} as const satisfies Partial<Record<ImportColumn, readonly string[]>>;

/**
 * Which taxonomy axis each column feeds.
 *
 * Terms need axis-by-axis treatment because one relation is fed by four
 * different columns. Replacing the whole relation whenever any of them appears
 * would mean a file carrying only `category` dropped every purpose and
 * industry — the same bug in a smaller room. BUDGET is derived from the price
 * rather than typed, so the price column is what governs it.
 */
export const AXIS_COLUMNS = {
  category: "PRODUCT",
  purposes: "PURPOSE",
  industries: "INDUSTRY",
  indicative_price: "BUDGET",
} as const satisfies Partial<Record<ImportColumn, string>>;

/** Every field an import can write, as a create would write them. */
export function productData(row: ParsedRow) {
  return {
    nameEn: row.nameEn, nameId: row.nameId,
    shortEn: row.shortEn, shortId: row.shortId,
    whyEn: row.whyEn, whyId: row.whyId,
    material: row.material, dimensions: row.dimensions, capacity: row.capacity,
    colours: row.colours, moq: row.moq, leadTime: row.leadTime,
    customisation: row.customisation,
    availability: row.availability,
    indicativePrice: row.indicativePrice,
    indicativePriceMax: row.indicativePriceMax,
    tagsEn: row.tagsEn, tagsId: row.tagsId,
    heroImage: row.heroImage,
    featured: row.featured, isNew: row.isNew,
    visibility: row.visibility,
  };
}

/** The axes this file is entitled to rewrite. */
export function axesReplacedBy(present: PresentColumns): Set<string> {
  return new Set(
    Object.entries(AXIS_COLUMNS)
      .filter(([column]) => present.has(column as ImportColumn))
      .map(([, axis]) => axis),
  );
}

/**
 * The fields an update should write — those whose column was in the file.
 *
 * A create uses `productData` whole instead: there, an absent column really
 * does mean "use the default", because there is nothing yet to preserve.
 */
export function updateFields(
  row: ParsedRow,
  present: PresentColumns,
): Record<string, unknown> {
  const data = productData(row) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  for (const [column, fields] of Object.entries(COLUMN_FIELDS)) {
    if (!present.has(column as ImportColumn)) continue;
    for (const field of fields) update[field] = data[field];
  }
  return update;
}

/**
 * The complete term set an update should end up with, or null to leave the
 * relation alone.
 *
 * Terms of an untouched axis are carried over as they are; the axes this file
 * speaks for are replaced by what it says — including when what it says is
 * nothing, which is how a category is deliberately cleared.
 */
export function termIdsForUpdate(
  existing: readonly { id: string; axis: string }[],
  incoming: readonly { id: string; axis: string }[],
  replacedAxes: ReadonlySet<string>,
): string[] | null {
  if (replacedAxes.size === 0) return null;
  const kept = existing.filter((t) => !replacedAxes.has(t.axis));
  const replaced = incoming.filter((t) => replacedAxes.has(t.axis));
  return [...new Set([...kept, ...replaced].map((t) => t.id))];
}
