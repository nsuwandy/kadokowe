import Link from "next/link";
import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export const PAGE_SIZE = 24;

/**
 * Listing pagination — FR-3.14.
 *
 * Links rather than a "load more" button, deliberately. A button loses the
 * position on back-navigation and produces one unshareable URL for every
 * scroll depth; page links stay indexable and let someone send a colleague
 * exactly what they were looking at. It also keeps the page cheap to render
 * as the catalogue grows toward the thousands the brief anticipates.
 */
export function Pagination({
  page,
  total,
  basePath,
  locale,
  extraParams = "",
}: {
  page: number;
  total: number;
  /** Already locale-prefixed. */
  basePath: string;
  locale: AppLocale;
  /** Any query to carry through, e.g. "q=bag". */
  extraParams?: string;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;

  const t = (en: string, id: string) => (locale === "id" ? id : en);
  const href = (p: number) => {
    const qs = [extraParams, p > 1 ? `page=${p}` : ""].filter(Boolean).join("&");
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Show first, last, current and its neighbours; elide the rest. A catalogue
  // of a thousand products is forty pages, and forty numbers is not navigation.
  const shown = new Set<number>([1, pages, page - 1, page, page + 1]);
  // An ellipsis standing in for a single page is wasted space and costs the
  // reader a click, so close any one-page gap rather than eliding it.
  for (const p of [...shown]) if (shown.has(p + 2)) shown.add(p + 1);
  const numbers = [...shown].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);

  const link =
    "inline-flex min-w-11 items-center justify-center border px-3 py-2.5 text-xs font-semibold tabular-nums transition-colors";

  return (
    <nav
      aria-label={t("Pagination", "Halaman")}
      className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-8"
    >
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={cn(link, "border-line hover:border-ink")}>
          ← {t("Previous", "Sebelumnya")}
        </Link>
      )}

      {numbers.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && numbers[i - 1] !== p - 1 && (
            <span className="px-1 text-xs text-muted" aria-hidden>
              …
            </span>
          )}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t(`Page ${p}`, `Halaman ${p}`)}
            className={cn(
              link,
              p === page
                ? "border-red bg-red text-paper"
                : "border-line hover:border-ink",
            )}
          >
            {p}
          </Link>
        </span>
      ))}

      {page < pages && (
        <Link href={href(page + 1)} rel="next" className={cn(link, "border-line hover:border-ink")}>
          {t("Next", "Berikutnya")} →
        </Link>
      )}
    </nav>
  );
}
