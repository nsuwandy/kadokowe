"use client";

import {
  useCallback, useEffect, useId, useRef, useState, useSyncExternalStore,
} from "react";
import { CldImage } from "next-cloudinary";
import type { CraftItemView, CraftMediaView } from "@/lib/craft";

/**
 * "What can we create?" — each example is its own slideshow, and opening one
 * expands a bubble beside it.
 *
 * This was a grid of text buttons that opened a full-screen dark modal. Two
 * things were wrong with that. The photographs are the answer to the question
 * the section asks, and none of them were visible until you clicked; and
 * taking the whole viewport to show one picture of a tote bag treats a browse
 * as a destination. Someone comparing three constructions had to open, look,
 * close, open — with the page thrown away each time.
 *
 * So the cards carry the pictures themselves, and the detail opens as a
 * bubble anchored under the card it came from. The page stays where it was.
 *
 * Opening is bound to click, not hover. Hover does not exist on a touch
 * screen, and SRS §2.8 has most visitors arriving from WhatsApp on a phone.
 * Hover instead pauses the card's own cycling, which is what a pointer over a
 * moving image should do.
 */

/**
 * How many photographs a card cycles through.
 *
 * Every slide in a card is in the DOM so it can crossfade, so this is a cap on
 * page weight rather than a design limit: a family with nine examples of ten
 * photographs each would otherwise put ninety images on one page. The bubble
 * still carries the complete set.
 */
const CARD_SLIDES = 4;

/** Milliseconds a card holds each photograph. */
const DWELL = 3800;

/**
 * Whether the visitor has asked their system for less movement.
 *
 * Read through useSyncExternalStore rather than an effect: the server has no
 * media queries, and setting state from an effect to correct that is both a
 * lint error here and a frame of movement the visitor asked not to see.
 */
function useReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export type CraftLabels = {
  heading: string;
  empty: string;
  previous: string;
  next: string;
  close: string;
  /** e.g. "{n} of {total}" — a template, because a function cannot cross
   *  the server/client boundary. */
  counter: string;
};

export function CraftShowcase({
  items,
  labels,
}: {
  items: CraftItemView[];
  labels: CraftLabels;
}) {
  const counter = (n: number, total: number) =>
    labels.counter.replace("{n}", String(n)).replace("{total}", String(total));

  const [openId, setOpenId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((id: string, from: HTMLElement, at: number) => {
    openerRef.current = from;
    setOpenId((current) => (current === id ? null : id));
    // Carry on from the picture that was on screen, rather than snapping back
    // to the first one the moment it is looked at properly.
    setSlide(at);
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
    return () => document.removeEventListener("keydown", onKey);
  }, [openId, close, step]);

  // The body no longer has its scroll locked. The bubble is not modal — it
  // sits in the page, and a page that will not scroll around it reads as
  // broken rather than as focused.

  if (items.length === 0) {
    return <p className="text-sm text-muted">{labels.empty}</p>;
  }

  return (
    // The hairline grid the Custom Made index uses for its family cards. The
    // pictures butt up against each other, which is the point: this is a
    // contact sheet of what can be made, not a row of separate objects.
    <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {items.map((entry) => (
        <CraftCard
          key={entry.id}
          entry={entry}
          labels={labels}
          counter={counter}
          isOpen={openId === entry.id}
          onOpen={open}
          onClose={close}
          slide={slide}
          step={step}
        />
      ))}
    </ul>
  );
}

function CraftCard({
  entry, labels, counter, isOpen, onOpen, onClose, slide, step,
}: {
  entry: CraftItemView;
  labels: CraftLabels;
  counter: (n: number, total: number) => string;
  isOpen: boolean;
  onOpen: (id: string, from: HTMLElement, at: number) => void;
  onClose: () => void;
  slide: number;
  step: (by: number) => void;
}) {
  const still = useReducedMotion();
  const shown = entry.media.slice(0, CARD_SLIDES);
  const has = entry.media.length > 0;

  const [at, setAt] = useState(0);
  const [hovered, setHovered] = useState(false);
  const bubbleId = useId();
  const cardRef = useRef<HTMLLIElement>(null);

  // Cycling stops while a pointer is over the card, while the bubble is open,
  // and for anyone who has asked their system for less movement.
  const cycling = shown.length > 1 && !hovered && !isOpen && !still;

  useEffect(() => {
    if (!cycling) return;
    const id = window.setInterval(
      () => setAt((n) => (n + 1) % shown.length),
      DWELL,
    );
    return () => window.clearInterval(id);
  }, [cycling, shown.length]);

  // Clicking anywhere else closes the bubble. It is a popover, not a dialog:
  // nothing is trapped, so nothing should have to be dismissed deliberately.
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, onClose]);

  const total = entry.media.length;

  return (
    <li ref={cardRef} className="relative bg-paper">
      <button
        type="button"
        disabled={!has}
        aria-expanded={has ? isOpen : undefined}
        aria-controls={has ? bubbleId : undefined}
        onClick={(e) => has && onOpen(entry.id, e.currentTarget, at)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group block w-full text-left outline-none disabled:cursor-default"
      >
        <div
          className={`relative aspect-[4/3] overflow-hidden ${
            isOpen ? "ring-2 ring-red" : ""
          }`}
        >
          {shown.length === 0 ? (
            <div className="plate size-full" />
          ) : (
            shown.map((media, i) => (
              <div
                key={media.id}
                aria-hidden={i !== at}
                className="absolute inset-0 transition-opacity duration-700 ease-out"
                style={{ opacity: i === at ? 1 : 0 }}
              >
                <Still media={media} alt={media.alt ?? entry.name} />
              </div>
            ))
          )}

          {/* The name sits on the picture rather than under it: at this size
              the photograph is the thing being scanned, and a caption below
              would push the next card's image off the fold. */}
          <span className="absolute bottom-0 left-0 z-2 max-w-[88%] bg-paper px-3 py-2 text-[0.6875rem] font-semibold leading-snug tracking-[0.02em] transition-colors group-enabled:group-hover:text-red">
            {entry.name}
            {entry.note && (
              <span className="mt-0.5 block text-[0.625rem] font-normal text-muted">
                {entry.note}
              </span>
            )}
          </span>

          {shown.length > 1 && (
            <span className="absolute right-2.5 bottom-2.5 z-2 flex gap-1.5">
              {shown.map((media, i) => (
                <span
                  key={media.id}
                  className={`size-1.5 rounded-full transition-colors ${
                    i === at ? "bg-paper" : "bg-paper/45"
                  }`}
                />
              ))}
            </span>
          )}

          {total > CARD_SLIDES && (
            <span className="absolute top-2.5 right-2.5 z-2 bg-ink/70 px-2 py-1 text-[0.625rem] font-semibold tabular-nums text-paper">
              {total}
            </span>
          )}
        </div>
      </button>

      {isOpen && total > 0 && (
        <Bubble
          id={bubbleId}
          name={entry.name}
          media={entry.media[slide]!}
          labels={labels}
          text={counter(slide + 1, total)}
          total={total}
          onStep={step}
          onClose={onClose}
        />
      )}
    </li>
  );
}

/**
 * The detail, anchored under the card it came from.
 *
 * Deliberately narrow and deliberately attached — the tail is what makes it
 * read as this card's picture rather than as a new screen. It sits above
 * neighbouring cards but below the site header, so scrolling with it open
 * behaves the way the page normally does.
 */
function Bubble({
  id, name, media, labels, text, total, onStep, onClose,
}: {
  id: string;
  name: string;
  media: CraftMediaView;
  labels: CraftLabels;
  text: string;
  total: number;
  onStep: (by: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div
      id={id}
      ref={ref}
      role="dialog"
      aria-label={name}
      tabIndex={-1}
      className="craft-bubble absolute top-full right-0 left-0 z-40 mt-3 origin-top border border-line bg-paper p-3 shadow-[0_18px_44px_rgba(15,12,13,0.18)] outline-none sm:-right-4 sm:-left-4"
    >
      {/* The tail. Two squares rotated 45°, the back one drawing the border
          and the front one covering the seam where it meets the panel. */}
      <span
        aria-hidden
        className="absolute -top-[7px] left-8 size-3 rotate-45 border-t border-l border-line bg-paper"
      />

      <div className="relative bg-ink">
        <Slide media={media} alt={media.alt ?? name} />
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span className="mr-auto truncate text-xs font-semibold">{name}</span>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label={labels.previous}
              className="border border-line px-2.5 py-1 text-xs leading-none font-semibold hover:border-ink"
            >
              ←
            </button>
            <span className="text-[0.6875rem] tabular-nums text-muted">{text}</span>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label={labels.next}
              className="border border-line px-2.5 py-1 text-xs leading-none font-semibold hover:border-ink"
            >
              →
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="border border-line px-2.5 py-1 text-xs leading-none font-semibold hover:border-red hover:text-red"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const cloud = () => process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * A card slide. Always a still, never a playing clip.
 *
 * A grid of cards autoplaying video would be unreadable, so a clip shows the
 * frame Cloudinary renders at `so_0` — the video itself is in the bubble,
 * where the visitor asked for it.
 */
function Still({ media, alt }: { media: CraftMediaView; alt: string }) {
  const name = cloud();
  if (!name) {
    return (
      <div className="plate flex size-full items-center justify-center px-3 text-center text-[0.625rem] uppercase tracking-[0.1em] text-muted">
        {media.publicId}
      </div>
    );
  }

  if (media.kind === "VIDEO") {
    return (
      /* The frame Cloudinary renders from the clip itself, served from the
         video path. Asked for through CldImage it would be looked up as an
         image asset of that name, which does not exist. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://res.cloudinary.com/${name}/video/upload/so_0,c_fill,w_800,h_600,q_auto,f_jpg/${media.publicId}.jpg`}
        alt={alt}
        loading="lazy"
        className="size-full object-cover"
      />
    );
  }

  return (
    <CldImage
      src={media.publicId}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className="object-cover"
    />
  );
}

/**
 * Video is played through a plain <video> rather than an image tag.
 * Cloudinary serves the two from different delivery paths, so guessing from
 * the file extension returns a broken asset instead of an error — which is why
 * the kind is stored explicitly.
 */
function Slide({ media, alt }: { media: CraftMediaView; alt: string }) {
  const name = cloud();

  if (!name) {
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
        autoPlay
        playsInline
        preload="metadata"
        className="aspect-[4/3] w-full bg-ink object-contain"
        src={`https://res.cloudinary.com/${name}/video/upload/q_auto/${media.publicId}.mp4`}
      />
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full">
      <CldImage
        key={media.id}
        src={media.publicId}
        alt={alt}
        fill
        sizes="(min-width: 640px) 24rem, 92vw"
        className="object-contain"
      />
    </div>
  );
}
