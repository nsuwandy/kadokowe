"use client";

import { useActionState } from "react";
import { VISIBILITY_OPTIONS, emptySaveState, type SaveState } from "@/lib/editor-shared";
import { CATEGORIES } from "@/content/insights";
import { ImageField } from "@/components/admin/ImageField";
import { RichText } from "@/components/admin/RichText";

export type ArticleFormValues = {
  id: string;
  slug: string;
  titleEn: string;
  titleId: string | null;
  excerptEn: string | null;
  excerptId: string | null;
  bodyEn: string | null;
  bodyId: string | null;
  category: string;
  heroImage: string | null;
  seoTitleEn: string | null;
  seoTitleId: string | null;
  seoDescEn: string | null;
  seoDescId: string | null;
  featured: boolean;
  visibility: string;
  productIds: string[];
  projectIds: string[];
};

/**
 * Article editor — FR-8.5, FR-8.8.
 *
 * The related-content pickers are given their own section with the
 * cross-link pattern spelled out, because FR-8.8 is what makes editorial
 * content convert and it is invisible from the editor otherwise. An author
 * who does not know that ticking a project produces a "See It In Action"
 * block at the foot of their article will not tick one.
 *
 * Body uses a rich editor (FR-8.3, FR-10.8) with a deliberately short
 * toolbar: headings, emphasis, lists, pull quotes and images. Every extra
 * control is another decision an author has to make, and the design already
 * decides how each element looks.
 */
export function ArticleForm({
  action,
  article,
  products,
  projects,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  article: ArticleFormValues | null;
  products: { id: string; nameEn: string }[];
  projects: { id: string; titleEn: string; client: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);

  const selP = new Set(article?.productIds ?? []);
  const selPr = new Set(article?.projectIds ?? []);
  const field =
    "w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red";
  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";
  const hint = "text-xs text-muted";
  const chip =
    "flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5 text-xs has-checked:border-red has-checked:bg-red has-checked:text-paper";

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="id" value={article?.id ?? "new"} />

      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-3 text-sm">
          {state.message}
        </p>
      )}

      <section className="flex flex-col gap-5 bg-paper p-6">
        <h2 className="text-sm font-semibold">The article</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Title (English) *</span>
            <input name="titleEn" required defaultValue={article?.titleEn ?? ""} className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Title (Indonesian)</span>
            <input name="titleId" defaultValue={article?.titleId ?? ""} className={field} />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Category</span>
          <select name="category" defaultValue={article?.category ?? "GIFTING_STRATEGY"} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.en}</option>
            ))}
          </select>
          <span className={hint}>
            Insights teaches how to think about merchandise. If the piece is
            really about how a product gets made, it belongs in Custom Made.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Standfirst (English)</span>
          <textarea name="excerptEn" rows={2} defaultValue={article?.excerptEn ?? ""} className={field} />
          <span className={hint}>The line under the title on the index.</span>
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Standfirst (Indonesian)</span>
          <textarea name="excerptId" rows={2} defaultValue={article?.excerptId ?? ""} className={field} />
        </label>

        <RichText
          name="bodyEn"
          label="Body (English)"
          defaultValue={article?.bodyEn}
          hint="Headings, lists, pull quotes and images. The design decides how each looks — you decide what it is."
        />
        <RichText
          name="bodyId"
          label="Body (Indonesian)"
          defaultValue={article?.bodyId}
        />
      </section>

      {/* FR-8.8 — the pattern is invisible from here unless it is explained. */}
      <section className="flex flex-col gap-6 bg-paper p-6">
        <div>
          <h2 className="text-sm font-semibold">Where this article leads</h2>
          <p className={`${hint} mt-1 max-w-[70ch]`}>
            These build the three blocks at the foot of the article. A project
            becomes &ldquo;See It In Action&rdquo;; products become
            &ldquo;Explore Alternative Ideas&rdquo;. Each block only appears if
            you tick something, and &ldquo;Have a Similar Challenge?&rdquo;
            always shows. This is how an article turns into an enquiry.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={labelCls}>Related projects — &ldquo;See it in action&rdquo;</legend>
          <div className="flex flex-wrap gap-2 pt-1">
            {projects.map((p) => (
              <label key={p.id} className={chip}>
                <input type="checkbox" name="projectIds" value={p.id} defaultChecked={selPr.has(p.id)} className="sr-only" />
                {p.client} — {p.titleEn}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={labelCls}>Related products — &ldquo;Explore alternative ideas&rdquo;</legend>
          <div className="flex flex-wrap gap-2 pt-1">
            {products.map((p) => (
              <label key={p.id} className={chip}>
                <input type="checkbox" name="productIds" value={p.id} defaultChecked={selP.has(p.id)} className="sr-only" />
                {p.nameEn}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="flex flex-col gap-5 bg-paper p-6">
        <h2 className="text-sm font-semibold">Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Visibility</span>
            <select name="visibility" defaultValue={article?.visibility ?? "DRAFT"} className={field}>
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Web address</span>
            <input name="slug" defaultValue={article?.slug ?? ""} className={field} placeholder="made from the title" />
          </label>
        </div>
        <ImageField
          name="heroImage"
          label="Hero image"
          defaultValue={article?.heroImage}
          hint="Also used as the share image when the link is sent on WhatsApp."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Search title (English)</span>
            <input name="seoTitleEn" defaultValue={article?.seoTitleEn ?? ""} className={field} />
            <span className={hint}>Left blank, the article title is used.</span>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Search title (Indonesian)</span>
            <input name="seoTitleId" defaultValue={article?.seoTitleId ?? ""} className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Search description (English)</span>
            <input name="seoDescEn" defaultValue={article?.seoDescEn ?? ""} className={field} />
            <span className={hint}>Left blank, the standfirst is used. Also the text shown when the link is shared.</span>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Search description (Indonesian)</span>
            <input name="seoDescId" defaultValue={article?.seoDescId ?? ""} className={field} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={article?.featured} />
          Feature as the lead story on Insights
        </label>
      </section>

      <button
        disabled={pending}
        className="self-start bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : article ? "Save changes" : "Create article"}
      </button>
    </form>
  );
}
