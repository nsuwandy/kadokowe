import Link from "next/link";
import { AXIS_KEYS, type AxisKey } from "@/content/taxonomy";
import { getTerms, axisLabel } from "@/lib/taxonomy";
import { localePath } from "@/lib/nav";
import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * The four browse axes — FR-3.1 to FR-3.6, FR-3.13.
 *
 * FR-3.6 requires none be subordinated to another, so all four render at
 * equal weight rather than one tab being visually promoted. This is the
 * structural answer to the dual-visitor principle: a visitor who knows their
 * product and one who only knows their event need equally obvious routes in.
 *
 * Terms come from the database so an administrator's rename takes effect
 * here, with the seed constants as fallback (FR-3.13).
 *
 * Rendered as links rather than client-side tabs so each filtered view keeps
 * a shareable, indexable URL.
 */
export async function AxisBar({
  active,
  locale,
}: {
  active?: AxisKey;
  locale: AppLocale;
}) {
  const firstTerms = await Promise.all(
    AXIS_KEYS.map(async (key) => (await getTerms(key, locale))[0]?.slug ?? ""),
  );

  return (
    <nav
      aria-label={locale === "id" ? "Cara menelusuri" : "Browse by"}
      className="mb-7 flex flex-wrap border border-line"
    >
      {AXIS_KEYS.map((key, i) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={localePath(`/products/${key}/${firstTerms[i]}`, locale)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-auto px-5 py-4 text-center font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors",
              i < AXIS_KEYS.length - 1 && "border-r border-line",
              isActive
                ? "bg-ink text-paper"
                : "bg-paper text-muted hover:text-ink",
            )}
          >
            {axisLabel(key, locale)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Term chips within the active axis. */
export async function TermChips({
  axis,
  activeSlug,
  locale,
}: {
  axis: AxisKey;
  activeSlug: string;
  locale: AppLocale;
}) {
  const terms = await getTerms(axis, locale);

  return (
    <div className="mb-9 flex flex-wrap gap-2">
      {terms.map((term) => {
        const isActive = term.slug === activeSlug;
        return (
          <Link
            key={term.slug}
            href={localePath(`/products/${axis}/${term.slug}`, locale)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border px-4 py-2.5 text-xs font-semibold transition-colors",
              isActive
                ? "border-red bg-red text-paper"
                : "border-line bg-paper hover:border-ink",
            )}
          >
            {term.label}
          </Link>
        );
      })}
    </div>
  );
}
