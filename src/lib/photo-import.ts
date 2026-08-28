/**
 * Bulk photography import — parsing and matching.
 *
 * The operator zips a folder of product photographs named
 * `product_name:index`, where index 1 is the hero and 2 upwards are the
 * gallery in order. This module turns those filenames into a plan; it does no
 * I/O, so the rules below are testable and the same parse runs in the browser
 * preview and in the server action that applies it.
 *
 * The separator is deliberately permissive. The requested format uses a
 * colon, but a colon is illegal in Windows filenames and is displayed as `/`
 * by the macOS Finder — a zip built on Windows physically cannot contain one.
 * Rejecting `pen_1` or `pen (2)` would mean the feature works only for
 * whoever wrote the spec, so any of `: _ - space (n)` separates the index,
 * and the index is only ever the trailing run of digits.
 */

/** A filename that could not be understood, kept with the reason. */
export type PhotoIssue = { file: string; problem: string };

export type ParsedPhoto = {
  file: string;
  /** Normalised to slug shape: lower case, hyphens. */
  slug: string;
  /** 1 is the hero; 2 upwards are gallery positions in order. */
  index: number;
};

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

/**
 * Zip entries that are never photographs.
 *
 * `__MACOSX/` is the resource-fork directory the macOS Finder adds to every
 * zip it creates, and its entries mirror the real filenames — left in, every
 * photograph would appear twice and each pair would look like a duplicate
 * index conflict.
 */
export function isIgnorableEntry(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  return (
    path.startsWith("__MACOSX/") ||
    path.includes("/__MACOSX/") ||
    base.startsWith(".") ||
    base === "" ||
    path.endsWith("/")
  );
}

/** Lower case, underscores and spaces to hyphens, punctuation dropped. */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse one zip entry into a slug and an index.
 *
 * Returns a problem string instead of throwing, because a single unreadable
 * filename in a folder of three hundred should be reported beside the others
 * rather than stopping the import.
 */
export function parsePhotoName(path: string): ParsedPhoto | PhotoIssue {
  const base = (path.split("/").pop() ?? path).trim();

  if (!IMAGE_EXT.test(base)) {
    return { file: path, problem: "Not an image file — skipped." };
  }

  const stem = base.replace(IMAGE_EXT, "");

  // `name (2)` — what Finder and Explorer produce when de-duplicating.
  const parenthesised = stem.match(/^(.*?)[\s_-]*\((\d+)\)$/);
  // `name:2`, `name_2`, `name-2`, `name 2`.
  const suffixed = stem.match(/^(.*?)[\s:_-]+(\d+)$/);
  const match = parenthesised ?? suffixed;

  if (!match) {
    return {
      file: path,
      problem:
        "No position number. Name files like colour_ballpoint_pen:1, where 1 is the hero.",
    };
  }

  const [, rawName, rawIndex] = match;
  const index = Number(rawIndex);
  const slug = toSlug(rawName ?? "");

  if (!slug) {
    return { file: path, problem: "No product name before the position number." };
  }
  if (!Number.isInteger(index) || index < 1) {
    return { file: path, problem: "Position must be 1 or higher — 1 is the hero." };
  }

  return { file: path, slug, index };
}

export type PhotoAssignment = {
  slug: string;
  /** The product's display name, for the preview table. */
  name: string;
  hero: string | null;
  gallery: string[];
  files: { file: string; index: number }[];
};

export type PhotoPlan = {
  assignments: PhotoAssignment[];
  issues: PhotoIssue[];
};

/**
 * Match parsed filenames against the catalogue.
 *
 * Products absent from the zip are left completely alone. For a product that
 * is present, the incoming set replaces what it had: a partial upload would
 * otherwise interleave new photographs with old ones at unpredictable
 * positions, which is harder to reason about than "the zip is the truth for
 * the products it names".
 */
export function planPhotoImport(
  parsed: ParsedPhoto[],
  products: { slug: string; nameEn: string }[],
): PhotoPlan {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  // Fall back to the slugified name, so a zip named from a spreadsheet column
  // of product names still matches.
  const byName = new Map(products.map((p) => [toSlug(p.nameEn), p]));

  const issues: PhotoIssue[] = [];
  const grouped = new Map<string, ParsedPhoto[]>();

  for (const photo of parsed) {
    const product = bySlug.get(photo.slug) ?? byName.get(photo.slug);
    if (!product) {
      issues.push({
        file: photo.file,
        problem: `No product with the address "${photo.slug}".`,
      });
      continue;
    }
    const list = grouped.get(product.slug) ?? [];
    list.push(photo);
    grouped.set(product.slug, list);
  }

  const assignments: PhotoAssignment[] = [];

  for (const [slug, photos] of grouped) {
    const seen = new Map<number, string>();
    const usable: ParsedPhoto[] = [];

    for (const photo of [...photos].sort((a, b) => a.index - b.index || a.file.localeCompare(b.file))) {
      const taken = seen.get(photo.index);
      if (taken) {
        issues.push({
          file: photo.file,
          problem: `Position ${photo.index} is already taken by ${taken}.`,
        });
        continue;
      }
      seen.set(photo.index, photo.file);
      usable.push(photo);
    }

    if (usable.length === 0) continue;

    const hero = usable.find((p) => p.index === 1) ?? null;
    const gallery = usable.filter((p) => p.index > 1);

    assignments.push({
      slug,
      name: (bySlug.get(slug) ?? byName.get(slug))!.nameEn,
      hero: hero ? hero.file : null,
      gallery: gallery.map((p) => p.file),
      files: usable.map((p) => ({ file: p.file, index: p.index })),
    });
  }

  assignments.sort((a, b) => a.name.localeCompare(b.name));
  return { assignments, issues };
}
