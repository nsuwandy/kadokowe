"use client";

import { useState } from "react";
import { ImageField } from "@/components/admin/ImageField";

export type GalleryItem = { publicId: string; altEn: string };

/**
 * Multi-image editor — FR-7.3, FR-4.x.
 *
 * Product and project pages have always rendered a gallery, and the schema
 * has always had somewhere to put one, but nothing in the admin or the CSV
 * import could add an image to it. The feature existed everywhere except
 * where someone could use it.
 *
 * Order is the list order, changed with move controls rather than drag: the
 * lists are short, and buttons work on a phone and with a keyboard where a
 * drag handle does neither without a good deal more code.
 *
 * Alt text sits beside each image rather than in a separate pass, because
 * alt text added later is alt text never added (NFR-5.3).
 */
export function GalleryField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: GalleryItem[];
  hint?: string;
}) {
  const [items, setItems] = useState<GalleryItem[]>(defaultValue ?? []);

  const update = (i: number, patch: Partial<GalleryItem>) =>
    setItems((prev) => prev.map((it, n) => (n === i ? { ...it, ...patch } : it)));

  const move = (i: number, by: number) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + by;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";
  const btn =
    "border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-ink disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3">
      <span className={labelCls}>{label}</span>

      {/* One field per image, so an empty gallery submits nothing rather than
          a blank row the action would have to filter out. */}
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 border border-line p-3 sm:flex-row sm:items-start">
          <input type="hidden" name={`${name}_publicId`} value={item.publicId} />
          <input type="hidden" name={`${name}_alt`} value={item.altEn} />

          <div className="flex-1">
            <ImageField
              compact
              value={item.publicId}
              onChange={(v) => update(i, { publicId: v })}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <input
              value={item.altEn}
              onChange={(e) => update(i, { altEn: e.target.value })}
              placeholder="Describe the image for screen readers"
              aria-label={`Alt text for image ${i + 1}`}
              className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-red"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btn}>
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className={btn}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, n) => n !== i))}
                className={`${btn} text-muted hover:text-red`}
              >
                Remove
              </button>
              <span className="self-center text-xs text-muted">Image {i + 1}</span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { publicId: "", altEn: "" }])}
        className="self-start border border-ink bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-red"
      >
        Add image
      </button>

      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
