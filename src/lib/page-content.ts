import "server-only";
import { db } from "./db";
import type { AppLocale } from "./i18n";

/**
 * Editable page copy — FR-10.5, and FR-12.11 for the Custom Made families.
 *
 * Structural copy lives in src/content as the default. This layer lets the
 * administrator override any of it without a developer, falling back to the
 * code default when no override exists. That means a page always renders:
 * an empty database is the normal starting state, not an error.
 *
 * Overrides are stored per key, with both languages in one row.
 */
export type PageBlocks = Record<string, { en?: string; id?: string }>;

/** Keys that may be overridden, with a label the operator will recognise. */
export const EDITABLE_PAGES = [
  { key: "home.hero", label: "Homepage — hero" },
  { key: "home.outcomes", label: "Homepage — don't start with a product" },
  { key: "what-we-do.intro", label: "What We Do — introduction" },
  { key: "custom-made.intro", label: "Custom Made — introduction" },
  { key: "custom-made.custom-bags", label: "Custom Made — Custom Bags" },
  { key: "custom-made.printed-textiles", label: "Custom Made — Printed Textiles" },
  { key: "custom-made.plush-characters", label: "Custom Made — Plush & Characters" },
  { key: "custom-made.silicone-moulded", label: "Custom Made — Silicone & Moulded" },
  { key: "custom-made.custom-apparel", label: "Custom Made — Custom Apparel" },
  { key: "custom-made.custom-packaging", label: "Custom Made — Custom Packaging" },
  { key: "custom-made.special-projects", label: "Custom Made — Special Projects" },
  { key: "about.story", label: "About — the story" },
  { key: "contact.intro", label: "Contact — introduction" },
] as const;

/** Fields each page key exposes, so the editor knows what to render. */
export const PAGE_FIELDS: Record<string, { name: string; label: string; multiline?: boolean }[]> = {
  default: [
    { name: "heading", label: "Heading" },
    { name: "intro", label: "Introduction", multiline: true },
  ],
};

export function fieldsFor(key: string) {
  return PAGE_FIELDS[key] ?? PAGE_FIELDS.default;
}

/**
 * Read an override, falling back to the supplied default.
 *
 * The default is passed in by the caller rather than looked up, so a page
 * never depends on the database having been seeded.
 */
export async function pageCopy(
  key: string,
  field: string,
  locale: AppLocale,
  fallback: string,
): Promise<string> {
  try {
    const row = await db.pageContent.findUnique({ where: { key } });
    if (!row) return fallback;
    const blocks = row.blocks as PageBlocks | null;
    const value = blocks?.[field]?.[locale === "id" ? "id" : "en"];
    return value && value.trim() !== "" ? value : fallback;
  } catch {
    // A page rendering its code default is a far better outcome than a page
    // that fails because the database was briefly unreachable.
    return fallback;
  }
}
