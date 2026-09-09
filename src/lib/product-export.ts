import { priceToInput } from "./price";
import { IMPORT_COLUMNS } from "./product-grid";

/**
 * Export the catalogue in the import template's own shape — the other half of
 * FR-10.11.
 *
 * The point is the round trip, not the download. An operator who has to
 * correct two hundred lead times has no workable route through the one-product
 * form, and re-typing them into the grid means re-typing the columns that were
 * already right. Exporting, editing in a spreadsheet and importing back is the
 * only bulk *edit* the system has, and it works only because the importer
 * matches on slug and upserts: what comes out of here goes back in as a
 * correction rather than as a second copy of the catalogue.
 *
 * That makes the column order and the separators a contract with
 * `parseProductCsv`, not a presentation choice. Both ends read IMPORT_COLUMNS,
 * and lists are joined with the bar the importer splits on.
 */

/** Only what the CSV needs — the route's `select` is written to match. */
export type ExportableProduct = {
  slug: string;
  nameEn: string;
  nameId: string | null;
  shortEn: string | null;
  shortId: string | null;
  whyEn: string | null;
  whyId: string | null;
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
  terms: { axis: string; slugEn: string }[];
  /**
   * Stills only, in display order — the photo column falls back to the first
   * of these when no hero has been set. Optional because the CSV export has no
   * use for it and should not pay for the join.
   */
  gallery?: { publicId: string }[];
};

/** What the exported file is called. Dated, because it is a snapshot. */
export function productExportFilename(date = new Date()) {
  return `kadokowe-products-${date.toISOString().slice(0, 10)}.csv`;
}

// Quote every field. Product copy routinely carries commas and quotation
// marks, and "why we like it" is a whole sentence — deciding per value which
// ones need escaping is how one stray comma shifts a row by a column.
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const bar = (v: string[]) => v.join(" | ");

export function productsToCsv(products: ExportableProduct[]): string {
  const body = products.map((p) => {
    // BUDGET is deliberately absent. The importer derives the tier from
    // indicative_price and there is no column to put it in, so writing it out
    // would only invite an operator to edit a value that has no effect.
    const axis = (name: string) =>
      bar(p.terms.filter((t) => t.axis === name).map((t) => t.slugEn));

    const row: Record<string, string> = {
      slug: p.slug,
      name_en: p.nameEn,
      name_id: p.nameId ?? "",
      short_en: p.shortEn ?? "",
      short_id: p.shortId ?? "",
      why_en: p.whyEn ?? "",
      why_id: p.whyId ?? "",
      category: axis("PRODUCT"),
      purposes: axis("PURPOSE"),
      industries: axis("INDUSTRY"),
      availability: p.availability,
      indicative_price: priceToInput(p.indicativePrice, p.indicativePriceMax),
      material: p.material ?? "",
      dimensions: p.dimensions ?? "",
      capacity: p.capacity ?? "",
      colours: bar(p.colours),
      moq: p.moq === null ? "" : String(p.moq),
      lead_time: p.leadTime ?? "",
      customisation: bar(p.customisation),
      tags_en: bar(p.tagsEn),
      tags_id: bar(p.tagsId),
      hero_image: p.heroImage ?? "",
      featured: String(p.featured),
      is_new: String(p.isNew),
      visibility: p.visibility,
    };

    return IMPORT_COLUMNS.map((c) => esc(row[c])).join(",");
  });

  return [IMPORT_COLUMNS.join(","), ...body].join("\n");
}
