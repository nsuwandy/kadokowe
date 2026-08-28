"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  NAV,
  START_PROJECT,
  label,
  localePath,
  visibleChildren,
  type NavItem,
} from "@/lib/nav";
import { type AppLocale, otherLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function SiteHeader({
  locale,
  hasConcepts = false,
}: {
  locale: AppLocale;
  /** FR-13.6 — computed on the server. The concepts themselves must never
   *  reach the browser: unpublished ones are real client proposals. */
  hasConcepts?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Strip the locale prefix so the switcher stays on the current page.
  const bare = pathname.replace(/^\/id(?=\/|$)/, "") || "/";
  const other = otherLocale(locale);

  const isCurrent = (href: string) =>
    bare === href || bare.startsWith(`${href}/`);

  /**
   * Which submenu entry the visitor is actually on.
   *
   * Longest match wins, or /products/concepts would mark the Product Library as the
   * current page as well as itself — two items highlighted, one of them
   * wrong.
   */
  const currentChild = (children: NavItem[]) =>
    children.reduce<string | null>((best, child) => {
      if (!isCurrent(child.href)) return best;
      return best === null || child.href.length > best.length ? child.href : best;
    }, null);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-17 max-w-[1440px] items-center gap-4 px-gutter lg:gap-10">
        <Link
          href={localePath("/", locale)}
          className="-my-2 flex items-center py-2"
          aria-label="Kadokowe — home"
        >
          {/* The supplied lockup includes the tagline, which is illegible at
              header size and already set as live text on the homepage, so this
              is the wordmark alone. Served from /public rather than Cloudinary:
              it is on every page, never changes, and a round trip to a CDN for
              39KB costs more than it saves.

              width/height are declared so the header reserves the space before
              the image loads — otherwise the nav jumps as it arrives, which is
              the layout shift NFR-1.5 caps at 0.1. */}
          <Image
            src="/kadokowe-wordmark.png"
            alt="Kadokowe"
            width={600}
            height={121}
            priority
            className="h-7 w-auto sm:h-8"
          />
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
            ) : visibleChildren(item, { hasConcepts }).length > 1 ? (
              <NavMenu
                key={item.href}
                item={item}
                entries={visibleChildren(item, { hasConcepts })}
                locale={locale}
                current={isCurrent(item.href)}
                currentChild={currentChild(visibleChildren(item, { hasConcepts }))}
              />
            ) : (
              <Link
                key={item.href}
                href={localePath(item.href, locale)}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={cn(NAV_LINK)}
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
            className="-mr-2 flex size-11 items-center justify-center"
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
                  <>
                    {/* Hover does not exist here, so the submenu is simply
                        laid open. A disclosure to tap would hide the section
                        behind a second gesture for no gain — there are two
                        entries. */}
                    <Link
                      href={localePath(item.href, locale)}
                      onClick={() => setOpen(false)}
                      className="block py-3 font-display text-sm font-semibold uppercase tracking-[0.1em]"
                    >
                      {label(item, locale)}
                    </Link>
                    {visibleChildren(item, { hasConcepts }).length > 1 && (
                      <ul className="mb-2 ml-4 flex flex-col border-l border-line">
                        {visibleChildren(item, { hasConcepts }).map((child) => (
                          <li key={child.href}>
                            <Link
                              href={localePath(child.href, locale)}
                              onClick={() => setOpen(false)}
                              aria-current={
                                currentChild(visibleChildren(item, { hasConcepts })) ===
                                child.href
                                  ? "page"
                                  : undefined
                              }
                              className="block py-2.5 pl-4 text-sm text-muted aria-[current=page]:font-semibold aria-[current=page]:text-red"
                            >
                              {label(child, locale)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
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

const NAV_LINK = cn(
  "relative py-1 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.13em] whitespace-nowrap",
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-red after:transition-transform after:duration-200",
  "hover:after:scale-x-100 aria-[current=page]:after:scale-x-100",
);

/**
 * A top-level item that opens a submenu.
 *
 * Opening is bound to hover *and* to keyboard focus, and the parent remains a
 * working link. Hover alone would put Concept Collections behind a gesture
 * that does not exist on a keyboard, which is the same unreachability the
 * menu is here to fix.
 *
 * Closing is delayed by a moment. The menu sits below the header rather than
 * flush against the item, and a mouse crossing that gap at an angle would
 * otherwise dismiss the thing it is travelling towards.
 */
function NavMenu({
  item,
  entries,
  locale,
  current,
  currentChild,
}: {
  item: NavItem;
  entries: NavItem[];
  locale: AppLocale;
  current: boolean;
  currentChild: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const show = () => {
    cancelClose();
    setOpen(true);
  };

  const hide = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => cancelClose, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex self-stretch items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        // Only close when focus has actually left the whole group, or tabbing
        // from the trigger into the first entry would shut it.
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) {
          cancelClose();
          setOpen(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        cancelClose();
        setOpen(false);
        triggerRef.current?.focus();
      }}
    >
      <Link
        ref={triggerRef}
        href={localePath(item.href, locale)}
        aria-current={current ? "page" : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(NAV_LINK, "flex items-center gap-1")}
      >
        {label(item, locale)}
        <ChevronDown
          size={12}
          aria-hidden
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </Link>

      {open && (
        /* The padding is inside the panel wrapper rather than a margin on it,
           so the gap below the header is still part of the hover target. */
        <div className="absolute left-0 top-full z-50 pt-px">
          <ul className="min-w-[15rem] border border-line border-t-0 bg-paper py-1 shadow-lg">
            {entries.map((child) => (
              <li key={child.href}>
                <Link
                  href={localePath(child.href, locale)}
                  onClick={() => {
                    cancelClose();
                    setOpen(false);
                  }}
                  aria-current={currentChild === child.href ? "page" : undefined}
                  className="block px-5 py-3 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.11em] whitespace-nowrap transition-colors hover:bg-warm hover:text-red aria-[current=page]:text-red"
                >
                  {label(child, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
      {/* Routed through /api/locale rather than linked straight to the other
          language: the switch has to rewrite the stored preference, or a
          visitor holding NEXT_LOCALE=id is redirected back to Indonesian the
          moment they follow an unprefixed English link (FR-11.9). A plain <a>
          because this is a server round-trip that sets a cookie, not a
          client-side route change. */}
      <a
        href={`/api/locale?to=en&next=${encodeURIComponent(bare)}`}
        hrefLang="en"
        aria-current={locale === "en" ? "true" : undefined}
        className={cn(
          "px-2.5 py-2",
          locale === "en" ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        EN
      </a>
      <a
        href={`/api/locale?to=id&next=${encodeURIComponent(bare)}`}
        hrefLang="id"
        aria-current={locale === "id" ? "true" : undefined}
        className={cn(
          "px-2.5 py-2",
          locale === "id" ? "bg-ink text-paper" : "text-muted hover:text-ink",
        )}
      >
        ID
      </a>
      <span className="sr-only">
        {locale === "en" ? "Switch to Bahasa Indonesia" : "Switch to English"}
        {other}
      </span>
    </div>
  );
}
