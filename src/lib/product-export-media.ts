import "server-only";

/**
 * Fetch product photographs for the Excel and PDF exports.
 *
 * This is the part of the export that can fail slowly rather than loudly. A
 * thousand-product catalogue means a thousand round trips to Cloudinary inside
 * one request, and a serverless function has neither the time nor the memory
 * for that — so the work is bounded three ways: a cap on how many rows carry a
 * photograph, a small number of fetches in flight at once, and a timeout on
 * each one. A missing picture prints as an empty cell; it never fails the
 * export. An operator who asked for a catalogue and got a 504 has nothing.
 */

/**
 * How many photographs one export will fetch.
 *
 * Chosen against the deploy target rather than plucked: Vercel's Hobby tier
 * gives a function 60 seconds, and at six in flight over a ~200ms fetch this
 * is roughly ten. Rows past the cap still export — they just print without a
 * picture, and the caller is told so it can say why.
 */
export const PHOTO_LIMIT = 300;

/** Fetches in flight. Cloudinary is fine with more; the function's memory is not. */
const CONCURRENCY = 6;

/** Per-image ceiling. One slow asset must not hold up the whole file. */
const TIMEOUT_MS = 8000;

/**
 * Delivered small, square, and as JPEG.
 *
 * `c_pad` rather than `c_fit` so every thumbnail comes back at exactly
 * THUMB_PX square. That is worth more than it looks: Excel anchors a picture
 * by position and size, with no way to ask the file how big it is, so a
 * variable size would have to be recovered by parsing the JPEG's own header —
 * forty lines of byte-walking that can only ever be a source of bugs. Padding
 * also lines the pictures up in a column, which a sheet of mixed portrait and
 * landscape shots otherwise does not. It pads rather than crops because
 * cropping a product photograph to a square cuts the product.
 */
const THUMB_PX = 320;
const THUMB = `c_pad,w_${THUMB_PX},h_${THUMB_PX},b_white,f_jpg,q_auto`;

export type Thumb = { bytes: Uint8Array; width: number; height: number };

function thumbUrl(publicId: string): string | null {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return null;
  // Public IDs carry slashes as folder separators, which must survive; spaces
  // and the like must not.
  const path = publicId.split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${cloud}/image/upload/${THUMB}/${path}.jpg`;
}

async function fetchOne(publicId: string): Promise<Thumb | null> {
  const url = thumbUrl(publicId);
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0) return null;
    return { bytes, width: THUMB_PX, height: THUMB_PX };
  } catch {
    // A retired asset, a typo in a public ID, a slow response. None of these
    // are worth losing the other 299 rows over.
    return null;
  }
}

/**
 * Fetch the given photographs, in order, up to `PHOTO_LIMIT`.
 *
 * Returns what it managed to get. `skipped` is how many public IDs were left
 * unfetched because of the cap, so the caller can say so rather than let the
 * operator discover a half-illustrated file on their own.
 */
export async function fetchThumbs(
  publicIds: string[],
): Promise<{ thumbs: Map<string, Thumb>; skipped: number }> {
  const unique = [...new Set(publicIds.filter(Boolean))];
  const wanted = unique.slice(0, PHOTO_LIMIT);
  const thumbs = new Map<string, Thumb>();

  let next = 0;
  const worker = async () => {
    while (next < wanted.length) {
      const id = wanted[next++];
      const thumb = await fetchOne(id);
      if (thumb) thumbs.set(id, thumb);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, wanted.length) }, worker),
  );

  return { thumbs, skipped: unique.length - wanted.length };
}
