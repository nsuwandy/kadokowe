"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CldImage } from "next-cloudinary";
import type { CraftItemView } from "@/lib/craft";

/**
 * "What can we create?" — each entry opens a slideshow of its own photographs
 * and video.
 *
 * Opening is bound to hover *and* to click, not hover alone. Hover does not
 * exist on a touch screen, and SRS §2.8 has most visitors arriving from
 * WhatsApp on a phone — a hover-only affordance would hide this section from
 * the majority of the audience. Hover is the shortcut for someone with a
 * mouse; the tap is the actual interface.
 *
 * Slides never advance on their own. An autoplaying carousel takes the
 * decision away from someone comparing two constructions, and it competes with
 * the page's own reading rhythm.
 */
export function CraftShowcase({
  items,
  labels,
}: {
  items: CraftItemView[];
  labels: {
    heading: string;
    empty: string;
    previous: string;
    next: string;
    close: string;
    /** e.g. "{n} of {total}" — a template, because a function cannot cross
     *  the server/client boundary. */
    counter: string;
  };
}) {
  const counter = (n: number, total: number) =>
    labels.counter.replace("{n}", String(n)).replace("{total}", String(total));

  const [openId, setOpenId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((id: string, from: HTMLElement) => {
    openerRef.current = from;
    setOpenId(id);
    setSlide(0);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    // Return focus to whatever opened it, or a keyboard user is dropped at the
    // top of the document with no idea where they were.
    openerRef.current?.focus();
  }, []);

  const item = items.find((i) => i.id === openId) ?? null;
  const total = item?.media.length ?? 0;

  const step = useCallback(
    (by: number) => setSlide((s) => (total === 0 ? 0 : (s + by + total) % total)),
    [total],
  );

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    // Stop the page scrolling behind the dialog.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openId, close, step]);

  if (items.length === 0) {
    return <p className="text-sm text-muted">{labels.empty}</p>;
  }

  return (
    <>
      <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry) => {
          const has = entry.media.length > 0;
          return (
            <li key={entry.id} className="bg-paper">
              <button
                type="button"
                disabled={!has}
                onClick={(e) => has && open(entry.id, e.currentTarget)}
                onMouseEnter={(e) => has && open(entry.id, e.currentTarget)}
                className="flex w-full flex-col gap-1 px-5 py-4 text-left transition-colors enabled:hover:bg-warm disabled:cursor-default"
              >
                <span className="text-[0.9375rem] font-semibold">{entry.name}</span>
                {entry.note && (
                  <span className="text-xs text-muted">{entry.note}</span>
                )}
                {has && (
                  <span className="mt-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-red">
                    {counter(entry.media.length, entry.media.length)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {item && total > 0 && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink/90 p-4"
          onClick={close}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={item.name}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-4xl flex-col gap-3 outline-none"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 text-warm">
              <h3 className="text-lg-display font-bold tracked-tight">{item.name}</h3>
              <button
                type="button"
                onClick={close}
                className="border border-[#3a3335] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] hover:border-warm"
              >
                {labels.close}
              </button>
            </div>

            <Slide media={item.media[slide]!} alt={item.media[slide]!.alt ?? item.name} />

            <div className="flex items-center justify-between gap-4 text-warm">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={total < 2}
                aria-label={labels.previous}
                className="border border-[#3a3335] px-5 py-2.5 text-sm font-semibold hover:border-warm disabled:opacity-40"
              >
                ←
              </button>
              <span className="text-xs tabular-nums text-plate-c">
                {counter(slide + 1, total)}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={total < 2}
                aria-label={labels.next}
                className="border border-[#3a3335] px-5 py-2.5 text-sm font-semibold hover:border-warm disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Video is played through a plain <video> rather than an image tag.
 * Cloudinary serves the two from different delivery paths, so guessing from
 * the file extension returns a broken asset instead of an error — which is why
 * the kind is stored explicitly.
 */
function Slide({ media, alt }: { media: CraftItemView["media"][number]; alt: string }) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloud) {
    return (
      <div className="plate flex aspect-video items-center justify-center text-xs uppercase tracking-[0.1em] text-muted">
        {media.publicId}
      </div>
    );
  }

  if (media.kind === "VIDEO") {
    return (
      <video
        key={media.id}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-ink object-contain"
        src={`https://res.cloudinary.com/${cloud}/video/upload/q_auto/${media.publicId}.mp4`}
      />
    );
  }

  return (
    <div className="relative aspect-video w-full bg-ink">
      <CldImage
        key={media.id}
        src={media.publicId}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 56rem, 100vw"
        className="object-contain"
      />
    </div>
  );
}
