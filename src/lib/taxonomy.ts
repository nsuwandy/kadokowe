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

/** All four axes at once, for pages that show every entry point. */
export async function getAllAxes(locale: AppLocale) {
  const keys = Object.keys(AXES) as AxisKey[];
  const entries = await Promise.all(
    keys.map(async (k) => [k, await getTerms(k, locale)] as const),
  );
  return Object.fromEntries(entries) as Record<AxisKey, ResolvedTerm[]>;
}

/** The display name for an axis itself, which is not administrator-managed. */
export function axisLabel(axis: AxisKey, locale: AppLocale) {
  return locale === "id" ? AXES[axis].id : AXES[axis].en;
}
