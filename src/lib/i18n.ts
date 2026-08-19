/**
 * Bilingual resolution — SRS v1.4 §8.11.
 *
 * English is the default language and Indonesian the fallback: where an
 * Indonesian value is missing, English is served in its place (FR-11.6).
 *
 * FR-11.6 matters more than it first appears. With a catalogue growing toward
 * a thousand products maintained by a single administrator, partial
 * translation is the normal steady state rather than an edge case — a product
 * added in a hurry will often exist in one language only. Fallback is
 * therefore designed in here, not handled as an error at the call site.
 */

export const LOCALES = ["en", "id"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export function isLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Shape of a record carrying paired translatable columns. */
type Paired<K extends string> = Partial<
  Record<`${K}En` | `${K}Id`, string | null | undefined>
>;

/**
 * Resolve one translatable field, falling back to English.
 *
 * `pick(product, "name", locale)` reads `nameId` for Indonesian and drops to
 * `nameEn` when it is absent or blank. Blank is treated as missing: an empty
 * string in the database is far more often an untranslated row than a
 * deliberate empty value, and rendering nothing is the worse failure.
 */
export function pick<K extends string>(
  record: Paired<K>,
  field: K,
  locale: AppLocale,
): string {
  const localised =
    locale === "id"
      ? (record as Record<string, string | null | undefined>)[`${field}Id`]
      : undefined;

  if (localised && localised.trim() !== "") return localised;

  const fallback = (record as Record<string, string | null | undefined>)[
    `${field}En`
  ];
  return fallback?.trim() ? fallback : "";
}

/**
 * Resolve a translatable field that may legitimately be absent in both
 * languages — an optional narrative section, for example. Returns null rather
 * than an empty string so callers can decide not to render the block at all,
 * which is what FR-7.2 and FR-13.3 require.
 */
export function pickOptional<K extends string>(
  record: Paired<K>,
  field: K,
  locale: AppLocale,
): string | null {
  const value = pick(record, field, locale);
  return value === "" ? null : value;
}

/** Resolve a paired string array, e.g. tagsEn / tagsId. */
export function pickArray<K extends string>(
  record: Partial<Record<`${K}En` | `${K}Id`, string[] | null | undefined>>,
  field: K,
  locale: AppLocale,
): string[] {
  const source = record as Record<string, string[] | null | undefined>;
  const localised = locale === "id" ? source[`${field}Id`] : undefined;
  if (localised && localised.length > 0) return localised;
  return source[`${field}En`] ?? [];
}

/** The `lang` attribute value for a locale. */
export function htmlLang(locale: AppLocale): string {
  return locale === "id" ? "id" : "en";
}

/** The opposite locale, for the language switcher. */
export function otherLocale(locale: AppLocale): AppLocale {
  return locale === "en" ? "id" : "en";
}
