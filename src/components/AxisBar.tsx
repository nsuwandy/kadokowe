import Link from "next/link";
import { AXES, AXIS_KEYS, type AxisKey } from "@/content/taxonomy";
import { localePath } from "@/lib/nav";
import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * The four browse axes — FR-3.1 to FR-3.6.
 *
 * FR-3.6 requires none be subordinated to another, so all four are rendered
 * at equal weight rather than one tab being visually promoted. This is the
 * structural answer to the dual-visitor principle: a visitor who knows their
 * product and a visitor who only knows their event need equally obvious
 * routes in.
 *
 * Rendered as links rather than client-side tabs so each filtered view keeps
 * a shareable, indexable URL.
 */
export function AxisBar({
  active,
  locale,
}: {
  active?: AxisKey;
  locale: AppLocale;
}) {
  return (
    <nav
      aria-label={locale === "id" ? "Cara menelusuri" : "Browse by"}
      className="mb-7 flex flex-wrap border border-line"
    >
      {AXIS_KEYS.map((key, i) => {
        const axis = AXES[key];
        const first = axis.terms[0];
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={localePath(`/ideas/${key}/${first.slug}`, locale)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-auto px-5 py-4 text-center font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors",
              i < AXIS_KEYS.length - 1 && "border-r border-line",
              isActive
                ? "bg-ink text-paper"
                : "bg-paper text-muted hover:text-ink",
            )}
          >
            {locale === "id" ? axis.id : axis.en}
          </Link>
        );
      })}
    </nav>
  );
}

/** Term chips within the active axis. */
export function TermChips({
  axis,
  activeSlug,
  locale,
}: {
  axis: AxisKey;
  activeSlug: string;
  locale: AppLocale;
}) {
  return (
    <div className="mb-9 flex flex-wrap gap-2">
      {AXES[axis].terms.map((term) => {
        const isActive = term.slug === activeSlug;
        return (
          <Link
            key={term.slug}
            href={localePath(`/ideas/${axis}/${term.slug}`, locale)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border px-4 py-2.5 text-xs font-semibold transition-colors",
              isActive
                ? "border-red bg-red text-paper"
                : "border-line bg-paper hover:border-ink",
            )}
          >
            {locale === "id" ? term.id : term.en}
          </Link>
        );
      })}
    </div>
  );
}
