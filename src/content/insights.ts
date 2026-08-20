import type { AppLocale } from "@/lib/i18n";

/**
 * Insights categories — FR-8.1.
 *
 * Four, not the six an earlier revision carried. The set is strategy-led
 * rather than format-led, which is what makes the section build authority as
 * a consultant rather than read as a company blog (SRS §8.8).
 */
export const CATEGORIES = [
  {
    key: "GIFTING_STRATEGY",
    slug: "gifting-strategy",
    en: "Gifting Strategy",
    id: "Strategi Hadiah",
    descEn: "How to plan better corporate gifts and merchandise.",
    descId: "Cara merencanakan hadiah korporat dan merchandise yang lebih baik.",
  },
  {
    key: "IDEAS_TRENDS",
    slug: "ideas-trends",
    en: "Ideas & Trends",
    id: "Ide & Tren",
    descEn: "Emerging products, materials and merchandise behaviour.",
    descId: "Produk, material, dan perilaku merchandise yang sedang berkembang.",
  },
  {
    key: "PACKAGING_DESIGN",
    slug: "packaging-design",
    en: "Packaging & Design",
    id: "Kemasan & Desain",
    descEn: "How presentation changes perceived value.",
    descId: "Bagaimana presentasi mengubah nilai yang dirasakan.",
  },
  {
    key: "BEHIND_THE_MAKING",
    slug: "behind-the-making",
    en: "Behind the Making",
    id: "Di Balik Pembuatan",
    descEn: "Production processes, prototypes and development stories.",
    descId: "Proses produksi, prototipe, dan cerita pengembangan.",
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryByKey(key: string) {
  return CATEGORIES.find((c) => c.key === key);
}

export function categoryLabel(key: string, locale: AppLocale) {
  const c = categoryByKey(key);
  if (!c) return "";
  return locale === "id" ? c.id : c.en;
}
