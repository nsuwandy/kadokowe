/**
 * Development seed.
 *
 * Content is drawn from the Kadokowe company profile (2025 v1.0) — the five
 * documented case studies are real, as are the product families. Product copy
 * here is representative sample data for development; the launch catalogue of
 * 150–250 products is written by the client and loaded through bulk import
 * (FR-10.11).
 *
 * Run with: npm run db:seed
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { AXES, budgetTierFor } from "../src/content/taxonomy";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type SeedProduct = {
  slug: string;
  nameEn: string;
  nameId: string;
  shortEn: string;
  shortId: string;
  whyEn: string;
  whyId: string;
  material?: string;
  capacity?: string;
  colours?: string[];
  moq?: number;
  leadTime?: string;
  customisation?: string[];
  availability: Prisma.ProductCreateInput["availability"];
  price?: number;
  tagsEn: string[];
  tagsId: string[];
  terms: string[];
  featured?: boolean;
  isNew?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: "portable-electric-cooking-pot",
    nameEn: "Portable Electric Cooking Pot",
    nameId: "Panci Masak Elektrik Portabel",
    shortEn: "A surprisingly useful alternative to another tumbler.",
    shortId: "Alternatif yang jauh lebih berguna daripada tumbler lagi.",
    whyEn:
      "Every third brief we receive asks for tumblers. This costs about the same, gets used at a desk every single day, and is the kind of object someone photographs when it arrives. It reads as considered rather than obligatory — which is exactly what a welcome kit is supposed to do.",
    whyId:
      "Setiap sepertiga brief yang kami terima meminta tumbler. Ini berbiaya hampir sama, dipakai di meja setiap hari, dan termasuk benda yang difoto orang saat menerimanya. Terasa dipikirkan matang, bukan sekadar formalitas — persis seperti yang seharusnya dilakukan sebuah welcome kit.",
    material: "Stainless steel, food-grade PP",
    capacity: "1.2 L",
    colours: ["White", "Black", "Sage", "Cream"],
    moq: 100,
    leadTime: "14–21 days (local customisation)",
    customisation: ["Logo printing", "UV", "Laser engraving", "Custom colour", "Gift box"],
    availability: "IMPORT_SOURCING",
    price: 185_000,
    tagsEn: ["F&B", "Employee Gift", "Lifestyle"],
    tagsId: ["F&B", "Hadiah Karyawan", "Gaya Hidup"],
    terms: ["f-and-b", "employee-welcome-kits", "lifestyle"],
    featured: true,
  },
  {
    slug: "foldable-shopping-bag",
    nameEn: "Foldable Shopping Bag",
    nameId: "Tas Belanja Lipat",
    shortEn: "The bag that outlived the event by a year.",
    shortId: "Tas yang bertahan setahun setelah acaranya usai.",
    whyEn:
      "Printed edge to edge, this stops being merchandise and becomes a moving billboard. It folds into a pocket, so people actually carry it — which is the whole difference between a giveaway that works and one that goes in a drawer.",
    whyId:
      "Dicetak penuh dari tepi ke tepi, ini berhenti menjadi merchandise dan menjadi papan iklan berjalan. Dapat dilipat masuk saku, sehingga orang benar-benar membawanya — dan itulah bedanya giveaway yang berhasil dengan yang berakhir di laci.",
    material: "190T polyester",
    moq: 500,
    leadTime: "10–14 days",
    customisation: ["Full-surface print", "Logo printing", "Custom colour"],
    availability: "LOCAL_PRODUCTION",
    price: 15_000,
    tagsEn: ["Events", "Mass Giveaway", "Retail"],
    tagsId: ["Acara", "Giveaway Massal", "Ritel"],
    terms: ["bags-carry", "mass-giveaway", "events"],
    featured: true,
  },
  {
    slug: "3-in-1-ballpoint",
    nameEn: "3-in-1 Ballpoint",
    nameId: "Pulpen 3-in-1",
    shortEn: "One object, three reasons to keep it.",
    shortId: "Satu benda, tiga alasan untuk menyimpannya.",
    whyEn:
      "Pen, stylus and phone stand in one body. Multifunction is what stops a giveaway pen being the first thing cleared off a desk — and laser engraving in-house means we can turn these around fast.",
    whyId:
      "Pulpen, stylus, dan penyangga ponsel dalam satu bodi. Multifungsi adalah yang membuat pulpen giveaway tidak menjadi benda pertama yang disingkirkan dari meja — dan gravir laser di tempat kami berarti kami bisa mengerjakannya dengan cepat.",
    material: "Aluminium, ABS",
    moq: 300,
    leadTime: "5–7 days from ready stock",
    customisation: ["Laser engraving", "UV", "Logo printing"],
    availability: "READY_STOCK",
    price: 28_000,
    tagsEn: ["Corporate Gifts", "Conference", "Automotive"],
    tagsId: ["Hadiah Korporat", "Konferensi", "Otomotif"],
    terms: ["office-stationery", "corporate-gifts", "conference"],
  },
  {
    slug: "nfc-luggage-tag",
    nameEn: "NFC Luggage Tag",
    nameId: "Label Koper NFC",
    shortEn: "One tap opens your campaign.",
    shortId: "Satu ketukan membuka kampanye Anda.",
    whyEn:
      "An NFC chip turns a piece of merchandise into a doorway. Used for event check-in, a campaign landing page, or a product registration — it keeps working long after the event, and it is measurable in a way a printed logo never is.",
    whyId:
      "Chip NFC mengubah merchandise menjadi pintu masuk. Digunakan untuk check-in acara, halaman kampanye, atau registrasi produk — tetap berfungsi lama setelah acara, dan terukur dengan cara yang tak mungkin dilakukan logo cetak.",
    material: "Silicone, embedded NFC",
    moq: 200,
    leadTime: "14–21 days",
    customisation: ["Custom shape", "Logo printing", "Custom colour"],
    availability: "IMPORT_SOURCING",
    price: 42_000,
    tagsEn: ["Travel", "VIP Gifts", "Technology"],
    tagsId: ["Perjalanan", "Hadiah VIP", "Teknologi"],
    terms: ["technology", "vip-gifts", "travel"],
    isNew: true,
  },
  {
    slug: "insulated-takeaway-bag",
    nameEn: "Insulated Takeaway Bag",
    nameId: "Tas Bawa Pulang Berinsulasi",
    shortEn: "Common in China. Almost untapped here.",
    shortId: "Umum di Tiongkok. Nyaris belum tergarap di sini.",
    whyEn:
      "Restaurants and delivery brands spend heavily on packaging that gets thrown away. This is the piece that survives the meal, and it carries branding into someone's kitchen rather than their bin.",
    whyId:
      "Restoran dan merek pengiriman mengeluarkan banyak biaya untuk kemasan yang langsung dibuang. Ini adalah bagian yang bertahan setelah makanan habis, dan membawa merek ke dapur seseorang, bukan ke tempat sampah.",
    material: "Non-woven, aluminium lining",
    moq: 300,
    leadTime: "14 days",
    customisation: ["Full-surface print", "Logo printing"],
    availability: "LOCAL_PRODUCTION",
    price: 35_000,
    tagsEn: ["F&B", "Gift With Purchase"],
    tagsId: ["F&B", "Hadiah Pembelian"],
    terms: ["f-and-b", "gift-with-purchase", "bags-carry"],
    isNew: true,
  },
  {
    slug: "bamboo-desk-set",
    nameEn: "Bamboo Desk Set",
    nameId: "Set Meja Bambu",
    shortEn: "Local craft, finished to an export standard.",
    shortId: "Kerajinan lokal, mutu ekspor.",
    whyEn:
      "Sustainable merchandise usually looks like a compromise. This does not — the material is genuinely local, the finish is not, and it sits on a desk without apologising for itself.",
    whyId:
      "Merchandise berkelanjutan biasanya terlihat seperti kompromi. Ini tidak — bahannya benar-benar lokal, finishing-nya tidak, dan tampil di meja tanpa perlu meminta maaf.",
    material: "Bamboo, recycled paper",
    moq: 150,
    leadTime: "21 days",
    customisation: ["Laser engraving", "UV"],
    availability: "LOCAL_PRODUCTION",
    price: 120_000,
    tagsEn: ["Eco", "Corporate Gifts", "Property"],
    tagsId: ["Ramah Lingkungan", "Hadiah Korporat", "Properti"],
    terms: ["eco-merchandise", "corporate-gifts", "property"],
  },
  {
    slug: "qr-smart-gift-box",
    nameEn: "QR Smart Gift Box",
    nameId: "Kotak Hadiah Pintar QR",
    shortEn: "When the packaging is the campaign.",
    shortId: "Ketika kemasan menjadi kampanye itu sendiri.",
    whyEn:
      "Packaging is treated as an afterthought far too often. A QR-enabled box turns the unboxing into the first interaction with the campaign — and it is the cheapest way to make a modest gift feel considerable.",
    whyId:
      "Kemasan terlalu sering dianggap sebagai pelengkap. Kotak ber-QR mengubah proses membuka menjadi interaksi pertama dengan kampanye — dan ini cara termurah membuat hadiah sederhana terasa istimewa.",
    material: "Art carton, magnetic closure",
    moq: 200,
    leadTime: "14–21 days",
    customisation: ["Foil", "Emboss", "Spot UV", "Custom insert"],
    availability: "CUSTOM_MADE",
    price: 65_000,
    tagsEn: ["Packaging", "Product Launch", "Influencer"],
    tagsId: ["Kemasan", "Peluncuran Produk", "Influencer"],
    terms: ["packaging", "product-launch", "influencer-pr-kit"],
    featured: true,
  },
  {
    slug: "cold-dtf-jacket",
    nameEn: "Cold DTF Jacket",
    nameId: "Jaket Cold DTF",
    shortEn: "Embroidery texture, without the embroidery lead time.",
    shortId: "Tekstur bordir, tanpa waktu tunggu bordir.",
    whyEn:
      "Cold DTF gives puff, foil and holographic finishes that screen printing cannot reach, at a fraction of embroidery's setup. It is the technique we reach for when a apparel run needs to look premium on a tight schedule.",
    whyId:
      "Cold DTF memberikan efek puff, foil, dan holografis yang tak bisa dicapai sablon, dengan persiapan jauh lebih ringan daripada bordir. Ini teknik yang kami pilih ketika produksi pakaian harus terlihat premium dalam jadwal ketat.",
    material: "Fleece, poly-cotton",
    moq: 100,
    leadTime: "14 days",
    customisation: ["Cold DTF", "Embroidery", "Custom colour"],
    availability: "LOCAL_PRODUCTION",
    price: 195_000,
    tagsEn: ["Apparel", "Employee Welcome Kits"],
    tagsId: ["Pakaian", "Kit Sambutan Karyawan"],
    terms: ["apparel", "employee-welcome-kits"],
    isNew: true,
  },
  {
    slug: "silicone-keychain",
    nameEn: "Silicone Keychain",
    nameId: "Gantungan Kunci Silikon",
    shortEn: "Low mould cost, high creative range.",
    shortId: "Biaya cetakan rendah, ruang kreatif luas.",
    whyEn:
      "The cheapest route from a mascot to a physical object. Mould costs are low enough that a custom shape is viable even on a giveaway budget — which is rarely true of moulded merchandise.",
    whyId:
      "Rute termurah dari maskot ke benda fisik. Biaya cetakan cukup rendah sehingga bentuk kustom tetap masuk akal bahkan dengan anggaran giveaway — hal yang jarang berlaku untuk merchandise cetakan.",
    material: "Food-grade silicone",
    moq: 500,
    leadTime: "21 days",
    customisation: ["Custom shape", "Custom colour"],
    availability: "CUSTOM_MADE",
    price: 12_000,
    tagsEn: ["Mass Giveaway", "Events"],
    tagsId: ["Giveaway Massal", "Acara"],
    terms: ["event-merchandise", "mass-giveaway", "events"],
  },
  {
    slug: "smart-series-organiser",
    nameEn: "Smart Series Organiser",
    nameId: "Organiser Seri Pintar",
    shortEn: "LED, charging, and a place for everything.",
    shortId: "LED, pengisi daya, dan tempat untuk segalanya.",
    whyEn:
      "The gift that stays on the desk because it earns its footprint. Multifunction at this price point is unusual, and it photographs well — which matters more than it should for VIP gifting.",
    whyId:
      "Hadiah yang bertahan di meja karena sepadan dengan ruang yang ditempatinya. Multifungsi di kisaran harga ini tergolong jarang, dan tampil bagus di foto — hal yang lebih penting daripada seharusnya untuk hadiah VIP.",
    material: "PU leather, ABS",
    moq: 100,
    leadTime: "21–30 days",
    customisation: ["Laser engraving", "Debossing", "Custom colour"],
    availability: "IMPORT_SOURCING",
    price: 320_000,
    tagsEn: ["Technology", "VIP Gifts", "Banking"],
    tagsId: ["Teknologi", "Hadiah VIP", "Perbankan"],
    terms: ["technology", "vip-gifts", "banking-finance"],
  },
  {
    slug: "printed-event-tote",
    nameEn: "Printed Event Tote",
    nameId: "Tote Acara Bercetak",
    shortEn: "The canvas everyone keeps.",
    shortId: "Kanvas yang semua orang simpan.",
    whyEn:
      "Canvas totes survive events in a way printed plastic never does. The trick is treating the surface as a poster rather than a logo placement — which is a design decision, not a cost one.",
    whyId:
      "Tote kanvas bertahan setelah acara dengan cara yang tak bisa dilakukan plastik bercetak. Kuncinya adalah memperlakukan permukaannya sebagai poster, bukan sekadar tempat logo — itu keputusan desain, bukan biaya.",
    material: "12oz cotton canvas",
    moq: 300,
    leadTime: "10–14 days",
    customisation: ["Full-surface print", "Logo printing"],
    availability: "READY_STOCK",
    price: 45_000,
    tagsEn: ["Events", "Exhibition", "Retail"],
    tagsId: ["Acara", "Pameran", "Ritel"],
    terms: ["bags-carry", "exhibition", "events"],
  },
  {
    slug: "portable-kettle",
    nameEn: "Portable Travel Kettle",
    nameId: "Teko Perjalanan Portabel",
    shortEn: "For the client who travels more than they sit.",
    shortId: "Untuk klien yang lebih sering bepergian daripada duduk.",
    whyEn:
      "Genuinely useful on the road, and unusual enough to be remembered. We recommend it when the audience is senior and the brief says premium without saying expensive.",
    whyId:
      "Benar-benar berguna dalam perjalanan, dan cukup tidak biasa untuk diingat. Kami merekomendasikannya ketika audiensnya senior dan brief-nya menyebut premium tanpa menyebut mahal.",
    material: "Stainless steel",
    capacity: "0.5 L",
    moq: 100,
    leadTime: "21 days",
    customisation: ["Laser engraving", "Gift box"],
    availability: "READY_STOCK",
    price: 210_000,
    tagsEn: ["Travel", "VIP Gifts", "F&B"],
    tagsId: ["Perjalanan", "Hadiah VIP", "F&B"],
    terms: ["travel", "vip-gifts", "f-and-b"],
  },
];

/** The five documented case studies from the company profile. */
const PROJECTS = [
  {
    slug: "breaking-the-tumbler-trap",
    titleEn: "Breaking the Tumbler Trap",
    titleId: "Keluar dari Jebakan Tumbler",
    client: "Pakuwon",
    industry: "Retail & Property",
    summaryEn:
      "They asked for 1,500 tumblers on a Rp 15,000 budget. We told them the tumbler was the problem.",
    summaryId:
      "Mereka meminta 1.500 tumbler dengan anggaran Rp 15.000. Kami katakan tumbler itulah masalahnya.",
    briefEn:
      "Pakuwon came to us for their Urban Sport Digital Game with a clear request: 1,500 tumblers, at Rp 15,000 per piece.",
    briefId:
      "Pakuwon datang kepada kami untuk Urban Sport Digital Game dengan permintaan yang jelas: 1.500 tumbler, seharga Rp 15.000 per unit.",
    challengeEn:
      "At that budget, the only tumblers available were thin, poorly finished, and visually indistinguishable from the ones every other event was handing out that season. The client would have spent the full budget and received something their audience would use once, if at all.",
    challengeId:
      "Dengan anggaran itu, satu-satunya tumbler yang tersedia berkualitas tipis, finishing buruk, dan tak berbeda dari yang dibagikan setiap acara lain musim itu. Klien akan menghabiskan seluruh anggaran dan menerima sesuatu yang mungkin hanya dipakai sekali.",
    thinkingEn:
      "The budget wasn't the constraint. The category was. This was an urban sports event across a mall complex — the audience would be walking, carrying things, moving between venues all day. A tumbler competes with the drink already in their hand. A bag solves a problem they are actively having.",
    thinkingId:
      "Anggaran bukanlah kendalanya. Kategorinya yang jadi masalah. Ini acara olahraga urban di kompleks mal — audiens akan berjalan, membawa barang, berpindah antar venue sepanjang hari. Tumbler bersaing dengan minuman yang sudah ada di tangan mereka. Tas menyelesaikan masalah yang sedang mereka hadapi.",
    createdWorkEn:
      "A fully printed foldable shopping bag, durable enough for daily use, in a weight that folds into a pocket. The event artwork ran across the full surface — no logo placement, no white space around a mark.",
    createdWorkId:
      "Tas belanja lipat bercetak penuh, cukup kuat untuk pemakaian harian, dengan bobot yang bisa dilipat masuk saku. Artwork acara membentang di seluruh permukaan — tanpa penempatan logo, tanpa ruang putih di sekelilingnya.",
    makingEn:
      "Produced locally to hold the three-week timeline, and delivered complete at 1,500 units within the original per-piece budget.",
    makingId:
      "Diproduksi secara lokal untuk memenuhi lini masa tiga minggu, dan dikirim lengkap 1.500 unit dalam anggaran per unit semula.",
    impactEn:
      "The bags became walking billboards across the city, keeping the event visible long after it ended. Same budget. A different category. Considerably more brand.",
    impactId:
      "Tas-tas itu menjadi papan iklan berjalan di seluruh kota, menjaga acara tetap terlihat lama setelah usai. Anggaran sama. Kategori berbeda. Merek jauh lebih terasa.",
    stats: [
      { value: "1,500", labelEn: "Units delivered", labelId: "Unit dikirim" },
      { value: "Rp 15K", labelEn: "Unchanged budget per piece", labelId: "Anggaran per unit tak berubah" },
      { value: "100%", labelEn: "Print coverage", labelId: "Cakupan cetak" },
    ],
    featured: true,
    products: ["foldable-shopping-bag", "printed-event-tote"],
  },
  {
    slug: "from-generic-pen-to-brand-story",
    titleEn: "From Generic Pen to Brand Story",
    titleId: "Dari Pulpen Generik ke Cerita Merek",
    client: "Honda",
    industry: "Automotive",
    summaryEn:
      "A giveaway pen that carried the 2025 mascot and the car launch — and came in under the original budget.",
    summaryId:
      "Pulpen giveaway yang membawa maskot 2025 dan peluncuran mobil — dengan biaya di bawah anggaran awal.",
    briefEn:
      "Honda needed giveaway pens for an upcoming event. Their past experience with local vendors had left them with generic, overpriced products and uninspired packaging.",
    briefId:
      "Honda membutuhkan pulpen giveaway untuk sebuah acara. Pengalaman sebelumnya dengan vendor lokal menghasilkan produk generik, mahal, dan kemasan tanpa inspirasi.",
    thinkingEn:
      "A pen is only forgettable if you treat it as a pen. Tied to the 2025 mascot and the car launch, it becomes a piece of the campaign rather than a branded object handed out at a desk.",
    thinkingId:
      "Pulpen hanya mudah dilupakan jika Anda memperlakukannya sebagai pulpen. Dikaitkan dengan maskot 2025 dan peluncuran mobil, ia menjadi bagian dari kampanye, bukan sekadar benda bermerek.",
    createdWorkEn:
      "A multifunctional 3-in-1 pen, laser-engraved in-house for speed and cost saving, paired with packaging featuring Honda's 2025 mascot and car launch.",
    createdWorkId:
      "Pulpen multifungsi 3-in-1, digravir laser di tempat kami untuk kecepatan dan penghematan, dipadukan dengan kemasan bermaskot 2025 Honda dan peluncuran mobilnya.",
    makingEn:
      "Laser engraving in-house removed a supplier step and the queue that comes with it, which is what kept the project under budget.",
    makingId:
      "Gravir laser di tempat kami menghilangkan satu langkah pemasok beserta antreannya, dan itulah yang menjaga proyek tetap di bawah anggaran.",
    impactEn:
      "Honda spent less than their original budget, received merchandise aligned with their campaign, and left event visitors with a memorable keepsake instead of a throwaway item.",
    impactId:
      "Honda mengeluarkan biaya di bawah anggaran awal, menerima merchandise yang selaras dengan kampanye, dan meninggalkan kenang-kenangan berkesan bagi pengunjung acara.",
    featured: true,
    products: ["3-in-1-ballpoint"],
  },
  {
    slug: "a-pen-that-closed-deals",
    titleEn: "A Pen that Closed Deals",
    titleId: "Pulpen yang Menutup Kesepakatan",
    client: "Mitsui Sumitomo Insurance",
    industry: "Insurance",
    summaryEn:
      "A stylus tip turned a giveaway into a tool for signing digital policies.",
    summaryId:
      "Ujung stylus mengubah giveaway menjadi alat untuk menandatangani polis digital.",
    briefEn:
      "As Mitsui shifted to digital policies requiring e-signatures, their existing giveaways no longer matched the company's transformation.",
    briefId:
      "Ketika Mitsui beralih ke polis digital yang memerlukan tanda tangan elektronik, giveaway mereka tidak lagi sesuai dengan transformasi perusahaan.",
    thinkingEn:
      "The merchandise had to do the same job as the policy change: make digital signing feel natural. A stylus tip is a small addition that puts the brand in the hand at the exact moment the customer signs.",
    thinkingId:
      "Merchandise harus melakukan tugas yang sama dengan perubahan polis: membuat tanda tangan digital terasa wajar. Ujung stylus adalah tambahan kecil yang menempatkan merek di tangan tepat saat pelanggan menandatangani.",
    createdWorkEn:
      "Premium pens with stylus tips — practical for both writing and digital signing.",
    createdWorkId:
      "Pulpen premium dengan ujung stylus — praktis untuk menulis maupun tanda tangan digital.",
    impactEn:
      "Every giveaway supported Mitsui's brand positioning. Instead of clutter, their merchandise became part of the customer journey.",
    impactId:
      "Setiap giveaway mendukung positioning merek Mitsui. Alih-alih menjadi barang berlebih, merchandise mereka menjadi bagian dari perjalanan pelanggan.",
    products: ["3-in-1-ballpoint"],
  },
  {
    slug: "building-a-retail-experience-from-scratch",
    titleEn: "Building a Retail Experience from Scratch",
    titleId: "Membangun Pengalaman Ritel dari Nol",
    client: "Pakuwon Mall",
    industry: "Retail & Property",
    summaryEn:
      "An 11-day padel tournament, no retail experience, three weeks' notice. We built the brand presence.",
    summaryId:
      "Turnamen padel 11 hari, tanpa pengalaman ritel, pemberitahuan tiga minggu. Kami membangun kehadiran mereknya.",
    briefEn:
      "Pakuwon Mall's 11-day padel tournament wanted an exclusive merchandise retail booth, but had no retail experience and no clear plan. Timeline: three weeks.",
    briefId:
      "Turnamen padel 11 hari Pakuwon Mall menginginkan booth ritel merchandise eksklusif, tanpa pengalaman ritel dan tanpa rencana jelas. Lini masa: tiga minggu.",
    challengeEn:
      "Three weeks is not long enough to design a product line, produce it, and build a retail presence around it — unless all three run in parallel.",
    challengeId:
      "Tiga minggu tidak cukup untuk merancang lini produk, memproduksinya, dan membangun kehadiran ritel di sekitarnya — kecuali ketiganya berjalan paralel.",
    createdWorkEn:
      "We took full ownership: limited-edition patterns, ten product lines, unique packaging, and PR boxes and brochures.",
    createdWorkId:
      "Kami mengambil alih sepenuhnya: pola edisi terbatas, sepuluh lini produk, kemasan unik, serta PR box dan brosur.",
    makingEn:
      "Ten lines produced concurrently across in-house customisation and local partners, so no single bottleneck could sink the timeline.",
    makingId:
      "Sepuluh lini diproduksi bersamaan antara kustomisasi in-house dan mitra lokal, sehingga tidak ada satu hambatan pun yang bisa menggagalkan jadwal.",
    impactEn:
      "The merchandise sold with strong margins and elevated the tournament experience. Kadokowe didn't just provide products — we built a retail brand presence.",
    impactId:
      "Merchandise terjual dengan margin kuat dan meningkatkan pengalaman turnamen. Kadokowe tidak sekadar menyediakan produk — kami membangun kehadiran merek ritel.",
    products: ["printed-event-tote", "silicone-keychain"],
  },
  {
    slug: "no-budget-no-problem",
    titleEn: "No Budget, No Problem",
    titleId: "Tanpa Anggaran, Bukan Masalah",
    client: "SUI",
    industry: "Events & Influencer",
    summaryEn:
      "150 VIP gifts, under three weeks, no fixed budget. We came back with 27 options across three tiers.",
    summaryId:
      "150 hadiah VIP, kurang dari tiga minggu, tanpa anggaran tetap. Kami kembali dengan 27 pilihan dalam tiga tingkatan.",
    briefEn:
      "For their Bali influencer event with 150 VIPs, SUI had no set budget but needed premium welcome gifts in under three weeks.",
    briefId:
      "Untuk acara influencer di Bali dengan 150 VIP, SUI tidak memiliki anggaran tetap namun membutuhkan hadiah sambutan premium dalam kurang dari tiga minggu.",
    thinkingEn:
      "With no budget set, the useful move is not to guess it. We priced three tiers so the client could see what each level actually buys, and decide against real options rather than an abstraction.",
    thinkingId:
      "Tanpa anggaran yang ditetapkan, langkah yang berguna bukanlah menebaknya. Kami menyusun tiga tingkatan harga agar klien bisa melihat apa yang sebenarnya didapat di tiap level, dan memutuskan berdasarkan pilihan nyata.",
    createdWorkEn:
      "27 product options across three budget tiers, developed with their international agency.",
    createdWorkId:
      "27 pilihan produk dalam tiga tingkatan anggaran, dikembangkan bersama agensi internasional mereka.",
    impactEn:
      "Merchandise was delivered ahead of schedule, with multiple creative options that convinced both client and influencers. We turned uncertainty into confidence.",
    impactId:
      "Merchandise dikirim lebih cepat dari jadwal, dengan berbagai pilihan kreatif yang meyakinkan klien maupun influencer. Kami mengubah ketidakpastian menjadi keyakinan.",
    products: ["smart-series-organiser", "qr-smart-gift-box"],
  },
];

const ARTICLES = [
  {
    slug: "why-your-company-doesnt-need-another-tumbler",
    category: "GIFTING_STRATEGY" as const,
    titleEn: "Why Your Company Doesn't Need Another Tumbler",
    titleId: "Mengapa Perusahaan Anda Tidak Butuh Tumbler Lagi",
    excerptEn:
      "When a familiar merchandise category works — and when it is time to rethink the brief.",
    excerptId:
      "Kapan kategori merchandise yang familier berhasil — dan kapan saatnya memikirkan ulang brief.",
    featured: true,
    projects: ["breaking-the-tumbler-trap"],
    products: ["foldable-shopping-bag", "portable-electric-cooking-pot", "portable-kettle"],
  },
  {
    slug: "the-rp50000-question",
    category: "GIFTING_STRATEGY" as const,
    titleEn: "The Rp50,000 Question",
    titleId: "Pertanyaan Rp50.000",
    excerptEn:
      "How to maximise perceived value when merchandise budgets are limited.",
    excerptId:
      "Cara memaksimalkan nilai yang dirasakan ketika anggaran merchandise terbatas.",
    products: ["foldable-shopping-bag", "silicone-keychain"],
  },
  {
    slug: "packaging-can-change-the-value-of-the-gift",
    category: "PACKAGING_DESIGN" as const,
    titleEn: "Packaging Can Change the Value of the Gift",
    titleId: "Kemasan Dapat Mengubah Nilai Sebuah Hadiah",
    excerptEn:
      "Why presentation should be considered part of the product, not a wrapper around it.",
    excerptId:
      "Mengapa presentasi harus dianggap bagian dari produk, bukan sekadar pembungkusnya.",
    products: ["qr-smart-gift-box"],
  },
  {
    slug: "500-vs-5000-pieces",
    category: "IDEAS_TRENDS" as const,
    titleEn: "500 vs 5,000 Pieces",
    titleId: "500 vs 5.000 Unit",
    excerptEn:
      "How quantity changes product choice, customisation and production strategy.",
    excerptId:
      "Bagaimana kuantitas mengubah pilihan produk, kustomisasi, dan strategi produksi.",
  },
  {
    slug: "local-or-import",
    category: "BEHIND_THE_MAKING" as const,
    titleEn: "Local or Import?",
    titleId: "Lokal atau Impor?",
    excerptEn:
      "How timeline, customisation, quantity and budget decide where a product is made.",
    excerptId:
      "Bagaimana lini masa, kustomisasi, kuantitas, dan anggaran menentukan tempat produk dibuat.",
  },
  {
    slug: "designing-merchandise-for-an-event",
    category: "IDEAS_TRENDS" as const,
    titleEn: "Designing Merchandise for an Event",
    titleId: "Merancang Merchandise untuk Sebuah Acara",
    excerptEn: "Start with audience behaviour, not a catalogue.",
    excerptId: "Mulai dari perilaku audiens, bukan dari katalog.",
    projects: ["building-a-retail-experience-from-scratch"],
  },
];

/**
 * `--skip-products` seeds everything except the sample catalogue.
 *
 * The taxonomy and the five case studies are real — the studies come from the
 * company profile — and are worth having in production. The twelve products
 * are not: they are representative copy written to exercise the build, and
 * putting them on a live site means a visitor reading invented merchandise.
 *
 * Projects and articles link to products by slug, so with products skipped
 * those relations simply come out empty. The cross-link blocks they feed
 * render only when populated (FR-8.8), so they are absent rather than broken.
 */
const skipProducts = process.argv.includes("--skip-products");

async function main() {
  console.log("Seeding taxonomy…");
  const axisMap = { product: "PRODUCT", purpose: "PURPOSE", industry: "INDUSTRY", budget: "BUDGET" } as const;
  for (const [key, axis] of Object.entries(AXES)) {
    for (const [i, term] of axis.terms.entries()) {
      await db.taxonomyTerm.upsert({
        where: { axis_slugEn: { axis: axisMap[key as keyof typeof axisMap], slugEn: term.slug } },
        update: { nameEn: term.en, nameId: term.id, sortOrder: i },
        create: {
          axis: axisMap[key as keyof typeof axisMap],
          slugEn: term.slug,
          nameEn: term.en,
          nameId: term.id,
          sortOrder: i,
        },
      });
    }
  }

  if (skipProducts) console.log("Skipping sample products (--skip-products).");
  else console.log("Seeding products…");
  for (const p of skipProducts ? [] : PRODUCTS) {
    // Budget tier is derived rather than hand-tagged — at a thousand products
    // tagging by hand is not workable, and price already implies the tier.
    const tier = p.price ? budgetTierFor(p.price) : null;
    const termSlugs = [...p.terms, ...(tier ? [tier] : [])];
    const terms = await db.taxonomyTerm.findMany({
      where: { slugEn: { in: termSlugs } },
      select: { id: true },
    });

    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        nameEn: p.nameEn,
        nameId: p.nameId,
        shortEn: p.shortEn,
        shortId: p.shortId,
        whyEn: p.whyEn,
        whyId: p.whyId,
        material: p.material,
        capacity: p.capacity,
        colours: p.colours ?? [],
        moq: p.moq,
        leadTime: p.leadTime,
        customisation: p.customisation ?? [],
        availability: p.availability,
        indicativePrice: p.price,
        tagsEn: p.tagsEn,
        tagsId: p.tagsId,
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
        visibility: "PUBLISHED",
        terms: { connect: terms.map((t) => ({ id: t.id })) },
      },
    });
  }

  console.log("Seeding projects…");
  for (const [i, pr] of PROJECTS.entries()) {
    const products = await db.product.findMany({
      where: { slug: { in: pr.products ?? [] } },
      select: { id: true },
    });
    await db.project.upsert({
      where: { slug: pr.slug },
      update: {},
      create: {
        slug: pr.slug,
        titleEn: pr.titleEn,
        titleId: pr.titleId,
        client: pr.client,
        industry: pr.industry,
        summaryEn: pr.summaryEn,
        summaryId: pr.summaryId,
        briefEn: pr.briefEn,
        briefId: pr.briefId,
        challengeEn: pr.challengeEn ?? null,
        challengeId: pr.challengeId ?? null,
        thinkingEn: pr.thinkingEn ?? null,
        thinkingId: pr.thinkingId ?? null,
        createdWorkEn: pr.createdWorkEn ?? null,
        createdWorkId: pr.createdWorkId ?? null,
        makingEn: pr.makingEn ?? null,
        makingId: pr.makingId ?? null,
        impactEn: pr.impactEn,
        impactId: pr.impactId,
        stats: pr.stats ?? undefined,
        featured: pr.featured ?? false,
        visibility: "PUBLISHED",
        publishedAt: new Date(),
        sortOrder: i,
        products: { connect: products.map((p) => ({ id: p.id })) },
      },
    });
  }

  console.log("Seeding insights…");
  for (const a of ARTICLES) {
    const products = await db.product.findMany({
      where: { slug: { in: a.products ?? [] } },
      select: { id: true },
    });
    const projects = await db.project.findMany({
      where: { slug: { in: a.projects ?? [] } },
      select: { id: true },
    });
    await db.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        category: a.category,
        titleEn: a.titleEn,
        titleId: a.titleId,
        excerptEn: a.excerptEn,
        excerptId: a.excerptId,
        featured: a.featured ?? false,
        visibility: "PUBLISHED",
        publishedAt: new Date(),
        products: { connect: products.map((p) => ({ id: p.id })) },
        projects: { connect: projects.map((p) => ({ id: p.id })) },
      },
    });
  }

  const counts = {
    terms: await db.taxonomyTerm.count(),
    products: await db.product.count(),
    projects: await db.project.count(),
    articles: await db.article.count(),
  };
  console.log("Done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
