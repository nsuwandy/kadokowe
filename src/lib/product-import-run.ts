import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ParsedRow, RowError } from "@/lib/product-import";

/**
 * Writes validated rows to the catalogue — the shared tail of both import
 * front ends (FR-10.11).
 *
 * Products are matched on slug and upserted, so re-running an import is a
 * correction rather than a duplication. That property is what makes the grid
 * safe to use as a working surface: the operator can fix three rows and press
 * Import again without first hunting down what the previous run created.
 */
export async function writeParsedRows(
  rows: ParsedRow[],
): Promise<{ imported: number; issues: RowError[] }> {
  const issues: RowError[] = [];
  let imported = 0;

  for (const row of rows) {
    try {
      const terms = row.termSlugs.length
        ? await db.taxonomyTerm.findMany({
            where: { slugEn: { in: row.termSlugs } },
            select: { id: true, slugEn: true },
          })
        : [];

      // An unrecognised tag is reported but does not fail the row — one typo
      // should not cost the operator the whole product.
      const found = new Set(terms.map((t) => t.slugEn));
      const unknown = row.termSlugs.filter((s) => !found.has(s));

      const data = {
        nameEn: row.nameEn, nameId: row.nameId,
        shortEn: row.shortEn, shortId: row.shortId,
        whyEn: row.whyEn, whyId: row.whyId,
        material: row.material, dimensions: row.dimensions, capacity: row.capacity,
        colours: row.colours, moq: row.moq, leadTime: row.leadTime,
        customisation: row.customisation,
        availability: row.availability as never,
        indicativePrice: row.indicativePrice,
        indicativePriceMax: row.indicativePriceMax,
        tagsEn: row.tagsEn, tagsId: row.tagsId,
        heroImage: row.heroImage,
        featured: row.featured, isNew: row.isNew,
        visibility: row.visibility as never,
      };

      await db.product.upsert({
        where: { slug: row.slug },
        update: { ...data, terms: { set: terms.map((t) => ({ id: t.id })) } },
        create: { ...data, slug: row.slug, terms: { connect: terms.map((t) => ({ id: t.id })) } },
      });
      imported += 1;

      if (unknown.length > 0) {
        issues.push({
          line: row.line,
          slug: row.slug,
          problem: `Imported, but these tags were not recognised and were skipped: ${unknown.join(", ")}.`,
        });
      }
    } catch (error) {
      issues.push({
        line: row.line,
        slug: row.slug,
        problem: error instanceof Error ? error.message : "Could not save this row.",
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { imported, issues };
}
