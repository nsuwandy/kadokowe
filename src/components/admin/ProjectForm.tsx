"use client";

import { useActionState } from "react";
import {
  STORY_SECTIONS,
  VISIBILITY_OPTIONS,
  emptySaveState,
  type SaveState,
} from "@/lib/editor-shared";
import { ImageField } from "@/components/admin/ImageField";

export type ProjectFormValues = {
  id: string;
  slug: string;
  titleEn: string;
  titleId: string | null;
  client: string;
  industry: string | null;
  summaryEn: string | null;
  summaryId: string | null;
  sections: Record<string, string | null>;
  heroImage: string | null;
  featured: boolean;
  visibility: string;
  productIds: string[];
};

/**
 * Project editor — FR-7.2, FR-7.7.
 *
 * All six narrative sections are optional and the form says so plainly. That
 * is not a convenience: of the five real case studies, two have strong
 * challenge-and-thinking material but little recorded production detail, and
 * the public page numbers only what is filled. Someone editing here needs to
 * know that leaving a section blank is a supported choice rather than an
 * unfinished record — otherwise they pad it, which is worse.
 */
export function ProjectForm({
  action,
  project,
  products,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  project: ProjectFormValues | null;
  products: { id: string; nameEn: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);

  const selected = new Set(project?.productIds ?? []);
  const field =
    "w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red";
  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";
  const hint = "text-xs text-muted";

  const filled = STORY_SECTIONS.filter(
    (s) => project?.sections[`${s.key}En`],
  ).length;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="id" value={project?.id ?? "new"} />

      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-3 text-sm">
          {state.message}
        </p>
      )}

      <section className="flex flex-col gap-5 bg-paper p-6">
        <h2 className="text-sm font-semibold">The project</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Title (English) *</span>
            <input name="titleEn" required defaultValue={project?.titleEn ?? ""} className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Title (Indonesian)</span>
            <input name="titleId" defaultValue={project?.titleId ?? ""} className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Client *</span>
            <input name="client" required defaultValue={project?.client ?? ""} className={field} />
            <span className={hint}>Only name a client you have permission to show.</span>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Industry</span>
            <input name="industry" defaultValue={project?.industry ?? ""} className={field} />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Summary (English)</span>
          <textarea name="summaryEn" rows={2} defaultValue={project?.summaryEn ?? ""} className={field} />
          <span className={hint}>
            The line on the index card. One sentence that makes someone open it.
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Summary (Indonesian)</span>
          <textarea name="summaryId" rows={2} defaultValue={project?.summaryId ?? ""} className={field} />
        </label>
      </section>

      <section className="flex flex-col gap-6 bg-paper p-6">
        <div>
          <h2 className="text-sm font-semibold">The story</h2>
          <p className={`${hint} mt-1 max-w-[70ch]`}>
            Every section is optional. The page renders only what you fill in
            and numbers those, so gaps never show as skipped numbers — a project
            with four sections reads 01 to 04. Leave a section blank rather than
            padding it.
            {project && ` Currently ${filled} of 6 filled.`}
          </p>
        </div>

        {STORY_SECTIONS.map((s) => (
          <div key={s.key} className="flex flex-col gap-3 border-t border-line pt-5">
            <div>
              <h3 className={labelCls}>{s.label}</h3>
              <p className={`${hint} mt-1 max-w-[70ch]`}>{s.hint}</p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.625rem] text-muted">English</span>
              <textarea
                name={`${s.key}En`}
                rows={3}
                defaultValue={project?.sections[`${s.key}En`] ?? ""}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.625rem] text-muted">Indonesian</span>
              <textarea
                name={`${s.key}Id`}
                rows={3}
                defaultValue={project?.sections[`${s.key}Id`] ?? ""}
                className={field}
              />
            </label>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-5 bg-paper p-6">
        <h2 className="text-sm font-semibold">Related products</h2>
        <p className={`${hint} max-w-[70ch]`}>
          Linking products here makes them appear at the foot of the story, and
          makes this project appear on each product&apos;s page. One link, both
          directions.
        </p>
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5 text-xs has-checked:border-red has-checked:bg-red has-checked:text-paper"
            >
              <input
                type="checkbox"
                name="productIds"
                value={p.id}
                defaultChecked={selected.has(p.id)}
                className="sr-only"
              />
              {p.nameEn}
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5 bg-paper p-6">
        <h2 className="text-sm font-semibold">Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Visibility</span>
            <select name="visibility" defaultValue={project?.visibility ?? "DRAFT"} className={field}>
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Web address</span>
            <input name="slug" defaultValue={project?.slug ?? ""} className={field} placeholder="made from the title" />
            <span className={hint}>Changing this on a live project breaks existing links.</span>
          </label>
        </div>
        <ImageField
          name="heroImage"
          label="Hero image"
          defaultValue={project?.heroImage}
          hint="Used full-bleed at the top of the story, so landscape works best."
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={project?.featured} />
          Feature at the top of Our Work and on the homepage
        </label>
      </section>

      <button
        disabled={pending}
        className="self-start bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : project ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
