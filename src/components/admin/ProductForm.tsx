"use client";

import { useActionState, useState } from "react";
import { deleteProduct as deleteAction } from "@/app/admin/products/actions";
import { TranslationStatus } from "@/components/admin/TranslationStatus";
import { ImageField } from "@/components/admin/ImageField";
import { GalleryField } from "@/components/admin/GalleryField";
import { priceToInput } from "@/lib/price";
import {
  AVAILABILITY_OPTIONS,
  VISIBILITY_OPTIONS,
  AXIS_LABELS,
  emptySaveState,
  type ProductFormValues,
  type SaveState,
  type TermOption,
} from "@/lib/product-form";

/**
 * Product editor — FR-10.2, FR-10.8, FR-10.9.
 *
 * Field labels are what the operator calls things, not what the schema calls
 * them, and each carries a line of guidance where the consequence is not
 * obvious. NFR-5.2 requires this be usable after a short handover with no
 * support agreement behind it, so the form has to explain itself.
 *
 * Budget tier is shown as derived rather than offered as a choice — it is
 * recomputed from price on save, and presenting it as editable would invite
 * an edit that silently does nothing.
 */
export function ProductForm({
  action,
  product,
  terms,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  product: ProductFormValues | null;
  terms: TermOption[];
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const byAxis = terms.reduce<Record<string, TermOption[]>>((acc, t) => {
    (acc[t.axis] ??= []).push(t);
    return acc;
  }, {});

  const selected = new Set(product?.termIds ?? []);
  const field =
    "w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red";
  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";
  const hint = "text-xs text-muted";

  return (
    <>
      <form action={formAction} className="flex flex-col gap-8">
        <input type="hidden" name="id" value={product?.id ?? "new"} />

      <TranslationStatus />

        {state.message && (
          <p
            role="alert"
            className={`border-l-2 px-5 py-3 text-sm ${
              state.ok ? "border-red bg-paper font-semibold" : "border-red bg-paper"
            }`}
          >
            {state.message}
          </p>
        )}

        {/* --- What it is ------------------------------------------------ */}
        <section className="flex flex-col gap-5 bg-paper p-6">
          <h2 className="text-sm font-semibold">What it is</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Name (English) *</span>
              <input name="nameEn" required defaultValue={product?.nameEn ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Name (Indonesian)</span>
              <input name="nameId" defaultValue={product?.nameId ?? ""} className={field} />
              <span className={hint}>Left blank, the English name is shown.</span>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className={labelCls}>Short line (English) *</span>
            <input name="shortEn" defaultValue={product?.shortEn ?? ""} className={field} />
            <span className={hint}>
              One sentence on the card. This is what makes it read as an idea
              rather than a listing — for example &ldquo;A surprisingly useful
              alternative to another tumbler.&rdquo;
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelCls}>Short line (Indonesian)</span>
            <input name="shortId" defaultValue={product?.shortId ?? ""} className={field} />
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelCls}>Why we like it (English)</span>
            <textarea name="whyEn" rows={4} defaultValue={product?.whyEn ?? ""} className={field} />
            <span className={hint}>
              Kadokowe&apos;s perspective — why this product works and who for.
              The single thing that separates the Product Library from a price list.
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelCls}>Why we like it (Indonesian)</span>
            <textarea name="whyId" rows={4} defaultValue={product?.whyId ?? ""} className={field} />
          </label>
        </section>

        {/* --- Where it appears ------------------------------------------ */}
        <section className="flex flex-col gap-5 bg-paper p-6">
          <h2 className="text-sm font-semibold">Where it appears</h2>
          <p className={hint}>
            A product with no purpose or industry tags is invisible to anyone
            browsing by those axes — which is how most visitors without a
            product in mind navigate.
          </p>

          {["PRODUCT", "PURPOSE", "INDUSTRY"].map((axis) => (
            <fieldset key={axis} className="flex flex-col gap-2">
              <legend className={labelCls}>{AXIS_LABELS[axis]}</legend>
              <div className="flex flex-wrap gap-2 pt-1">
                {(byAxis[axis] ?? []).map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5 text-xs has-checked:border-red has-checked:bg-red has-checked:text-paper"
                  >
                    <input
                      type="checkbox"
                      name="termIds"
                      value={t.id}
                      defaultChecked={selected.has(t.id)}
                      className="sr-only"
                    />
                    {t.nameEn}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </section>

        {/* --- Specifics -------------------------------------------------- */}
        <section className="flex flex-col gap-5 bg-paper p-6">
          <h2 className="text-sm font-semibold">Specifics</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Availability</span>
              <select name="availability" defaultValue={product?.availability ?? "LOCAL_PRODUCTION"} className={field}>
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className={hint}>Ready stock shows a badge on the site.</span>
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelCls}>Indicative price (Rp)</span>
              <input
                name="indicativePrice"
                defaultValue={priceToInput(
                  product?.indicativePrice ?? null,
                  product?.indicativePriceMax ?? null,
                )}
                placeholder="45000  or  30000-45000"
                className={field}
              />
              <span className={hint}>
                One figure, or a range written with a dash. Never shown as a
                headline on the site. The budget tier comes from the lower
                figure, so it does not need tagging.
              </span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Material</span>
              <input name="material" defaultValue={product?.material ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Capacity</span>
              <input name="capacity" defaultValue={product?.capacity ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Dimensions</span>
              <input name="dimensions" defaultValue={product?.dimensions ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Minimum order</span>
              <input name="moq" inputMode="numeric" defaultValue={product?.moq ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Lead time</span>
              <input name="leadTime" defaultValue={product?.leadTime ?? ""} className={field} />
              <span className={hint}>e.g. 14–21 days</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Colours</span>
              <input name="colours" defaultValue={product?.colours.join(" | ") ?? ""} className={field} />
              <span className={hint}>Separate with |</span>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className={labelCls}>Customisation possibilities</span>
            <input name="customisation" defaultValue={product?.customisation.join(" | ") ?? ""} className={field} />
            <span className={hint}>Separate with | — e.g. Logo printing | UV | Laser engraving</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Tags (English)</span>
              <input name="tagsEn" defaultValue={product?.tagsEn.join(" | ") ?? ""} className={field} />
              <span className={hint}>Shown on the card and used by search.</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Tags (Indonesian)</span>
              <input name="tagsId" defaultValue={product?.tagsId.join(" | ") ?? ""} className={field} />
              <span className={hint}>
                Needed for Indonesian search to find this product.
              </span>
            </label>
          </div>
        </section>

        {/* --- Publishing -------------------------------------------------- */}
        <section className="flex flex-col gap-5 bg-paper p-6">
          <h2 className="text-sm font-semibold">Publishing</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Visibility</span>
              <select name="visibility" defaultValue={product?.visibility ?? "DRAFT"} className={field}>
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Web address</span>
              <input name="slug" defaultValue={product?.slug ?? ""} className={field} placeholder="made from the name" />
              <span className={hint}>
                Changing this on a live product breaks any existing links to it.
              </span>
            </label>
          </div>

          <ImageField
            name="heroImage"
            label="Hero image"
            defaultValue={product?.heroImage}
            hint="Left blank, a labelled placeholder is shown rather than a gap."
          />

          <GalleryField
            name="gallery"
            label="More images"
            defaultValue={product?.gallery}
            hint="Shown beneath the hero on the product page. Detail shots, packaging, the product in use."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Search title (English)</span>
              <input name="seoTitleEn" defaultValue={product?.seoTitleEn ?? ""} className={field} />
              <span className={hint}>Left blank, the product name is used.</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Search title (Indonesian)</span>
              <input name="seoTitleId" defaultValue={product?.seoTitleId ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Search description (English)</span>
              <input name="seoDescEn" defaultValue={product?.seoDescEn ?? ""} className={field} />
              <span className={hint}>Also the text shown when the link is shared.</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>Search description (Indonesian)</span>
              <input name="seoDescId" defaultValue={product?.seoDescId ?? ""} className={field} />
            </label>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} />
              Feature on the homepage
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isNew" defaultChecked={product?.isNew} />
              Show in &ldquo;New discoveries&rdquo;
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={pending}
            className="bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
          >
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          {product && !confirmingDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="ml-auto text-xs font-semibold text-muted hover:text-red"
            >
              Delete this product
            </button>
          )}
        </div>
      </form>

      {/* FR-10.9 — destructive actions confirm, and say what is lost. */}
      {product && confirmingDelete && (
        <div className="border-l-2 border-red bg-paper p-6">
          <p className="font-semibold">Delete &ldquo;{product.nameEn}&rdquo;?</p>
          <p className="mt-1 max-w-[60ch] text-sm text-muted">
            This cannot be undone. Any enquiry that referenced this product keeps
            its record, but the product page and every link to it will stop
            working. To take it off the site without deleting it, set visibility
            to Draft instead.
          </p>
          <div className="mt-4 flex gap-3">
            <form action={deleteAction}>
              <input type="hidden" name="id" value={product.id} />
              <button className="bg-red px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-paper">
                Yes, delete it
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="border border-line px-5 py-2.5 text-xs font-semibold"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
