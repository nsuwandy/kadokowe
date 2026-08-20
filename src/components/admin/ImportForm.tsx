"use client";

import { useActionState } from "react";
import {
  IMPORT_COLUMNS,
  emptyImportState,
  type ImportState,
} from "@/lib/product-import";
import { importProducts } from "@/app/admin/products/import/actions";

/**
 * Import form with per-row results — FR-10.11.
 *
 * Results render in place rather than as counts in a redirect, because a
 * count on its own cannot be acted on: "4 rows need attention" without line
 * numbers leaves the operator scanning a spreadsheet by hand. Line number,
 * slug and the specific problem are the point of the feature.
 */
export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(
    importProducts,
    emptyImportState,
  );

  const rejected = state.issues.filter((i) => !i.problem.startsWith("Imported,"));
  const warnings = state.issues.filter((i) => i.problem.startsWith("Imported,"));

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 bg-paper p-6">
        <label className="flex flex-col gap-2">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
            CSV file
          </span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="border border-line px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-warm file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
        </label>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          or paste rows
          <span className="h-px flex-1 bg-line" />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
            Paste CSV
          </span>
          <textarea
            name="pasted"
            rows={6}
            placeholder={IMPORT_COLUMNS.join(",")}
            className="border border-line px-4 py-3 font-mono text-xs outline-none focus:border-red"
          />
        </label>

        <button
          disabled={pending}
          className="self-start bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </form>

      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-4 text-sm">
          {state.message}
        </p>
      )}

      {state.missingColumns.length > 0 && (
        <div role="alert" className="border-l-2 border-red bg-paper px-5 py-4">
          <p className="font-semibold">That file is missing required columns.</p>
          <p className="mt-1 text-sm text-muted">
            Add: {state.missingColumns.join(", ")}. The template below has the
            exact headings.
          </p>
        </div>
      )}

      {state.ran && state.missingColumns.length === 0 && !state.message && (
        <div className="bg-paper">
          <div className="border-l-2 border-red px-5 py-4">
            <p className="font-semibold">
              Imported {state.imported}{" "}
              {state.imported === 1 ? "product" : "products"}.
            </p>
            <p className="mt-1 text-sm text-muted">
              {rejected.length > 0
                ? `${rejected.length} ${rejected.length === 1 ? "row was" : "rows were"} skipped.`
                : "Every row went in."}
              {warnings.length > 0 &&
                ` ${warnings.length} imported with a warning.`}
            </p>
          </div>

          {rejected.length > 0 && (
            <section className="border-t border-line">
              <h3 className="px-5 pt-5 text-sm font-semibold">Rows that were skipped</h3>
              <ul className="divide-y divide-line">
                {rejected.map((issue, i) => (
                  <li key={`${issue.line}-${i}`} className="flex gap-4 px-5 py-3">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-red">
                      line {issue.line}
                    </span>
                    <span className="text-sm">
                      {issue.problem}
                      {issue.slug && (
                        <span className="ml-2 font-mono text-xs text-muted">
                          ({issue.slug})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {warnings.length > 0 && (
            <section className="border-t border-line">
              <h3 className="px-5 pt-5 text-sm font-semibold">
                Imported, with something to check
              </h3>
              <ul className="divide-y divide-line">
                {warnings.map((issue, i) => (
                  <li key={`${issue.line}-${i}`} className="flex gap-4 px-5 py-3">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                      line {issue.line}
                    </span>
                    <span className="text-sm text-muted">{issue.problem}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
