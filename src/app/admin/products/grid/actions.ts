"use server";

import { currentAdmin } from "@/lib/auth";
import {
  normalizeRecords,
  emptyImportState,
  ALL_COLUMNS,
  type ImportRecord,
  type ImportState,
  type PresentColumns,
} from "@/lib/product-import";
import { IMPORT_COLUMNS, type ImportColumn } from "@/lib/product-grid";
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

  // Which columns the operator could actually see.
  //
  // The grid keeps every column on every row whether or not it is displayed,
  // so a submitted payload always carries all 25 — and with the reduced column
  // set showing, importing a row whose slug matched an existing product used
  // to blank the twenty the operator was never shown. A column that was not on
  // screen was not edited, so it is not part of this import.
  const declared = String(formData.get("columns") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ImportColumn => (IMPORT_COLUMNS as readonly string[]).includes(c));
  // An older page still open in a tab submits no list. Falling back to every
  // column keeps that submission behaving exactly as it did before.
  const present: PresentColumns = declared.length > 0 ? new Set(declared) : ALL_COLUMNS;

  // Row 1 in the grid is row 1 in the report — the operator has to be able to
  // find the row a problem refers to.
  const { rows, errors } = normalizeRecords(filled, 1);
  const { imported, issues } = await writeParsedRows(rows, present);

  return {
    ran: true,
    imported,
    issues: [...errors, ...issues],
    missingColumns: [],
    untouchedColumns: IMPORT_COLUMNS.filter((c) => c !== "slug" && !present.has(c)),
  };
}
