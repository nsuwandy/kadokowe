import "server-only";
import { db } from "./db";
import { AXES, type AxisKey, type Term } from "@/content/taxonomy";
import type { AppLocale } from "./i18n";

/**
 * Read browse terms from the database — FR-3.13.
 *
 * The taxonomy has to be administrator-managed, so the public site must read
 * what the admin writes. The constants in src/content/taxonomy are the seed
 * and the fallback, not the source of truth: without this indirection an
 * administrator can rename a term, see "Saved", and watch the site keep
 * showing the old name — which is exactly what happened before this existed.
 *
 * Falling back to the constants keeps every page rendering when the database
 * is empty or briefly unreachable. A browse axis showing its default labels
 * beats an axis that disappears.
 */
const AXIS_TO_ENUM: Record<AxisKey, "PRODUCT" | "PURPOSE" | "INDUSTRY" | "BUDGET"> = {
  product: "PRODUCT",
  purpose: "PURPOSE",
  industry: "INDUSTRY",
  budget: "BUDGET",
};

export type ResolvedTerm = { slug: string; label: string };

export async function getTerms(
  axis: AxisKey,
  locale: AppLocale,
): Promise<ResolvedTerm[]> {
  const fallback = (): ResolvedTerm[] =>
    AXES[axis].terms.map((t: Term) => ({
      slug: t.slug,
      label: locale === "id" ? t.id : t.en,
    }));

  try {
    const rows = await db.taxonomyTerm.findMany({
      where: { axis: AXIS_TO_ENUM[axis] },
      orderBy: { sortOrder: "asc" },
      select: { slugEn: true, nameEn: true, nameId: true },
    });
    if (rows.length === 0) return fallback();

    return rows.map((r) => ({
      slug: r.slugEn,
      // Same fallback rule as everywhere else: blank Indonesian means
      // untranslated, not deliberately empty.
      label:
        locale === "id" && r.nameId?.trim() ? r.nameId : r.nameEn,
    }));
  } catch {
    return fallback();
  }
}

/**
 * All four axes in a single query.
 *
 * This was four queries — one per axis, issued in parallel. Parallel is not
 * free when the database is on another continent: each is a separate round
 * trip over the same connection budget, and the page waits for the slowest.
 * One query returning forty rows costs one round trip and is grouped here,
 * which is work the database would otherwise do four times.
 *
 * The per-axis fallback is kept: an axis with no rows falls back to the code
 * constants independently, so a partly populated taxonomy still renders every
 * entry point.
 */
export async function getAllAxes(locale: AppLocale) {
  const keys = Object.keys(AXES) as AxisKey[];
  const fallback = (axis: AxisKey): ResolvedTerm[] =>
    AXES[axis].terms.map((t: Term) => ({
      slug: t.slug,
      label: locale === "id" ? t.id : t.en,
    }));

  let rows: { axis: string; slugEn: string; nameEn: string; nameId: string | null }[] = [];
  try {
    rows = await db.taxonomyTerm.findMany({
      orderBy: [{ axis: "asc" }, { sortOrder: "asc" }],
      select: { axis: true, slugEn: true, nameEn: true, nameId: true },
    });
  } catch {
    // A page showing its default browse terms beats a page that fails.
    return Object.fromEntries(keys.map((k) => [k, fallback(k)])) as Record<AxisKey, ResolvedTerm[]>;
  }

  const grouped = new Map<string, ResolvedTerm[]>();
  for (const row of rows) {
    const list = grouped.get(row.axis) ?? [];
    list.push({
      slug: row.slugEn,
      // Blank Indonesian means untranslated, not deliberately empty.
      label: locale === "id" && row.nameId?.trim() ? row.nameId : row.nameEn,
    });
    grouped.set(row.axis, list);
  }

  return Object.fromEntries(
    keys.map((k) => {
      const found = grouped.get(AXIS_TO_ENUM[k]) ?? [];
      return [k, found.length > 0 ? found : fallback(k)];
    }),
  ) as Record<AxisKey, ResolvedTerm[]>;
}

/** The display name for an axis itself, which is not administrator-managed. */
export function axisLabel(axis: AxisKey, locale: AppLocale) {
  return locale === "id" ? AXES[axis].id : AXES[axis].en;
}
