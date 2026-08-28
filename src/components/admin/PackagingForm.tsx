"use client";

import { useActionState, useState } from "react";
import { emptySaveState, type SaveState } from "@/lib/editor-shared";

export type PackagingRow = {
  id: string;
  nameEn: string;
  nameId: string;
  pricing: "FIXED" | "QUOTE";
  priceDelta: string;
  parentId: string;
};

/**
 * The add-on list — FR-4.x.
 *
 * Priced and quote-only options share one list because they are one choice
 * from the buyer's side. Switching a row to "ask for a quotation" hides its
 * price box rather than greying it: a disabled field still reads as a number
 * someone forgot to fill in.
 */
export function PackagingForm({
  action,
  rows: initial,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  rows: PackagingRow[];
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);
  const [rows, setRows] = useState<PackagingRow[]>(initial);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const field =
    "w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-red";

  const update = (i: number, patch: Partial<PackagingRow>) =>
    setRows((prev) => prev.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  const add = () =>
    setRows((prev) => [
      ...prev,
      { id: "", nameEn: "", nameId: "", pricing: "FIXED", priceDelta: "0", parentId: "" },
    ]);

  // Only saved rows can be parents: an unsaved one has no id to point at yet.
  const parents = rows.filter((r) => r.id && !r.parentId && !removed.has(r.id));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-3 text-sm">
          {state.message}
        </p>
      )}

      <div className="overflow-x-auto border border-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-warm text-left">
              {["Name (English)", "Name (Indonesian)", "Price", "Uplift per unit", "Grouped under", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.1em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const gone = row.id !== "" && removed.has(row.id);
              return (
                <tr key={row.id || `new-${i}`} className={gone ? "border-b border-line opacity-40" : "border-b border-line"}>
                  <td className="p-2">
                    <input type="hidden" name={`id_${i}`} value={row.id} />
                    <input
                      name={`nameEn_${i}`}
                      value={row.nameEn}
                      onChange={(e) => update(i, { nameEn: e.target.value })}
                      className={field}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      name={`nameId_${i}`}
                      value={row.nameId}
                      onChange={(e) => update(i, { nameId: e.target.value })}
                      className={field}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      name={`pricing_${i}`}
                      value={row.pricing}
                      onChange={(e) => update(i, { pricing: e.target.value as PackagingRow["pricing"] })}
                      className={field}
                    >
                      <option value="FIXED">Fixed uplift</option>
                      <option value="QUOTE">Ask for a quotation</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {row.pricing === "FIXED" ? (
                      <input
                        name={`priceDelta_${i}`}
                        inputMode="numeric"
                        value={row.priceDelta}
                        onChange={(e) => update(i, { priceDelta: e.target.value })}
                        placeholder="Rp per unit"
                        className={field}
                      />
                    ) : (
                      <>
                        <input type="hidden" name={`priceDelta_${i}`} value="" />
                        <span className="text-xs text-muted">Quoted separately</span>
                      </>
                    )}
                  </td>
                  <td className="p-2">
                    <select
                      name={`parentId_${i}`}
                      value={row.parentId}
                      onChange={(e) => update(i, { parentId: e.target.value })}
                      className={field}
                    >
                      <option value="">— top level —</option>
                      {parents
                        .filter((p) => p.id !== row.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameEn}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    {row.id ? (
                      <label className="flex items-center justify-end gap-1.5 text-xs text-muted">
                        {gone && <input type="hidden" name="remove" value={row.id} />}
                        <input
                          type="checkbox"
                          checked={gone}
                          onChange={(e) =>
                            setRemoved((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(row.id);
                              else next.delete(row.id);
                              return next;
                            })
                          }
                          className="accent-red"
                        />
                        Remove
                      </label>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRows((prev) => prev.filter((_, n) => n !== i))}
                        className="text-xs text-muted hover:text-red"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={add}
          className="border border-line px-4 py-2 text-xs font-semibold hover:border-ink"
        >
          + Add an option
        </button>
        <button
          disabled={pending}
          className="bg-red px-7 py-3 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {removed.size > 0 && (
          <span className="text-xs text-red">
            {removed.size} will be removed when you save.
          </span>
        )}
      </div>
    </form>
  );
}
