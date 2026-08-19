"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, START_PROJECT, label, localePath } from "@/lib/nav";
import { type AppLocale, otherLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function SiteHeader({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Strip the locale prefix so the switcher stays on the current page.
  const bare = pathname.replace(/^\/id(?=\/|$)/, "") || "/";
  const other = otherLocale(locale);

  const isCurrent = (href: string) =>
    bare === href || bare.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-17 max-w-[1440px] items-center gap-4 px-gutter lg:gap-10">
        <Link
          href={localePath("/", locale)}
          className="font-display text-[1.0625rem] font-bold tracking-[0.14em] whitespace-nowrap"
          aria-label="Kadokowe — home"
        >
          KADO<span className="text-red">KOWE</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-5 lg:flex xl:gap-7">
          {NAV.map((item) =>
            item.disabled ? (
              <span
                key={item.href}
                aria-disabled="true"
                title="Available with the client portal"
                className="cursor-not-allowed font-display text-[0.6875rem] font-semibold uppercase tracking-[0.13em] whitespace-nowrap text-muted/60"
              >
                {label(item, locale)}
              </span>
            ) : (
              <Link
                key={item.href}
                href={localePath(item.href, locale)}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={cn(
                  "relative py-1 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.13em] whitespace-nowrap",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-red after:transition-transform after:duration-200",
                  "hover:after:scale-x-100 aria-[current=page]:after:scale-x-100",
                )}
              >
                {label(item, locale)}
              </Link>
            ),
          )}

          <LocaleSwitch locale={locale} other={other} bare={bare} />

          <Link
            href={localePath(START_PROJECT.href, locale)}
            className="bg-red px-5 py-3 font-display text-[0.6875rem] font-bold uppercase tracking-[0.11em] whitespace-nowrap text-paper transition-colors hover:bg-ink"
          >
            {label(START_PROJECT, locale)}
          </Link>
        </nav>

        {/* Mobile: the enquiry action stays reachable at all times (FR-1.3). */}
        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <Link
            href={localePath(START_PROJECT.href, locale)}
            className="bg-red px-4 py-2.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.1em] whitespace-nowrap text-paper"
          >
            {locale === "id" ? "Mulai" : "Start"}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="p-1"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-line bg-paper px-gutter py-6 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                {item.disabled ? (
                  <span className="block py-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-muted/60">
                    {label(item, locale)}
                  </span>
                ) : (
                  <Link
                    href={localePath(item.href, locale)}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-display text-sm font-semibold uppercase tracking-[0.1em]"
                  >
                    {label(item, locale)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-line pt-4">
            <LocaleSwitch locale={locale} other={other} bare={bare} />
          </div>
        </nav>
      )}
    </header>
  );
}

function LocaleSwitch({
  locale,
  other,
  bare,
}: {
  locale: AppLocale;
  other: AppLocale;
  bare: string;
}) {
  return (
    <div
      className="flex border border-line text-[0.625rem] font-bold tracking-[0.08em]"
      role="group"
      aria-label="Language"
    >
      <Link
        href={localePath(bare, "en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={cn(
          "px-2.5 py-2",
          locale === "en" ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        EN
      </Link>
      <Link
        href={localePath(bare, "id")}
        aria-current={locale === "id" ? "true" : undefined}
        className={cn(
          "px-2.5 py-2",
          locale === "id" ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        ID
      </Link>
      <span className="sr-only">
        {locale === "en" ? "Switch to Bahasa Indonesia" : "Switch to English"}
        {other}
      </span>
    </div>
  );
}
