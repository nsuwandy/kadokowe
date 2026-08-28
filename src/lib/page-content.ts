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
  // The homepage is not listed here: it has its own tab, where the sections
  // appear in the order they appear on the page. Two editors writing the same
  // keys is how one of them ends up forgotten.
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

/**
 * The homepage, section by section, in the order they are scrolled through —
 * FR-10.5, FR-10.6.
 *
 * The numbering is the page's own. An operator editing "the dark band with
 * the statistics" needs to find it by where it sits, not by a key name, so
 * the label carries the position and the note says what the section is.
 */
export const HOME_SECTIONS = [
  {
    key: "home.hero",
    label: "01 · Hero",
    note: "The first screen. Up to three photographs, which fade from one to the next.",
  },
  {
    key: "home.outcomes",
    label: "02 · Where to begin",
    note: "The six outcome cards. Only the first line of the headline is editable — the italic second line is a typographic pair with it.",
  },
  {
    key: "home.ideas",
    label: "03 · The Idea Library",
    note: "The preview of the catalogue.",
  },
  {
    key: "home.teasers",
    label: "Custom Made & Ready Stock",
    note: "The two linked panels between the featured project and the category strip.",
  },
  {
    key: "home.categories",
    label: "05 · Browse by product",
    note: "The category strip. The categories themselves are managed under Categories.",
  },
  {
    key: "home.process",
    label: "06 · How we work",
    note: "The split band on warm ground. The numbered process steps are fixed.",
  },
  {
    key: "home.new",
    label: "07 · New discoveries",
    note: "The product rail. Which products appear is set by the New tick on each product.",
  },
  {
    key: "home.behind",
    label: "08 · Behind the scenes",
    note: "The full-width production photograph and the copy over it.",
  },
  {
    key: "home.insights",
    label: "09 · Ideas & Insights",
    note: "The article cards. Which articles appear is the three most recently published.",
  },
  {
    key: "home.cta",
    label: "10 · Closing band",
    note: "The red band at the foot of the page.",
  },
] as const;

/** Fields each page key exposes, so the editor knows what to render. */
export const PAGE_FIELDS: Record<string, { name: string; label: string; multiline?: boolean; image?: boolean }[]> = {
  default: [
    { name: "heading", label: "Heading" },
    { name: "intro", label: "Introduction", multiline: true },
    // FR-10.5 and FR-12.11 both say copy *and imagery*. Without this the
    // Custom Made family heroes could only ever render the grey placeholder,
    // because nothing else on those pages carries an image ID.
    { name: "hero", label: "Hero image", image: true },
  ],
  // FR-10.6 — the homepage hero rotates through these (FR-2.2). Kept as
  // separate slots rather than a gallery so the order is explicit and an
  // empty slot is obviously empty.
  "home.hero": [
    { name: "eyebrow", label: "Small line above the headline" },
    { name: "heading", label: "Headline" },
    { name: "intro", label: "Sub-headline", multiline: true },
    { name: "hero1", label: "Hero image 1", image: true },
    { name: "hero2", label: "Hero image 2", image: true },
    { name: "hero3", label: "Hero image 3", image: true },
  ],
  "home.outcomes": [
    { name: "eyebrow", label: "Small line above the headline" },
    { name: "heading", label: "Headline — first line only" },
    { name: "intro", label: "Introduction", multiline: true },
  ],
  "home.ideas": [
    { name: "eyebrow", label: "Small line above the headline" },
    { name: "heading", label: "Headline" },
    { name: "intro", label: "Introduction", multiline: true },
  ],
  "home.teasers": [
    { name: "customHeading", label: "Custom Made — headline" },
    { name: "customIntro", label: "Custom Made — text", multiline: true },
    { name: "readyHeading", label: "Ready Stock — headline" },
    { name: "readyIntro", label: "Ready Stock — text", multiline: true },
  ],
  "home.categories": [
    { name: "eyebrow", label: "Small line above the strip" },
  ],
  "home.process": [
    { name: "eyebrow", label: "Small line above the headline" },
    { name: "heading", label: "Headline" },
    { name: "hero", label: "Photograph", image: true },
  ],
  "home.new": [
    { name: "heading", label: "Headline" },
  ],
  "home.behind": [
    { name: "eyebrow", label: "Small line above the headline" },
    { name: "heading", label: "Headline" },
    { name: "intro", label: "Text", multiline: true },
    { name: "hero", label: "Background photograph", image: true },
  ],
  "home.insights": [
    { name: "eyebrow", label: "Small line above the headline" },
    { name: "heading", label: "Headline" },
  ],
  "home.cta": [
    { name: "heading", label: "Headline" },
    { name: "intro", label: "Text below it", multiline: true },
    { name: "cta", label: "Button label" },
  ],
};

/**
 * Every homepage override in one query.
 *
 * The homepage reads ten section keys. Ten round trips on the busiest page of
 * the site is the kind of cost that only shows up once the database is in
 * Singapore and the function is not.
 */
export async function homeBlocks(): Promise<Record<string, PageBlocks>> {
  try {
    const rows = await db.pageContent.findMany({
      where: { key: { startsWith: "home." } },
    });
    return Object.fromEntries(
      rows.map((r) => [r.key, (r.blocks as PageBlocks | null) ?? {}]),
    );
  } catch {
    // A homepage rendering its code defaults beats one that fails because the
    // database blinked.
    return {};
  }
}

export function fieldsFor(key: string) {
  return PAGE_FIELDS[key] ?? PAGE_FIELDS.default;
}

/** All values for a page key at once, for callers needing several fields. */
export async function pageBlocks(key: string): Promise<PageBlocks> {
  try {
    const row = await db.pageContent.findUnique({ where: { key } });
    return (row?.blocks as PageBlocks | null) ?? {};
  } catch {
    return {};
  }
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
    return blockCopy(row.blocks as PageBlocks | null, field, locale, fallback);
  } catch {
    // A page rendering its code default is a far better outcome than a page
    // that fails because the database was briefly unreachable.
    return fallback;
  }
}

/**
 * Resolve one field from blocks already loaded, for pages reading several
 * fields from the same key — one query instead of one per field.
 *
 * Note what this deliberately does not do: an empty Indonesian override falls
 * back to the *code* default, not to the English override. Callers pass an
 * already-localised default, so falling back to English here would put
 * English copy on an Indonesian page — the opposite of the fallback rule
 * used for database content in src/lib/i18n, because there the English column
 * is the only other candidate and here a localised default exists.
 */
export function blockCopy(
  blocks: PageBlocks | null | undefined,
  field: string,
  locale: AppLocale,
  fallback: string,
): string {
  const value = blocks?.[field]?.[locale === "id" ? "id" : "en"];
  return value && value.trim() !== "" ? value : fallback;
}
