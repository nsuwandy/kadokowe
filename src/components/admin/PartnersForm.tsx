"use client";

import { useActionState, useState } from "react";
import { emptySaveState, type SaveState } from "@/lib/editor-shared";
import { ImageField } from "@/components/admin/ImageField";

export type PartnerRow = { id: string; name: string; logo: string; url: string };

/**
 * Partner marks — FR-4.x.
 *
 * A name is required, a logo is not. Without one the About page renders the
 * name as a wordmark, the same fallback the homepage client strip uses: a
 * partner Kadokowe can name but has no artwork for should still appear,
 * rather than waiting on a file nobody has.
 */
export function PartnersForm({
  action,
  rows: initial,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  rows: PartnerRow[];
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);
  const [rows, setRows] = useState<PartnerRow[]>(initial);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const field =
    "w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-red";

  const update = (i: number, patch: Partial<PartnerRow>) =>
    setRows((prev) => prev.map((r, n) => (n === i ? { ...r, ...patch } : r)));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-3 text-sm">
          {state.message}
        </p>
      )}

      <ul className="flex flex-col gap-px bg-line">
        {rows.map((row, i) => {
          const gone = row.id !== "" && removed.has(row.id);
          return (
            <li
              key={row.id || `new-${i}`}
              className={`grid gap-4 bg-paper p-5 md:grid-cols-[1fr_1fr_auto] ${gone ? "opacity-40" : ""}`}
            >
              <input type="hidden" name={`id_${i}`} value={row.id} />
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em]">Name</span>
                  <input
                    name={`name_${i}`}
                    value={row.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    className={field}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em]">Website</span>
                  <input
                    name={`url_${i}`}
                    value={row.url}
                    onChange={(e) => update(i, { url: e.target.value })}
                    placeholder="https://…"
                    className={field}
                  />
                </label>
              </div>

              <ImageField
                name={`logo_${i}`}
                label="Logo"
                hint="Optional. Without one the name is shown as a wordmark."
                value={row.logo}
                onChange={(v) => update(i, { logo: v })}
              />

              <div className="flex items-start justify-end">
                {row.id ? (
                  <label className="flex items-center gap-1.5 text-xs text-muted">
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
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { id: "", name: "", logo: "", url: "" }])}
          className="border border-line px-4 py-2 text-xs font-semibold hover:border-ink"
        >
          + Add a partner
        </button>
        <button
          disabled={pending}
          className="bg-red px-7 py-3 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
