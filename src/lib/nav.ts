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
};

export const NAV: NavItem[] = [
  { href: "/what-we-do", en: "What We Do", id: "Apa Yang Kami Lakukan" },
  { href: "/ideas", en: "Ideas", id: "Ide" },
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

/** Prefix a path with the locale segment. English is served unprefixed. */
export function localePath(href: string, locale: AppLocale) {
  return locale === "en" ? href : `/id${href}`;
}
