import { cn } from "@/lib/cn";
import { CloudImage } from "./CloudImage";

/**
 * An image surface with a built-in empty state.
 *
 * The approved concept used labelled grey plates to mark where photography
 * belongs. That is not only a prototyping device: with a catalogue growing
 * toward a thousand products, some records will always be ahead of their
 * imagery, and an editorial layout with a missing image must still hold its
 * composition rather than collapse. The plate is therefore the permanent
 * empty state, not scaffolding to be removed.
 *
 * Images are served through Cloudinary rather than the host's image
 * optimisation, which is the capped resource on the free hosting tier
 * (SRS §13.2).
 */
export function Plate({
  publicId,
  alt,
  caption,
  ratio = "4 / 3",
  tone = "light",
  sizes = "100vw",
  priority = false,
  className,
}: {
  publicId?: string | null;
  alt?: string | null;
  /** Names the intended shot while the image is absent. */
  caption?: string | null;
  ratio?: string;
  tone?: "light" | "dark" | "red";
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  // Without a cloud name next-cloudinary cannot build a URL and renders
  // nothing at all, which would leave a bare coloured box where a photograph
  // should be. Falling back to the labelled placeholder means a
  // misconfigured or not-yet-configured Cloudinary degrades to the same
  // empty state as a product that simply has no photograph yet.
  const imageId =
    publicId && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? publicId : null;

  const tones = {
    light: "plate",
    dark: "bg-linear-150 from-[#2a2426] via-[#171314] to-ink",
    red: "bg-linear-150 from-[#d42527] via-[#a80102] to-[#7e0001]",
  } as const;

  return (
    <div
      className={cn("relative overflow-hidden", tones[tone], className)}
      style={{ aspectRatio: ratio }}
    >
      {imageId ? (
        <CloudImage
          publicId={imageId}
          alt={alt ?? ""}
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        caption && (
          <span
            className={cn(
              "absolute bottom-0 left-0 z-2 max-w-[88%] px-3 py-2 text-[0.5625rem] font-semibold uppercase leading-snug tracking-[0.14em]",
              tone === "light" && "bg-paper text-muted",
              tone === "dark" && "bg-ink text-plate-c",
              tone === "red" && "bg-black/40 text-warm",
            )}
          >
            {caption}
          </span>
        )
      )}
    </div>
  );
}
