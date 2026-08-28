import type { AppLocale } from "./i18n";

/**
 * Primary navigation — SRS v1.4 §6.1.
 *
 * Eight items is the confirmed ceiling (decision V5). Custom Made was the one
 * new top-level area the revision brief allowed; nothing further should be
 * added here without removing something.
 */
export type NavItem = {
  href: string;
  en: string;
  id: string;
  /** Present in the design from Phase 1a, inactive until Phase 3 (FR-1.8). */
  disabled?: boolean;
  /**
   * A submenu under this item. The parent stays a link in its own right —
   * the menu names the destinations, it does not replace the top-level one.
   */
  children?: NavItem[];
  /**
   * Only offered when the named condition holds. FR-13.6: a link to Concept
   * Collections with nothing published leads to an empty page, so the header
   * is told whether any collection is live rather than assuming one is.
   */
  gate?: "concepts";
};

export const NAV: NavItem[] = [
  { href: "/what-we-do", en: "What We Do", id: "Apa Yang Kami Lakukan" },
  {
    href: "/ideas",
    en: "Ideas",
    id: "Ide",
    // Concept Collections had no route into it from the header at all: the
    // only way in was a link inside the Ideas section of the homepage, which
    // meant the section was effectively unreachable to anyone who scrolled
    // past it. SRS §8.13 places it between the Idea Library and Our Work as
    // one of the three ways of looking at the work, so it belongs here.
    children: [
      { href: "/ideas", en: "Idea Library", id: "Pustaka Ide" },
      {
        href: "/ideas/concepts",
        en: "Concept Collections",
        id: "Koleksi Konsep",
        gate: "concepts",
      },
    ],
  },
  { href: "/custom-made", en: "Custom Made", id: "Dibuat Khusus" },
  { href: "/our-work", en: "Our Work", id: "Karya Kami" },
  { href: "/insights", en: "Insights", id: "Wawasan" },
  { href: "/about", en: "About", id: "Tentang" },
  { href: "/login", en: "Client Login", id: "Masuk Klien", disabled: true },
];

export const START_PROJECT = {
  href: "/start-a-project",
  en: "Start a Project",
  id: "Mulai Proyek",
};

export function label(item: { en: string; id: string }, locale: AppLocale) {
  return locale === "id" ? item.id : item.en;
}

/** The submenu for an item, with anything not currently available removed. */
export function visibleChildren(
  item: NavItem,
  conditions: { hasConcepts: boolean },
): NavItem[] {
  return (item.children ?? []).filter(
    (child) => child.gate !== "concepts" || conditions.hasConcepts,
  );
}

/** Prefix a path with the locale segment. English is served unprefixed. */
export function localePath(href: string, locale: AppLocale) {
  return locale === "en" ? href : `/id${href}`;
}
