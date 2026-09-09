import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ParsedRow, PresentColumns, RowError } from "@/lib/product-import";
import {
  axesReplacedBy,
  productData,
  termIdsForUpdate,
  updateFields,
} from "@/lib/product-import-plan";

/**
 * Writes validated rows to the catalogue — the shared tail of both import
 * front ends (FR-10.11).
 *
 * Products are matched on slug — found and updated, or created — so re-running
 * an import is a correction rather than a duplication. That property is what
 * makes the grid safe to use as a working surface: the operator can fix three
 * rows and press Import again without first hunting down what the previous run
 * created. It is a lookup rather than an upsert because the two branches no
 * longer write the same thing, and an update needs the product's existing
 * terms to know which axes it is leaving alone.
 *
 * An update touches only the columns the file actually carried. This is the
 * difference between an import that corrects three fields and one that
 * silently empties twenty: a CSV of `slug,name_en` used to blank material,
 * colours, lead time, every tag and every taxonomy term on every product it
 * matched, and reset availability, visibility and both flags to their
 * defaults. A create is unaffected — there a missing column genuinely does
 * mean "use the default".
 */

export async function writeParsedRows(
  rows: ParsedRow[],
  present: PresentColumns,
): Promise<{ imported: number; issues: RowError[] }> {
  const issues: RowError[] = [];
  let imported = 0;

  // An axis whose column is absent keeps whatever the product already has.
  const replacedAxes = axesReplacedBy(present);

  for (const row of rows) {
    try {
      const terms = row.termSlugs.length
        ? await db.taxonomyTerm.findMany({
            where: { slugEn: { in: row.termSlugs } },
            select: { id: true, slugEn: true, axis: true },
          })
        : [];

      // An unrecognised tag is reported but does not fail the row — one typo
      // should not cost the operator the whole product.
      const found = new Set(terms.map((t) => t.slugEn));
      const unknown = row.termSlugs.filter((s) => !found.has(s));

      const existing = await db.product.findUnique({
        where: { slug: row.slug },
        select: { id: true, terms: { select: { id: true, axis: true } } },
      });

      if (!existing) {
        // A create writes everything: an absent column here genuinely does
        // mean "use the default", because there is nothing yet to preserve.
        await db.product.create({
          data: {
            ...productData(row),
            availability: row.availability as never,
            visibility: row.visibility as never,
            slug: row.slug,
            terms: { connect: terms.map((t) => ({ id: t.id })) },
          },
        });
      } else {
        const ids = termIdsForUpdate(existing.terms, terms, replacedAxes);
        await db.product.update({
          where: { id: existing.id },
          data: {
            ...updateFields(row, present),
            // Left alone entirely when the file carries no taxonomy column and
            // no price, rather than rewritten to the value it already had.
            ...(ids === null ? {} : { terms: { set: ids.map((id) => ({ id })) } }),
          },
        });
      }
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
  revalidatePath("/[locale]/products", "page");
  // The detail pages too. A bulk import mostly *updates* products — a new
  // price, a colour list — and revalidating only the index left every product
  // page showing what it said before the import, which reads as an import
  // that silently did nothing.
  revalidatePath("/[locale]/products/[segment]", "page");
  // Featured and new products surface on the homepage, which is prerendered.
  revalidatePath("/[locale]", "page");

  return { imported, issues };
}
