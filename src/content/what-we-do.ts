/**
 * What We Do — capabilities, process, engagement workflows, and the
 * From Idea to Reality section (SRS §8.14, FR-14).
 */

/** The seven capabilities from the company profile. */
export const CAPABILITIES = [
  {
    en: "Strategy",
    id: "Strategi",
    descEn: "Understand the brand, audience, campaign objective, budget, quantity, timeline and intended impact.",
    descId: "Memahami merek, audiens, tujuan kampanye, anggaran, kuantitas, lini masa, dan dampak yang diinginkan.",
  },
  {
    en: "Ideation",
    id: "Ideasi",
    descEn: "Recommend merchandise concepts rather than sending catalogues. One brief can generate many directions.",
    descId: "Merekomendasikan konsep merchandise, bukan mengirim katalog. Satu brief bisa melahirkan banyak arah.",
  },
  {
    en: "Design",
    id: "Desain",
    descEn: "Product artwork, merchandise concepts, packaging, custom structures, gift sets, mockups and prototypes.",
    descId: "Artwork produk, konsep merchandise, kemasan, struktur kustom, set hadiah, mockup, dan prototipe.",
  },
  {
    en: "Sourcing",
    id: "Pengadaan",
    descEn: "Kadokowe ready stock, Indonesian production, China sourcing and custom factories.",
    descId: "Stok siap Kadokowe, produksi Indonesia, pengadaan Tiongkok, dan pabrik kustom.",
  },
  {
    en: "Production",
    id: "Produksi",
    descEn: "Coordination of both in-house customisation and external manufacturing.",
    descId: "Koordinasi kustomisasi in-house maupun manufaktur eksternal.",
  },
  {
    en: "Packaging",
    id: "Kemasan",
    descEn: "Treated as part of the merchandise concept and brand experience, not an afterthought.",
    descId: "Diperlakukan sebagai bagian dari konsep merchandise dan pengalaman merek, bukan pelengkap.",
  },
  {
    en: "Delivery",
    id: "Pengiriman",
    descEn: "End-to-end handling from idea through production to final delivery.",
    descId: "Penanganan menyeluruh dari ide hingga produksi dan pengiriman akhir.",
  },
] as const;

/**
 * The six execution stages — FR-14.2.
 *
 * These are NOT a competing process model. Discover → Evaluate → Recommend →
 * Craft → Deliver is the single process (decision V2); these six magnify its
 * last two stages. Craft covers Think, Design, Prototype and Make; Deliver
 * covers Check and Deliver. Presenting them as peers would leave a visitor
 * unsure which process Kadokowe actually follows.
 */
export const EXECUTION_STAGES = [
  {
    key: "think",
    parent: "Craft",
    en: "Think",
    id: "Pikirkan",
    leadEn: "It starts with why.",
    leadId: "Semuanya dimulai dari alasan.",
    bodyEn: "We understand the brand, audience, campaign, budget, quantity and deadline before deciding what to make.",
    bodyId: "Kami memahami merek, audiens, kampanye, anggaran, kuantitas, dan tenggat waktu sebelum menentukan apa yang dibuat.",
    shot: "Brief and brainstorming — sketches, product selection on the table",
  },
  {
    key: "design",
    parent: "Craft",
    en: "Design",
    id: "Desain",
    leadEn: "Turning possibilities into something you can see.",
    leadId: "Mengubah kemungkinan menjadi sesuatu yang terlihat.",
    bodyEn: "Product concepts, artwork, packaging and visual mockups are developed before production begins.",
    bodyId: "Konsep produk, artwork, kemasan, dan mockup visual dikembangkan sebelum produksi dimulai.",
    shot: "Design screen — artwork, mockup, packaging concept",
  },
  {
    key: "prototype",
    parent: "Craft",
    en: "Prototype",
    id: "Prototipe",
    leadEn: "Test before we scale.",
    leadId: "Uji sebelum diperbesar.",
    bodyEn: "Where required, samples and prototypes validate dimensions, materials, colours, branding and construction.",
    bodyId: "Bila diperlukan, sampel dan prototipe memvalidasi dimensi, material, warna, branding, dan konstruksi.",
    shot: "Physical sample and material comparison on the bench",
  },
  {
    key: "make",
    parent: "Craft",
    en: "Make",
    id: "Produksi",
    leadEn: "From one idea to thousands.",
    leadId: "Dari satu ide menjadi ribuan.",
    bodyEn: "In-house customisation combines with trusted production partners in Indonesia and China.",
    bodyId: "Kustomisasi in-house dipadukan dengan mitra produksi tepercaya di Indonesia dan Tiongkok.",
    shot: "Production — UV printing, DTF, engraving, cutting",
  },
  {
    key: "check",
    parent: "Deliver",
    en: "Check",
    id: "Periksa",
    leadEn: "Details matter.",
    leadId: "Detail itu penting.",
    bodyEn: "Production quality, branding, colour, packaging and finishing are checked before final delivery.",
    bodyId: "Kualitas produksi, branding, warna, kemasan, dan finishing diperiksa sebelum pengiriman akhir.",
    shot: "QC bench — inspection and packing",
  },
  {
    key: "deliver",
    parent: "Deliver",
    en: "Deliver",
    id: "Kirim",
    leadEn: "Ready to make an impact.",
    leadId: "Siap memberi dampak.",
    bodyEn: "Finished merchandise is packed and delivered to the project's requirements and timeline.",
    bodyId: "Merchandise jadi dikemas dan dikirim sesuai kebutuhan dan lini masa proyek.",
    shot: "Finished project — boxes, final merchandise, event usage",
  },
] as const;

/** The two engagement workflows from the company profile. */
export const WORKFLOWS = [
  {
    en: "Strategic Consultation & Development",
    id: "Konsultasi Strategis & Pengembangan",
    forEn: "For clients who are unclear, or open to solutions.",
    forId: "Untuk klien yang belum pasti, atau terbuka pada solusi.",
    steps: [
      { en: "Client Discovery", id: "Penemuan Klien", timeEn: "1–3 days", timeId: "1–3 hari" },
      { en: "Product Choice & Brand Consultation", id: "Pilihan Produk & Konsultasi Merek", timeEn: "3 days – 1 month", timeId: "3 hari – 1 bulan" },
      { en: "Custom Design & Development", id: "Desain & Pengembangan Kustom", timeEn: "3 days – 2 weeks", timeId: "3 hari – 2 minggu" },
      { en: "Production & Sourcing", id: "Produksi & Pengadaan", timeEn: "5 days – 60 days", timeId: "5 – 60 hari" },
    ],
  },
  {
    en: "Direct Production Workflow",
    id: "Alur Produksi Langsung",
    forEn: "For clients who already know exactly what they want.",
    forId: "Untuk klien yang sudah tahu persis apa yang diinginkan.",
    steps: [
      { en: "Product Choice & Quotation", id: "Pilihan Produk & Penawaran", timeEn: "", timeId: "" },
      { en: "Purchase Order & Mockup", id: "Pesanan & Mockup", timeEn: "", timeId: "" },
      { en: "Production & Delivery", id: "Produksi & Pengiriman", timeEn: "10 days – 3 weeks", timeId: "10 hari – 3 minggu" },
    ],
  },
] as const;
