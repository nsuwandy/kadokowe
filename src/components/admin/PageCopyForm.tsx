"use client";

import { useActionState } from "react";
import { emptySaveState, type SaveState } from "@/lib/editor-shared";
import type { PageField } from "@/lib/page-content";
import { ImageField } from "@/components/admin/ImageField";

export function PageCopyForm({
  action,
  pageKey,
  label,
  fields,
  values,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  pageKey: string;
  label: string;
  fields: PageField[];
  values: Record<string, { en?: string; id?: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);

  const field =
    "w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red";
  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";

  return (
    <form action={formAction} className="flex flex-col gap-5 bg-paper p-6">
      <input type="hidden" name="key" value={pageKey} />
      <h2 className="text-sm font-semibold">{label}</h2>

      {state.message && (
        <p role="alert" className="border-l-2 border-red px-4 py-2.5 text-sm">
          {state.message}
        </p>
      )}

      {fields.map((f) =>
        f.image ? (
          /* Images are language-independent, so one picker rather than two. */
          <div key={f.name} className="border-t border-line pt-4">
            <ImageField
              name={`${f.name}_en`}
              label={f.label}
              hint={f.hint}
              defaultValue={values[f.name]?.en}
            />
          </div>
        ) : (
        f.single ? (
          /* Language-independent — a person's name is the same in both. */
          <label key={f.name} className="flex flex-col gap-2 border-t border-line pt-4">
            <span className={labelCls}>{f.label}</span>
            {f.hint && <span className="-mt-1 text-xs text-muted">{f.hint}</span>}
            <input
              name={`${f.name}_en`}
              defaultValue={values[f.name]?.en ?? ""}
              className={field}
            />
          </label>
        ) : (
        <div key={f.name} className="flex flex-col gap-3 border-t border-line pt-4">
          <span className={labelCls}>{f.label}</span>
          {f.hint && <span className="-mt-1.5 text-xs text-muted">{f.hint}</span>}
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.625rem] text-muted">English</span>
            {f.multiline ? (
              <textarea name={`${f.name}_en`} rows={3} defaultValue={values[f.name]?.en ?? ""} className={field} />
            ) : (
              <input name={`${f.name}_en`} defaultValue={values[f.name]?.en ?? ""} className={field} />
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.625rem] text-muted">Indonesian</span>
            {f.multiline ? (
              <textarea name={`${f.name}_id`} rows={3} defaultValue={values[f.name]?.id ?? ""} className={field} />
            ) : (
              <input name={`${f.name}_id`} defaultValue={values[f.name]?.id ?? ""} className={field} />
            )}
          </label>
        </div>
        )
        ),
      )}

      <button
        disabled={pending}
        className="self-start bg-red px-6 py-3 font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
