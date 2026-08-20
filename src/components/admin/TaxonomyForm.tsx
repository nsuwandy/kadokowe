"use client";

import { useActionState } from "react";
import { emptySaveState, type SaveState } from "@/lib/editor-shared";
import { deleteTerm } from "@/app/admin/taxonomy/actions";

export type TermRow = {
  id: string;
  slugEn: string;
  nameEn: string;
  nameId: string | null;
  productCount: number;
};

/**
 * Taxonomy editor — FR-10.4.
 *
 * Order is set by a number rather than drag-and-drop: it survives without
 * JavaScript, is obvious on a phone, and the lists are short enough that
 * dragging would be the slower interaction anyway.
 *
 * Terms in use cannot be deleted, and the row says how many products depend
 * on it. Removing one silently would drop those products out of a browse axis
 * with nothing to explain where they went.
 */
export function TaxonomyForm({
  action,
  axis,
  axisLabel,
  terms,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  axis: string;
  axisLabel: string;
  terms: TermRow[];
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);

  const cell = "w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-red";

  return (
    <div className="flex flex-col gap-5">
      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-3 text-sm">
          {state.message}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-5 bg-paper p-6">
        <input type="hidden" name="axis" value={axis} />
        <h2 className="text-sm font-semibold">{axisLabel}</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Order", "Name (English)", "Name (Indonesian)", "Address", "In use", ""].map((h) => (
                  <th key={h} className="px-2 py-2 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terms.map((t, i) => (
                <tr key={t.id} className="border-b border-line">
                  <td className="w-14 px-2 py-2 text-xs tabular-nums text-muted">{i + 1}</td>
                  <td className="px-2 py-2">
                    <input type="hidden" name="termId" value={t.id} />
                    <input name={`nameEn_${t.id}`} defaultValue={t.nameEn} className={cell} />
                  </td>
                  <td className="px-2 py-2">
                    <input name={`nameId_${t.id}`} defaultValue={t.nameId ?? ""} className={cell} />
                  </td>
                  <td className="px-2 py-2 font-mono text-[0.6875rem] text-muted">{t.slugEn}</td>
                  <td className="px-2 py-2 text-xs tabular-nums text-muted">{t.productCount}</td>
                  <td className="px-2 py-2">
                    {t.productCount === 0 ? (
                      <button
                        formAction={deleteTerm}
                        name="id"
                        value={t.id}
                        className="text-xs text-muted hover:text-red"
                      >
                        Remove
                      </button>
                    ) : (
                      <span
                        className="cursor-not-allowed text-xs text-muted/50"
                        title={`${t.productCount} product(s) use this term. Move them first.`}
                      >
                        In use
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted">
          Rows save in the order shown. To move a term, change its name order by
          editing and saving — the numbers renumber themselves.
        </p>

        <fieldset className="flex flex-col gap-3 border-t border-line pt-5">
          <legend className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
            Add a term
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="newNameEn" placeholder="Name (English)" className={cell} />
            <input name="newNameId" placeholder="Name (Indonesian)" className={cell} />
            <input name="newSlug" placeholder="Address (optional)" className={cell} />
          </div>
        </fieldset>

        <button
          disabled={pending}
          className="self-start bg-red px-6 py-3 font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
