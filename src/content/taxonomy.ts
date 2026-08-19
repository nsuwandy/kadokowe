/**
 * The four browse axes — SRS FR-3.1 to FR-3.4.
 *
 * These are the seed values. FR-3.13 requires the taxonomies be
 * administrator-managed rather than hard-coded, so at runtime terms are read
 * from the database; this file is the source for seeding and for the static
 * route params that pre-render the filtered views.
 *
 * FR-3.6 requires all four axes be presented as equally prominent entry
 * points. That is the structural expression of the dual-visitor principle
 * (§3.3): a visitor who knows they want a tumbler and a visitor who only
 * knows they have an exhibition must both find a way in.
 */

export type AxisKey = "product" | "purpose" | "industry" | "budget";

export type Term = { slug: string; en: string; id: string };

export const AXES: Record<
  AxisKey,
  { en: string; id: string; terms: readonly Term[] }
> = {
  product: {
    en: "By Product",
    id: "Berdasarkan Produk",
    terms: [
      { slug: "drinkware", en: "Drinkware", id: "Peralatan Minum" },
      { slug: "bags-carry", en: "Bags & Carry", id: "Tas & Bawaan" },
      { slug: "office-stationery", en: "Office & Stationery", id: "Kantor & Alat Tulis" },
      { slug: "technology", en: "Technology", id: "Teknologi" },
      { slug: "lifestyle", en: "Lifestyle", id: "Gaya Hidup" },
      { slug: "f-and-b", en: "F&B", id: "F&B" },
      { slug: "travel", en: "Travel", id: "Perjalanan" },
      { slug: "apparel", en: "Apparel", id: "Pakaian" },
      { slug: "event-merchandise", en: "Event Merchandise", id: "Merchandise Acara" },
      { slug: "premium-gifts", en: "Premium Gifts", id: "Hadiah Premium" },
      { slug: "eco-merchandise", en: "Eco Merchandise", id: "Merchandise Ramah Lingkungan" },
      { slug: "packaging", en: "Packaging", id: "Kemasan" },
    ],
  },
  purpose: {
    en: "By Purpose",
    id: "Berdasarkan Tujuan",
    terms: [
      { slug: "corporate-gifts", en: "Corporate Gifts", id: "Hadiah Korporat" },
      { slug: "employee-welcome-kits", en: "Employee Welcome Kits", id: "Kit Sambutan Karyawan" },
      { slug: "product-launch", en: "Product Launch", id: "Peluncuran Produk" },
      { slug: "anniversary", en: "Anniversary", id: "Ulang Tahun" },
      { slug: "conference", en: "Conference", id: "Konferensi" },
      { slug: "exhibition", en: "Exhibition", id: "Pameran" },
      { slug: "influencer-pr-kit", en: "Influencer / PR Kit", id: "Kit Influencer / PR" },
      { slug: "customer-loyalty", en: "Customer Loyalty", id: "Loyalitas Pelanggan" },
      { slug: "gift-with-purchase", en: "Gift With Purchase", id: "Hadiah Pembelian" },
      { slug: "vip-gifts", en: "VIP Gifts", id: "Hadiah VIP" },
      { slug: "mass-giveaway", en: "Mass Giveaway", id: "Giveaway Massal" },
      { slug: "rush-event", en: "Rush Event", id: "Acara Kilat" },
    ],
  },
  industry: {
    en: "By Industry",
    id: "Berdasarkan Industri",
    terms: [
      { slug: "automotive", en: "Automotive", id: "Otomotif" },
      { slug: "banking-finance", en: "Banking & Finance", id: "Perbankan & Keuangan" },
      { slug: "jewellery", en: "Jewellery", id: "Perhiasan" },
      { slug: "retail", en: "Retail", id: "Ritel" },
      { slug: "property", en: "Property", id: "Properti" },
      { slug: "f-and-b-industry", en: "F&B", id: "F&B" },
      { slug: "technology-industry", en: "Technology", id: "Teknologi" },
      { slug: "education", en: "Education", id: "Pendidikan" },
      { slug: "hospitality", en: "Hospitality", id: "Perhotelan" },
      { slug: "beauty", en: "Beauty", id: "Kecantikan" },
      { slug: "events", en: "Events", id: "Acara" },
    ],
  },
  budget: {
    en: "By Budget",
    id: "Berdasarkan Anggaran",
    terms: [
      { slug: "under-25k", en: "Under Rp25K", id: "Di bawah Rp25rb" },
      { slug: "25-50k", en: "Rp25–50K", id: "Rp25–50rb" },
      { slug: "50-100k", en: "Rp50–100K", id: "Rp50–100rb" },
      { slug: "100-250k", en: "Rp100–250K", id: "Rp100–250rb" },
      { slug: "250-500k", en: "Rp250–500K", id: "Rp250–500rb" },
      { slug: "500k-plus", en: "Rp500K+", id: "Rp500rb+" },
    ],
  },
} as const;

export const AXIS_KEYS = Object.keys(AXES) as AxisKey[];

export function isAxisKey(v: string): v is AxisKey {
  return AXIS_KEYS.includes(v as AxisKey);
}

/**
 * Budget tiers in rupiah, used to derive a product's tier from its indicative
 * price so a thousand products need not be tagged by hand.
 */
export const BUDGET_BOUNDS: Record<string, [number, number]> = {
  "under-25k": [0, 24_999],
  "25-50k": [25_000, 49_999],
  "50-100k": [50_000, 99_999],
  "100-250k": [100_000, 249_999],
  "250-500k": [250_000, 499_999],
  "500k-plus": [500_000, Number.MAX_SAFE_INTEGER],
};

export function budgetTierFor(price: number): string | null {
  for (const [slug, [lo, hi]] of Object.entries(BUDGET_BOUNDS)) {
    if (price >= lo && price <= hi) return slug;
  }
  return null;
}
