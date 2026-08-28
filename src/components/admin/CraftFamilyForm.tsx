"use client";

import { useActionState, useState } from "react";
import { VISIBILITY_OPTIONS, emptySaveState, type SaveState } from "@/lib/editor-shared";
import { ImageField } from "@/components/admin/ImageField";
import { TranslationStatus } from "@/components/admin/TranslationStatus";

/**
 * Custom Made category editor.
 *
 * Four repeatable collections on one screen. They are kept on one screen
 * rather than behind tabs because they describe a single page, and an operator
 * adding a new bag construction should not have to guess which sub-editor owns
 * it.
 *
 * Ordering is by position in the list, changed with move buttons rather than
 * drag: buttons work on a phone and with a keyboard, and these lists are short.
 */
export type ItemValue = { nameEn: string; nameId: string; media: MediaValue[] };
export type MediaValue = { kind: "IMAGE" | "VIDEO"; publicId: string; alt: string };
export type MachineValue = { nameEn: string; descEn: string; image: string };
export type PairValue = { nameEn: string; descEn: string };

export type FamilyValue = {
  id: string;
  slug: string;
  nameEn: string;
  nameId: string;
  leadEn: string;
  leadId: string;
  introEn: string;
  introId: string;
  heroImage: string | null;
  sortOrder: number;
  visibility: string;
  items: ItemValue[];
  machines: MachineValue[];
  options: PairValue[];
  branding: string[];
};

const field =
  "w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red";
const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";
const hint = "text-xs text-muted";
const card = "flex flex-col gap-5 bg-paper p-6";
const smallBtn =
  "border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-ink disabled:opacity-40";
const addBtn =
  "self-start border border-ink bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-red";

export function CraftFamilyForm({
  action,
  family,
}: {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  family: FamilyValue | null;
}) {
  const [state, formAction, pending] = useActionState(action, emptySaveState);

  const [items, setItems] = useState<ItemValue[]>(family?.items ?? []);
  const [machines, setMachines] = useState<MachineValue[]>(family?.machines ?? []);
  const [options, setOptions] = useState<PairValue[]>(family?.options ?? []);
  const [branding, setBranding] = useState<string[]>(family?.branding ?? []);

  const move = <T,>(list: T[], set: (v: T[]) => void, i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    set(next);
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="id" value={family?.id ?? "new"} />

      <TranslationStatus />

      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-3 text-sm">
          {state.message}
        </p>
      )}

      {/* ------------------------------------------------ the category */}
      <section className={card}>
        <h2 className="text-sm font-semibold">The category</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Name (English) *</span>
            <input name="nameEn" required defaultValue={family?.nameEn ?? ""} className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Name (Indonesian)</span>
            <input name="nameId" defaultValue={family?.nameId ?? ""} className={field} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Headline (English)</span>
            <input name="leadEn" defaultValue={family?.leadEn ?? ""} className={field} />
            <span className={hint}>The line under the category name, e.g. &ldquo;One design. Many possibilities.&rdquo;</span>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Headline (Indonesian)</span>
            <input name="leadId" defaultValue={family?.leadId ?? ""} className={field} />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>Introduction (English)</span>
          <textarea name="introEn" rows={3} defaultValue={family?.introEn ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Introduction (Indonesian)</span>
          <textarea name="introId" rows={3} defaultValue={family?.introId ?? ""} className={field} />
        </label>

        <ImageField
          name="heroImage"
          label="Hero image"
          defaultValue={family?.heroImage}
          hint="Full width at the top of the page. Landscape works best."
        />
      </section>

      {/* ------------------------------------ what can we create + media */}
      <section className={card}>
        <div>
          <h2 className="text-sm font-semibold">What can we create?</h2>
          <p className={`${hint} mt-1 max-w-[70ch]`}>
            Each entry appears as a tile on the page. Add photographs or video
            to one and the tile opens a slideshow when a visitor hovers or taps
            it — an entry with no media stays as plain text.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 border border-line p-4">
              <input type="hidden" name={`itemName_${i}`} value={item.nameEn} />
              <input type="hidden" name={`itemNameId_${i}`} value={item.nameId} />
              <input
                type="hidden"
                name={`itemMedia_${i}`}
                value={item.media.map((m) => `${m.kind}|${m.publicId}|${m.alt}`).join("\n")}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={item.nameEn}
                  onChange={(e) =>
                    setItems(items.map((v, n) => (n === i ? { ...v, nameEn: e.target.value } : v)))
                  }
                  placeholder="Tote and shopper"
                  aria-label={`Example ${i + 1} name in English`}
                  className={field}
                />
                <input
                  value={item.nameId}
                  onChange={(e) =>
                    setItems(items.map((v, n) => (n === i ? { ...v, nameId: e.target.value } : v)))
                  }
                  placeholder="Tote dan shopper"
                  aria-label={`Example ${i + 1} name in Indonesian`}
                  className={field}
                />
              </div>

              <MediaList
                media={item.media}
                onChange={(media) =>
                  setItems(items.map((v, n) => (n === i ? { ...v, media } : v)))
                }
              />

              <div className="flex gap-2">
                <button type="button" onClick={() => move(items, setItems, i, -1)} disabled={i === 0} className={smallBtn}>↑</button>
                <button type="button" onClick={() => move(items, setItems, i, 1)} disabled={i === items.length - 1} className={smallBtn}>↓</button>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, n) => n !== i))}
                  className={`${smallBtn} text-muted hover:text-red`}
                >
                  Remove entry
                </button>
                <span className="self-center text-xs text-muted">
                  {item.media.length === 0
                    ? "No media"
                    : `${item.media.length} slide${item.media.length === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems([...items, { nameEn: "", nameId: "", media: [] }])}
          className={addBtn}
        >
          Add entry
        </button>
      </section>

      {/* ------------------------------------------------- the machines */}
      <section className={card}>
        <div>
          <h2 className="text-sm font-semibold">How it is made</h2>
          <p className={`${hint} mt-1 max-w-[70ch]`}>
            The processes behind the finish — UV printing, heat emboss, foil,
            engraving. Listed per category, because the honest answer differs
            between packaging and apparel. Leave it empty and the section does
            not appear.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {machines.map((m, i) => (
            <div key={i} className="flex flex-col gap-3 border border-line p-4">
              <input type="hidden" name={`machineName_${i}`} value={m.nameEn} />
              <input type="hidden" name={`machineDesc_${i}`} value={m.descEn} />
              <input type="hidden" name={`machineImage_${i}`} value={m.image} />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={m.nameEn}
                  onChange={(e) => setMachines(machines.map((v, n) => (n === i ? { ...v, nameEn: e.target.value } : v)))}
                  placeholder="UV printing"
                  aria-label={`Process ${i + 1} name`}
                  className={field}
                />
                <input
                  value={m.descEn}
                  onChange={(e) => setMachines(machines.map((v, n) => (n === i ? { ...v, descEn: e.target.value } : v)))}
                  placeholder="Raised, full-colour detail on rigid surfaces."
                  aria-label={`Process ${i + 1} description`}
                  className={field}
                />
              </div>

              <ImageField
                compact
                value={m.image}
                onChange={(v) => setMachines(machines.map((x, n) => (n === i ? { ...x, image: v } : x)))}
              />

              <div className="flex gap-2">
                <button type="button" onClick={() => move(machines, setMachines, i, -1)} disabled={i === 0} className={smallBtn}>↑</button>
                <button type="button" onClick={() => move(machines, setMachines, i, 1)} disabled={i === machines.length - 1} className={smallBtn}>↓</button>
                <button
                  type="button"
                  onClick={() => setMachines(machines.filter((_, n) => n !== i))}
                  className={`${smallBtn} text-muted hover:text-red`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMachines([...machines, { nameEn: "", descEn: "", image: "" }])}
          className={addBtn}
        >
          Add process
        </button>
      </section>

      {/* --------------------------------- options and branding (simple) */}
      <section className={card}>
        <div>
          <h2 className="text-sm font-semibold">Understanding your options</h2>
          <p className={`${hint} mt-1 max-w-[70ch]`}>
            Broad material families only — the choices worth knowing at this
            stage, not a specification sheet.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {options.map((o, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1.6fr_auto]">
              <input type="hidden" name={`optionName_${i}`} value={o.nameEn} />
              <input type="hidden" name={`optionDesc_${i}`} value={o.descEn} />
              <input
                value={o.nameEn}
                onChange={(e) => setOptions(options.map((v, n) => (n === i ? { ...v, nameEn: e.target.value } : v)))}
                placeholder="Natural fabrics"
                aria-label={`Option ${i + 1} name`}
                className={field}
              />
              <input
                value={o.descEn}
                onChange={(e) => setOptions(options.map((v, n) => (n === i ? { ...v, descEn: e.target.value } : v)))}
                placeholder="Canvas, cotton and related materials."
                aria-label={`Option ${i + 1} description`}
                className={field}
              />
              <button
                type="button"
                onClick={() => setOptions(options.filter((_, n) => n !== i))}
                className={`${smallBtn} text-muted hover:text-red`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setOptions([...options, { nameEn: "", descEn: "" }])} className={addBtn}>
          Add option
        </button>
      </section>

      <section className={card}>
        <div>
          <h2 className="text-sm font-semibold">Make it yours</h2>
          <p className={`${hint} mt-1 max-w-[70ch]`}>
            The branding methods available for this category.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {branding.map((b, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name={`branding_${i}`} value={b} />
              <input
                value={b}
                onChange={(e) => setBranding(branding.map((v, n) => (n === i ? e.target.value : v)))}
                placeholder="Screen print"
                aria-label={`Branding method ${i + 1}`}
                className={field}
              />
              <button
                type="button"
                onClick={() => setBranding(branding.filter((_, n) => n !== i))}
                className={`${smallBtn} text-muted hover:text-red`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setBranding([...branding, ""])} className={addBtn}>
          Add method
        </button>
      </section>

      {/* ------------------------------------------------- publishing */}
      <section className={card}>
        <h2 className="text-sm font-semibold">Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Visibility</span>
            <select name="visibility" defaultValue={family?.visibility ?? "DRAFT"} className={field}>
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Web address</span>
            <input name="slug" defaultValue={family?.slug ?? ""} className={field} placeholder="made from the name" />
            <span className={hint}>Changing this on a live category breaks existing links.</span>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>Position</span>
            <input name="sortOrder" inputMode="numeric" defaultValue={family?.sortOrder ?? 0} className={field} />
            <span className={hint}>Lower numbers come first on Custom Made.</span>
          </label>
        </div>
      </section>

      <button
        disabled={pending}
        className="self-start bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : family ? "Save changes" : "Create category"}
      </button>
    </form>
  );
}

/** The slideshow behind one "What can we create?" entry. */
function MediaList({
  media,
  onChange,
}: {
  media: MediaValue[];
  onChange: (v: MediaValue[]) => void;
}) {
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= media.length) return;
    const next = [...media];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3 border-l-2 border-line pl-4">
      {media.map((m, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <select
            value={m.kind}
            onChange={(e) =>
              onChange(media.map((v, n) => (n === i ? { ...v, kind: e.target.value as MediaValue["kind"] } : v)))
            }
            aria-label={`Slide ${i + 1} type`}
            className="border border-line bg-paper px-3 py-2 text-xs"
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
          </select>

          <div className="flex-1">
            <ImageField
              compact
              value={m.publicId}
              onChange={(v) => onChange(media.map((x, n) => (n === i ? { ...x, publicId: v } : x)))}
            />
          </div>

          <input
            value={m.alt}
            onChange={(e) => onChange(media.map((v, n) => (n === i ? { ...v, alt: e.target.value } : v)))}
            placeholder="Describe it for screen readers"
            aria-label={`Slide ${i + 1} description`}
            className="flex-1 border border-line bg-paper px-3 py-2 text-xs"
          />

          <div className="flex gap-1">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={smallBtn}>↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === media.length - 1} className={smallBtn}>↓</button>
            <button
              type="button"
              onClick={() => onChange(media.filter((_, n) => n !== i))}
              className={`${smallBtn} text-muted hover:text-red`}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...media, { kind: "IMAGE", publicId: "", alt: "" }])}
        className={`${smallBtn} self-start`}
      >
        Add slide
      </button>
    </div>
  );
}
