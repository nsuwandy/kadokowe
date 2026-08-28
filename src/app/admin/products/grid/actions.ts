"use server";

import { currentAdmin } from "@/lib/auth";
import {
  normalizeRecords,
  emptyImportState,
  type ImportRecord,
  type ImportState,
} from "@/lib/product-import";
import { IMPORT_COLUMNS } from "@/lib/product-grid";
import { writeParsedRows } from "@/lib/product-import-run";

/**
 * Import the rows typed into the grid — FR-10.11, second front end.
 *
 * The grid validates as you type, but nothing here trusts that. The rows
 * arrive as JSON from the browser and are put through `normalizeRecords`
 * exactly as a CSV would be: the client-side checks exist to save the
 * operator a round trip, not to decide what reaches the database.
 */

/** Vercel rejects a request body over 4.5 MB, and a truncated import is worse
 *  than a refused one, so the limit is enforced here with an explanation. */
const MAX_PAYLOAD_BYTES = 3_000_000;

export async function importProductGrid(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const admin = await currentAdmin();
  if (!admin) {
    return { ...emptyImportState, ran: true, message: "Your session expired. Sign in again." };
  }

  const payload = String(formData.get("rows") ?? "");
  if (!payload) {
    return { ...emptyImportState, ran: true, message: "There is nothing in the table to import yet." };
  }
  if (payload.length > MAX_PAYLOAD_BYTES) {
    return {
      ...emptyImportState,
      ran: true,
      message:
        "This table is too large to send in one go. Import it in batches of a few hundred rows, or save it as a CSV and use the Import page.",
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { ...emptyImportState, ran: true, message: "The table could not be read. Reload the page and try again." };
  }
  if (!Array.isArray(raw)) {
    return { ...emptyImportState, ran: true, message: "The table could not be read. Reload the page and try again." };
  }

  // Keep only the known columns. An unexpected key here would be a bug rather
  // than an attack, but either way it has no business reaching the importer.
  const allowed = new Set<string>(IMPORT_COLUMNS);
  const records: ImportRecord[] = raw.map((entry) => {
    const record: Record<string, string> = {};
    if (entry && typeof entry === "object") {
      for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
        if (allowed.has(key)) record[key] = typeof value === "string" ? value : "";
      }
    }
    return record as ImportRecord;
  });

  // A row the operator has started and left blank is not an error — the grid
  // always keeps a spare row at the bottom to type into.
  const filled = records.filter((r) => Object.values(r).some((v) => (v ?? "").trim() !== ""));
  if (filled.length === 0) {
    return { ...emptyImportState, ran: true, message: "Every row is empty. Fill at least a name and a one-liner." };
  }

  // Row 1 in the grid is row 1 in the report — the operator has to be able to
  // find the row a problem refers to.
  const { rows, errors } = normalizeRecords(filled, 1);
  const { imported, issues } = await writeParsedRows(rows);

  return { ran: true, imported, issues: [...errors, ...issues], missingColumns: [] };
}
