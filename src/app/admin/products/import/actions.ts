"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parseProductCsv,
  emptyImportState,
  type RowError,
  type ImportState,
} from "@/lib/product-import";

/**
 * Runs a bulk import and returns per-row results — FR-10.11.
 *
 * The result is returned rather than redirected with counts in the URL,
 * because counts alone are useless: an operator told "4 rows need attention"
 * with no indication of which rows cannot act on it. Line numbers and the
 * specific problem are the whole value of the feature.
 */
export async function importProducts(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const admin = await currentAdmin();
  if (!admin) {
    return { ...emptyImportState, ran: true, message: "Your session expired. Sign in again." };
  }

  const file = formData.get("file");
  const pasted = String(formData.get("pasted") ?? "").trim();

  let csv = pasted;
  if (!csv && file instanceof File && file.size > 0) {
    csv = await file.text();
  }
  if (!csv) {
    return { ...emptyImportState, ran: true, message: "Choose a CSV file or paste some rows first." };
  }

  const { rows, errors, missingColumns } = parseProductCsv(csv);
  if (missingColumns.length > 0) {
    return { ...emptyImportState, ran: true, missingColumns };
  }

  const issues: RowError[] = [...errors];
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
  revalidatePath("/ideas");

  return { ran: true, imported, issues, missingColumns: [] };
}
