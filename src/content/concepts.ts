/**
 * Concept Collections — SRS §8.13, FR-13.
 *
 * Code-managed with no administrative interface (FR-13.7, decision V8), so
 * this file is the source of record. Adding a collection is a developer task.
 *
 * SAFETY NOTE — read before adding anything here.
 *
 * These are real client proposals. The ANONYMIZED visibility state was
 * dropped at the client's direction (decision V4), which means nothing in the
 * system strips client identity automatically. `published: false` is the only
 * safeguard, and it is the default.
 *
 * Before setting `published: true` on any collection:
 *   1. Confirm Kadokowe has permission to show this work publicly.
 *   2. Remove client-identifying detail from the copy by hand if the
 *      permission is partial.
 * There is no automatic mode that will do either of these for you.
 */

export type Concept = {
  slug: string;
  titleEn: string;
  titleId: string;
  themeEn?: string;
  themeId?: string;
  /** The brief or opportunity this explored. */
  briefEn?: string;
  briefId?: string;
  /** The creative direction taken. */
  directionEn?: string;
  directionId?: string;
  /** Shot list while photography is pending. */
  shots?: string[];
  /** Cloudinary public ID for the hero, once photography exists. Code-managed
   *  like the rest of this file (FR-13.7); also used as the share image. */
  heroImage?: string;
  /** Slugs of related products in the Product Library. */
  products?: string[];
  /** Slug of the Our Work project this became, if it was produced. */
  project?: string;
  /** FR-13.4 — defaults to unpublished. Never flip this casually. */
  published: boolean;
};

export const CONCEPTS: Concept[] = [
  {
    slug: "anniversary-gifting",
    titleEn: "Anniversary Gifting",
    titleId: "Hadiah Ulang Tahun Perusahaan",
    themeEn: "A collection of merchandise concepts developed around a brand milestone.",
    themeId: "Kumpulan konsep merchandise yang dikembangkan seputar tonggak perjalanan merek.",
    briefEn:
      "A company reaching a milestone year wants something staff and long-standing clients will keep. The budget is mid-range, the audience is mixed, and the anniversary logo is the only fixed element.",
    briefId:
      "Sebuah perusahaan yang mencapai tahun penting ingin sesuatu yang akan disimpan karyawan dan klien lama. Anggaran menengah, audiens beragam, dan logo ulang tahun adalah satu-satunya elemen tetap.",
    directionEn:
      "We treated the anniversary mark as a pattern rather than a badge. Applied at scale across a small family of objects, it reads as a considered set instead of a logo stamped on unrelated items — and lets one artwork carry the whole collection.",
    directionId:
      "Kami memperlakukan tanda ulang tahun sebagai pola, bukan lencana. Diterapkan dalam skala besar pada sekelompok kecil benda, ia terbaca sebagai set yang dipikirkan matang, bukan logo yang dicap pada barang-barang tak berhubungan.",
    shots: [
      "Anniversary pattern applied across a gift set",
      "Pattern development sheets",
      "Packaging concept with milestone mark",
    ],
    products: ["bamboo-desk-set", "qr-smart-gift-box", "3-in-1-ballpoint"],
    published: true,
  },
  {
    slug: "rush-event-toolkit",
    titleEn: "Rush Event Toolkit",
    titleId: "Perangkat Acara Kilat",
    themeEn: "What a credible event kit looks like when there are ten days, not ten weeks.",
    themeId: "Seperti apa kit acara yang meyakinkan ketika waktunya sepuluh hari, bukan sepuluh minggu.",
    briefEn:
      "An event confirmed at short notice still needs merchandise that does not look like it was chosen at short notice.",
    briefId:
      "Acara yang dikonfirmasi mendadak tetap membutuhkan merchandise yang tidak terlihat dipilih secara mendadak.",
    directionEn:
      "Built entirely from warehouse-held stock, with the design effort moved into print and packaging where turnaround is fastest. The constraint shapes the concept rather than degrading it.",
    directionId:
      "Dibangun sepenuhnya dari stok gudang, dengan upaya desain dialihkan ke cetakan dan kemasan yang waktu pengerjaannya paling cepat. Kendala membentuk konsepnya, bukan menurunkannya.",
    shots: [
      "Ready-stock items assembled as a coherent event kit",
      "Print-led differentiation on standard blanks",
    ],
    products: ["printed-event-tote", "3-in-1-ballpoint", "portable-kettle"],
    published: true,
  },
];

export function conceptBySlug(slug: string) {
  return CONCEPTS.find((c) => c.slug === slug && c.published);
}

export function publishedConcepts() {
  return CONCEPTS.filter((c) => c.published);
}
