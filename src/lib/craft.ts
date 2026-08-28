import "server-only";
import { db } from "./db";
import type { AppLocale } from "./i18n";
import { FAMILIES, type Family } from "@/content/custom-made";

/**
 * Custom Made families, read from the database.
 *
 * The seven families used to be code constants. They are now rows, so an
 * operator can add an eighth or rewrite the sixth without a developer — but
 * the constants are kept as a fallback for the same reason the taxonomy keeps
 * its own: an empty table should render the pages the site already had, not
 * an empty section. `npm run db:seed:craft` moves the constants in.
 */
export type CraftPair = { nameEn: string; nameId?: string | null; descEn?: string | null; descId?: string | null };

export type CraftMediaView = {
  id: string;
  kind: "IMAGE" | "VIDEO";
  publicId: string;
  alt: string | null;
};

export type CraftItemView = {
  id: string;
  name: string;
  note: string | null;
  media: CraftMediaView[];
};

export type CraftMachineView = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
};

export type CraftFamilyView = {
  slug: string;
  name: string;
  lead: string | null;
  intro: string | null;
  heroImage: string | null;
  items: CraftItemView[];
  machines: CraftMachineView[];
  options: { name: string; description: string | null }[];
  branding: string[];
};

/** Blank Indonesian means untranslated, not deliberately empty (FR-11.6). */
function pickText(en: string | null | undefined, id: string | null | undefined, locale: AppLocale) {
  if (locale === "id" && id && id.trim()) return id;
  return en?.trim() ? en : null;
}

function pairs(value: unknown, locale: AppLocale): { name: string; description: string | null }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    const p = raw as CraftPair;
    const name = pickText(p?.nameEn, p?.nameId, locale);
    if (!name) return [];
    return [{ name, description: pickText(p?.descEn, p?.descId, locale) }];
  });
}

function fromConstant(f: Family, locale: AppLocale): CraftFamilyView {
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  return {
    slug: f.slug,
    name: t(f.nameEn, f.nameId),
    lead: t(f.leadEn, f.leadId),
    intro: t(f.introEn, f.introId),
    heroImage: null,
    items: (locale === "id" ? f.examplesId : f.examplesEn).map((name, i) => ({
      id: `${f.slug}-${i}`,
      name,
      note: null,
      media: [],
    })),
    machines: [],
    options: (f.options ?? []).map((o) => ({
      name: t(o.en, o.id),
      description: t(o.descEn, o.descId),
    })),
    branding: f.branding,
  };
}

const INCLUDE = {
  items: {
    orderBy: { sortOrder: "asc" },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  },
  machines: { orderBy: { sortOrder: "asc" } },
} as const;

/** Published families for the index, in the operator's order. */
export async function listCraftFamilies(locale: AppLocale): Promise<CraftFamilyView[]> {
  try {
    const rows = await db.craftFamily.findMany({
      where: { visibility: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: INCLUDE,
    });
    if (rows.length === 0) return FAMILIES.map((f) => fromConstant(f, locale));
    return rows.map((r) => shape(r, locale));
  } catch {
    return FAMILIES.map((f) => fromConstant(f, locale));
  }
}

/** One family, or null. `preview` lets an administrator see a draft (FR-10.12). */
export async function getCraftFamily(
  slug: string,
  locale: AppLocale,
  preview = false,
): Promise<CraftFamilyView | null> {
  try {
    const row = await db.craftFamily.findFirst({
      where: { slug, ...(preview ? {} : { visibility: "PUBLISHED" }) },
      include: INCLUDE,
    });
    if (row) return shape(row, locale);
  } catch {
    // fall through to the constants
  }
  const constant = FAMILIES.find((f) => f.slug === slug);
  return constant ? fromConstant(constant, locale) : null;
}

type Row = Awaited<ReturnType<typeof db.craftFamily.findFirst>> & {
  items: { id: string; nameEn: string; nameId: string | null; noteEn: string | null; noteId: string | null; media: { id: string; kind: "IMAGE" | "VIDEO"; publicId: string; altEn: string | null; altId: string | null }[] }[];
  machines: { id: string; nameEn: string; nameId: string | null; descEn: string | null; descId: string | null; image: string | null }[];
};

function shape(row: NonNullable<Row>, locale: AppLocale): CraftFamilyView {
  return {
    slug: row.slug,
    name: pickText(row.nameEn, row.nameId, locale) ?? row.slug,
    lead: pickText(row.leadEn, row.leadId, locale),
    intro: pickText(row.introEn, row.introId, locale),
    heroImage: row.heroImage,
    items: row.items.map((i) => ({
      id: i.id,
      name: pickText(i.nameEn, i.nameId, locale) ?? i.nameEn,
      note: pickText(i.noteEn, i.noteId, locale),
      media: i.media.map((m) => ({
        id: m.id,
        kind: m.kind,
        publicId: m.publicId,
        alt: pickText(m.altEn, m.altId, locale),
      })),
    })),
    machines: row.machines.map((m) => ({
      id: m.id,
      name: pickText(m.nameEn, m.nameId, locale) ?? m.nameEn,
      description: pickText(m.descEn, m.descId, locale),
      image: m.image,
    })),
    options: pairs(row.options, locale),
    branding: pairs(row.branding, locale).map((b) => b.name),
  };
}
