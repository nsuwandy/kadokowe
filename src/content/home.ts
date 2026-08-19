/**
 * Fixed homepage content — the structural copy that belongs to the design
 * rather than to the catalogue. Product, project and article content comes
 * from the database; these are the labels the layout is built around.
 */

/** FR-2.3 — the six outcome cards. Each links to a purpose-filtered view. */
export const OUTCOMES = [
  {
    slug: "vip-gifts",
    titleEn: "Make an Impression",
    titleId: "Beri Kesan",
    subEn: "Premium & VIP gifting",
    subId: "Hadiah premium & VIP",
    shot: "Premium gift set, styled",
  },
  {
    slug: "influencer-pr-kit",
    titleEn: "Create Buzz",
    titleId: "Ciptakan Perbincangan",
    subEn: "Launch & influencer kits",
    subId: "Kit peluncuran & influencer",
    shot: "Influencer PR kit, unboxed",
  },
  {
    slug: "conference",
    titleEn: "Be Remembered",
    titleId: "Selalu Diingat",
    subEn: "Events & campaign merchandise",
    subId: "Merchandise acara & kampanye",
    shot: "Branded merchandise in use at an event",
  },
  {
    slug: "rush-event",
    titleEn: "Move Fast",
    titleId: "Bergerak Cepat",
    subEn: "Rush orders from ready stock",
    subId: "Pesanan kilat dari stok siap",
    shot: "Warehouse ready-stock shelving",
  },
  {
    slug: "mass-giveaway",
    titleEn: "Stay on Budget",
    titleId: "Sesuai Anggaran",
    subEn: "Smart merchandise solutions",
    subId: "Solusi merchandise cerdas",
    shot: "High-volume giveaway run",
  },
  {
    slug: "product-launch",
    titleEn: "Create Something New",
    titleId: "Ciptakan Sesuatu Yang Baru",
    subEn: "Custom product development",
    subId: "Pengembangan produk kustom",
    shot: "3D prototype and mockup on the bench",
  },
] as const;

/**
 * The single process model — SRS decision V2. Discover → Evaluate →
 * Recommend → Craft → Deliver. The six execution stages shown on What We Do
 * are chapters within Craft and Deliver, not a competing model (FR-14.2).
 */
export const PROCESS = [
  {
    en: "Discover",
    id: "Temukan",
    descEn: "Understand the brief, the campaign and the audience.",
    descId: "Memahami brief, kampanye, dan audiens.",
  },
  {
    en: "Evaluate",
    id: "Evaluasi",
    descEn: "Analyse brand, budget, quantity and timeline.",
    descId: "Menganalisis merek, anggaran, kuantitas, dan lini masa.",
  },
  {
    en: "Recommend",
    id: "Rekomendasikan",
    descEn: "Put forward tailored concepts, not a catalogue.",
    descId: "Mengajukan konsep khusus, bukan katalog.",
  },
  {
    en: "Craft",
    id: "Wujudkan",
    descEn: "Design, prototype, and refine with you.",
    descId: "Merancang, membuat prototipe, dan menyempurnakan bersama Anda.",
  },
  {
    en: "Deliver",
    id: "Kirimkan",
    descEn: "Produce and ship on time, at any scale.",
    descId: "Memproduksi dan mengirim tepat waktu, pada skala apa pun.",
  },
] as const;

/**
 * FR-3.1 — twelve product categories. "Custom Products" was removed because
 * it duplicated what the Custom Made section now covers in full (SRS §8.3).
 * Counts are placeholders until the catalogue is seeded.
 */
export const PRODUCT_CATEGORIES = [
  { slug: "drinkware", en: "Drinkware", id: "Peralatan Minum", count: 0 },
  { slug: "bags-carry", en: "Bags & Carry", id: "Tas & Bawaan", count: 0 },
  {
    slug: "office-stationery",
    en: "Office & Stationery",
    id: "Kantor & Alat Tulis",
    count: 0,
  },
  { slug: "technology", en: "Technology", id: "Teknologi", count: 0 },
  { slug: "lifestyle", en: "Lifestyle", id: "Gaya Hidup", count: 0 },
  { slug: "f-and-b", en: "F&B", id: "F&B", count: 0 },
  { slug: "travel", en: "Travel", id: "Perjalanan", count: 0 },
  { slug: "apparel", en: "Apparel", id: "Pakaian", count: 0 },
  {
    slug: "event-merchandise",
    en: "Event Merchandise",
    id: "Merchandise Acara",
    count: 0,
  },
  { slug: "premium-gifts", en: "Premium Gifts", id: "Hadiah Premium", count: 0 },
  {
    slug: "eco-merchandise",
    en: "Eco Merchandise",
    id: "Merchandise Ramah Lingkungan",
    count: 0,
  },
  { slug: "packaging", en: "Packaging", id: "Kemasan", count: 0 },
] as const;
