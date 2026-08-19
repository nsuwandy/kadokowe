import { defineRouting } from "next-intl/routing";

/**
 * Locale routing — SRS v1.4 FR-11.2, FR-11.5.
 *
 * `as-needed` keeps English on unprefixed paths (/ideas) and puts Indonesian
 * behind /id (/id/ideas). Each language therefore has a distinct, indexable
 * URL as FR-11.5 requires, without burdening the default language with a
 * redundant segment.
 *
 * Scope note: next-intl is used here for routing only — locale negotiation,
 * prefix handling and cookie persistence, which are easy to get subtly wrong
 * by hand. Content translation is not done with message catalogues: product,
 * project and article copy lives in paired database columns and is resolved
 * by src/lib/i18n. Interface chrome is small enough to stay colocated with
 * its components. Maintaining a parallel message catalogue for a few dozen
 * chrome strings would add a moving part without removing one.
 */
export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});
