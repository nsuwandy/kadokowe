"use server";

import { currentAdmin } from "@/lib/auth";
import {
  parseProductCsv,
  emptyImportState,
  type ImportState,
} from "@/lib/product-import";
import { writeParsedRows } from "@/lib/product-import-run";

/**
 * Runs a bulk import from CSV and returns per-row results — FR-10.11.
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

  const { imported, issues } = await writeParsedRows(rows);

  return { ran: true, imported, issues: [...errors, ...issues], missingColumns: [] };
}
