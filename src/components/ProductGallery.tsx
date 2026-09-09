"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plate } from "@/components/ui/Plate";

export type GalleryMedia = {
  id: string;
  publicId: string;
  kind: "IMAGE" | "VIDEO";
  alt: string | null;
  caption: string | null;
};

/**
 * The product's photography — FR-4.6.
 *
 * One gallery rather than two. The page used to show the first three images
 * beside the hero and push everything after them into a separate grid further
 * down, so a product with six photographs had them in two places and the
 * fourth looked like it belonged to a different section.
 *
 * The main frame keeps a fixed aspect and the media is contained inside it,
 * so a portrait shot and a landscape one leave the surrounding layout exactly
 * where it was. That is what stops a tall image pushing everything below it
 * down the page.
 *
 * Selection is a real button list: clicking, tabbing and the arrow keys all
 * work, and the current frame is announced rather than only outlined.
 */
export function ProductGallery({
  media,
  name,
  badge,
  labels,
}: {
  media: GalleryMedia[];
  name: string;
  /** The "Ready when you are" flag, drawn over the main frame. */
  badge?: string | null;
  labels: { gallery: string; video: string; showing: string };
}) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLUListElement>(null);

  /**
   * The frame's shape, taken from the media in it.
   *
   * A fixed frame with the image contained inside shows the whole image but
   * pads whatever is left over, so a portrait shot sits between two grey
   * bars. Letting the frame take the image's own proportions removes the
   * padding entirely — the image *is* the frame.
   *
   * Measured from the file rather than stored, so it works for photographs
   * already uploaded. Until the first one loads the frame holds a plausible
   * shape rather than collapsing to nothing.
   */
  const [ratio, setRatio] = useState<Record<string, number>>({});
  const shapeOf = (id: string) => ratio[id] ?? 4 / 3.6;

  const current = media[index] ?? media[0];
  const count = media.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // Arrow keys move along the strip while it holds focus, which is what a row
  // of thumbnails implies and what a keyboard user will try.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = index + (e.key === "ArrowRight" ? 1 : -1);
    go(next);
    const btn = strip.current?.querySelectorAll("button")[((next % count) + count) % count];
    (btn as HTMLElement | undefined)?.focus();
  };

  // A clip left playing while the visitor moves to a photograph goes on
  // talking over a page it is no longer part of.
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    video.current?.pause();
  }, [index]);

  if (count === 0) return null;

  return (
    /**
     * Capped, and capped here rather than on the column.
     *
     * Now that the frame takes the image's own proportions, the column's full
     * width is not a sensible size for every photograph — on a wide monitor
     * it made a landscape shot enormous and a portrait one taller than the
     * screen. The cap holds the gallery to a readable size and leaves the
     * layout around it alone; below that width it still fills what it has.
     */
    <div className="flex w-full max-w-[34rem] flex-col gap-3">
      <div className="relative" style={{ aspectRatio: shapeOf(current.id) }}>
        {current.kind === "VIDEO" ? (
          <video
            ref={video}
            key={current.id}
            controls
            playsInline
            preload="metadata"
            aria-label={current.alt ?? name}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth) {
                setRatio((r) => ({ ...r, [current.id]: v.videoWidth / v.videoHeight }));
              }
            }}
            className="h-full w-full bg-ink"
            src={videoUrl(current.publicId)}
          />
        ) : (
          <Plate
            key={current.id}
            publicId={current.publicId}
            alt={current.alt ?? name}
            caption={current.caption ?? name}
            ratio={String(shapeOf(current.id))}
            fit="cover"
            onLoad={(w, h) =>
              setRatio((r) => (r[current.id] ? r : { ...r, [current.id]: w / h }))
            }
            // Matches the cap above, so Cloudinary is asked for a file the
            // size of the frame rather than one sized to the whole column.
            sizes="(min-width: 1024px) 34rem, 100vw"
            priority={index === 0}
            className="h-full w-full"
          />
        )}

        {badge && (
          <span className="absolute top-0 left-0 z-2 bg-red px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-paper">
            {badge}
          </span>
        )}
      </div>

      {count > 1 && (
        <>
          {/* Scrolls sideways rather than wrapping into rows of unpredictable
              height, so however many there are the block below stays put. */}
          <ul
            ref={strip}
            onKeyDown={onKey}
            aria-label={labels.gallery}
            className="flex gap-3 overflow-x-auto pb-1"
          >
            {media.map((item, i) => (
              <li key={item.id} className="w-20 shrink-0 sm:w-24">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? "true" : undefined}
                  aria-label={`${item.alt ?? name}${item.kind === "VIDEO" ? ` — ${labels.video}` : ""}`}
                  className={`relative block w-full outline-none transition-opacity ${
                    i === index
                      ? "ring-2 ring-red ring-offset-2 ring-offset-paper"
                      : "opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink"
                  }`}
                >
                  {item.kind === "VIDEO" && cloud() ? (
                    /* A clip's thumbnail is a frame Cloudinary renders from the
                       clip itself, served from the video path. Asked for
                       through CldImage it would be looked up as an image asset
                       of that name, which does not exist. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={videoPoster(item.publicId)}
                      alt=""
                      width={96}
                      height={96}
                      className="aspect-square w-full bg-ink object-contain"
                    />
                  ) : (
                    <Plate
                      publicId={item.kind === "VIDEO" ? null : item.publicId}
                      alt=""
                      ratio="1 / 1"
                      fit="contain"
                      sizes="96px"
                    />
                  )}
                  {item.kind === "VIDEO" && (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center bg-ink/35 text-paper"
                    >
                      ▶
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <p className="sr-only" role="status">
            {labels.showing} {index + 1} / {count}
          </p>
        </>
      )}
    </div>
  );
}

const cloud = () => process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Clips come from the video delivery path; an image URL returns nothing. */
function videoUrl(publicId: string) {
  return `https://res.cloudinary.com/${cloud()}/video/upload/q_auto/${publicId}.mp4`;
}

/**
 * A still from the clip, for its thumbnail.
 *
 * Cloudinary renders the frame at `so_0` from the video itself, so a clip
 * needs no separate poster image uploaded beside it.
 */
function videoPoster(publicId: string) {
  return `https://res.cloudinary.com/${cloud()}/video/upload/so_0,c_fill,w_192,h_192,q_auto,f_jpg/${publicId}.jpg`;
}
