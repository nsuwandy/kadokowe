/**
 * Custom Made — SRS v1.4 §8.12, FR-12.
 *
 * Seven families, renamed from the revision brief's proposal to remove three
 * exact collisions with Idea Library categories (Bags & Carry, Apparel,
 * Packaging). A visitor clicking "Packaging" in two places had no way to know
 * which they would get. The "Custom" prefix separates them and states the
 * section's promise in the label itself.
 *
 * Content is code-managed at launch (FR-12.11) via the standard page-content
 * mechanism, so this file is the source of record until an editor exists.
 *
 * FR-12.3 and FR-12.5 hold a line that erodes easily during content work:
 * broad material families only, no specification tables. The pull is always
 * toward completeness — every fabric, every GSM — which turns the section
 * into the technical encyclopedia the brief rejects and shifts work onto the
 * client that Kadokowe is engaged to do.
 */

export type MaterialGroup = { en: string; id: string; descEn: string; descId: string };

export type Family = {
  slug: string;
  nameEn: string;
  nameId: string;
  /** Family-level positioning line. */
  leadEn: string;
  leadId: string;
  introEn: string;
  introId: string;
  /** "What can we create?" — example products, not a catalogue. */
  examplesEn: string[];
  examplesId: string[];
  /** "Understanding your options" — broad families only (FR-12.3). */
  options?: MaterialGroup[];
  /** "Make it yours" — branding possibilities. */
  branding: string[];
  /** Shot list for the family hero while photography is pending. */
  shot: string;
};

const FABRIC_OPTIONS: MaterialGroup[] = [
  {
    en: "Natural fabrics",
    id: "Kain alami",
    descEn: "Canvas, cotton and related materials. Warm, sturdy, takes print well.",
    descId: "Kanvas, katun, dan sejenisnya. Hangat, kuat, dan menyerap cetakan dengan baik.",
  },
  {
    en: "Performance fabrics",
    id: "Kain performa",
    descEn: "Polyester, nylon and related materials. Light, packable, weather-resistant.",
    descId: "Poliester, nilon, dan sejenisnya. Ringan, mudah dilipat, tahan cuaca.",
  },
  {
    en: "Premium & structured",
    id: "Premium & berstruktur",
    descEn: "PU and other structured options that hold their shape on a shelf.",
    descId: "PU dan pilihan berstruktur lain yang mempertahankan bentuknya.",
  },
  {
    en: "Sustainable options",
    id: "Pilihan berkelanjutan",
    descEn: "RPET and selected recycled alternatives.",
    descId: "RPET dan alternatif daur ulang pilihan.",
  },
];

export const FAMILIES: Family[] = [
  {
    slug: "custom-bags",
    nameEn: "Custom Bags",
    nameId: "Tas Kustom",
    leadEn: "Built to your construction, not picked from a shelf.",
    leadId: "Dibuat sesuai konstruksi Anda, bukan diambil dari rak.",
    introEn:
      "Bags are the merchandise people keep longest, which makes them worth designing rather than selecting. We develop construction, material and finish around how the bag will actually be carried.",
    introId:
      "Tas adalah merchandise yang paling lama disimpan orang, sehingga layak dirancang, bukan sekadar dipilih. Kami mengembangkan konstruksi, bahan, dan finishing berdasarkan cara tas itu benar-benar dibawa.",
    examplesEn: [
      "Tote and shopper", "Backpack and daypack", "Foldable and packable",
      "Drawstring and sport", "Laptop and work", "Pouch and organiser",
    ],
    examplesId: [
      "Tote dan shopper", "Ransel dan daypack", "Lipat dan mudah dibawa",
      "Serut dan olahraga", "Laptop dan kerja", "Pouch dan organiser",
    ],
    options: FABRIC_OPTIONS,
    branding: ["Full-surface print", "Screen print", "Embroidery", "Woven label", "Custom hardware", "Custom lining"],
    shot: "Custom bag range, studio-lit on a neutral ground",
  },
  {
    slug: "printed-textiles",
    nameEn: "Printed Textiles",
    nameId: "Tekstil Bercetak",
    leadEn: "One design. Many possibilities.",
    leadId: "Satu desain. Banyak kemungkinan.",
    introEn:
      "A single brand artwork can run across an entire family of products. Once a pattern is developed, the same design becomes a blanket, a scarf, an apron and a set of event textiles — which is how a campaign gets visual coherence without repeating one object.",
    introId:
      "Satu artwork merek dapat diterapkan pada seluruh keluarga produk. Setelah pola dikembangkan, desain yang sama menjadi selimut, syal, celemek, dan tekstil acara — sehingga kampanye memperoleh keselarasan visual tanpa mengulang satu benda saja.",
    examplesEn: [
      "Blanket and throw", "Travel neck pillow", "Cushion cover", "Towel",
      "Scarf and bandana", "Apron", "Foldable textile goods", "Event textiles",
    ],
    examplesId: [
      "Selimut", "Bantal leher", "Sarung bantal", "Handuk",
      "Syal dan bandana", "Celemek", "Produk tekstil lipat", "Tekstil acara",
    ],
    options: FABRIC_OPTIONS,
    branding: ["Full sublimation", "Panel print", "Woven label", "Embroidery", "Custom trim"],
    shot: "One pattern shown across blanket, scarf and cushion",
  },
  {
    slug: "plush-characters",
    nameEn: "Plush & Characters",
    nameId: "Plush & Karakter",
    leadEn: "Bring your character to life.",
    leadId: "Hidupkan karakter Anda.",
    introEn:
      "A mascot that lives only in artwork is doing half a job. Turned into an object people hold, it earns shelf space at home — and becomes the merchandise nobody throws away.",
    introId:
      "Maskot yang hanya hidup dalam artwork baru menjalankan separuh tugasnya. Diwujudkan menjadi benda yang dipegang orang, ia mendapatkan tempat di rumah — dan menjadi merchandise yang tak dibuang siapa pun.",
    examplesEn: [
      "Mascot to plush toy", "Character to doll", "Logo or shape to cushion",
      "Plush keychain", "Shaped pillow", "Soft promotional items",
    ],
    examplesId: [
      "Maskot menjadi boneka plush", "Karakter menjadi doll", "Logo atau bentuk menjadi bantal",
      "Gantungan kunci plush", "Bantal berbentuk", "Produk promosi lembut",
    ],
    branding: ["Custom shape", "Embroidered features", "Printed detail", "Custom outfit", "Hang tag"],
    shot: "Mascot artwork beside its finished plush prototype",
  },
  {
    slug: "silicone-moulded",
    nameEn: "Silicone & Moulded",
    nameId: "Silikon & Cetakan",
    leadEn: "Low mould cost, high creative range.",
    leadId: "Biaya cetakan rendah, ruang kreatif luas.",
    introEn:
      "The cheapest route from a shape to a physical object. Mould costs are low enough that a genuinely custom form is viable even on a giveaway budget — which is rarely true of moulded merchandise.",
    introId:
      "Rute termurah dari sebuah bentuk ke benda fisik. Biaya cetakan cukup rendah sehingga bentuk yang benar-benar kustom tetap masuk akal bahkan dengan anggaran giveaway — hal yang jarang berlaku untuk merchandise cetakan.",
    examplesEn: [
      "Keychain and charm", "Wristband", "Coaster", "Phone grip",
      "Luggage tag", "EVA and rubber parts",
    ],
    examplesId: [
      "Gantungan kunci dan charm", "Gelang", "Tatakan gelas", "Grip ponsel",
      "Label koper", "Komponen EVA dan karet",
    ],
    branding: ["Custom shape", "Custom colour", "Debossed detail", "Multi-colour fill", "Embedded NFC"],
    shot: "Silicone range in multiple custom shapes and colours",
  },
  {
    slug: "custom-apparel",
    nameEn: "Custom Apparel",
    nameId: "Pakaian Kustom",
    leadEn: "Worn by choice, not obligation.",
    leadId: "Dipakai karena pilihan, bukan kewajiban.",
    introEn:
      "The test for branded apparel is whether someone wears it when they are not obliged to. That comes down to fit, fabric and restraint with the logo — decisions made at development, not at print.",
    introId:
      "Ujian bagi pakaian bermerek adalah apakah seseorang memakainya saat tidak diwajibkan. Itu bergantung pada potongan, bahan, dan kehati-hatian dalam penempatan logo — keputusan yang dibuat saat pengembangan, bukan saat mencetak.",
    examplesEn: [
      "T-shirt and polo", "Hoodie and sweatshirt", "Jacket and outerwear",
      "Cap and headwear", "Uniform and workwear", "Event crew apparel",
    ],
    examplesId: [
      "Kaos dan polo", "Hoodie dan sweatshirt", "Jaket dan outerwear",
      "Topi", "Seragam dan pakaian kerja", "Pakaian kru acara",
    ],
    options: FABRIC_OPTIONS,
    branding: ["Cold DTF", "Screen print", "Embroidery", "Woven label", "Custom trim", "Puff and foil"],
    shot: "Custom apparel with Cold DTF texture detail",
  },
  {
    slug: "custom-packaging",
    nameEn: "Custom Packaging",
    nameId: "Kemasan Kustom",
    leadEn: "The gift starts before the box is opened.",
    leadId: "Hadiah dimulai sebelum kotaknya dibuka.",
    introEn:
      "Packaging is treated as an afterthought far more often than it should be. It is the cheapest way to make a modest gift feel considerable, and the first interaction anyone has with the campaign.",
    introId:
      "Kemasan jauh lebih sering dianggap pelengkap daripada seharusnya. Ini cara termurah membuat hadiah sederhana terasa istimewa, sekaligus interaksi pertama siapa pun dengan kampanye Anda.",
    examplesEn: [
      "Art carton packaging", "Corrugated & mailer", "Hard box", "Creative box",
      "PR & influencer box", "Event packaging", "Tote & fabric packaging",
      "Pouch", "Paper bag", "Custom packaging",
    ],
    examplesId: [
      "Kemasan art carton", "Korugasi & mailer", "Hard box", "Kotak kreatif",
      "Kotak PR & influencer", "Kemasan acara", "Kemasan tote & kain",
      "Pouch", "Tas kertas", "Kemasan kustom",
    ],
    branding: [
      "Lamination", "Foil", "Emboss / deboss", "Spot UV",
      "Specialty paper", "Ribbon", "Window", "Custom insert",
    ],
    shot: "Hard box, mailer and PR box shown together with finishing detail",
  },
  {
    slug: "special-projects",
    nameEn: "Special Projects",
    nameId: "Proyek Khusus",
    leadEn: "When it doesn't fit a category.",
    leadId: "Ketika tidak masuk kategori mana pun.",
    introEn:
      "Some briefs do not resemble anything on this page. A retail booth built in three weeks, a product line invented for one tournament, a material nobody has used for merchandise yet. This is where those start.",
    introId:
      "Sebagian brief tidak menyerupai apa pun di halaman ini. Booth ritel yang dibangun dalam tiga minggu, lini produk yang diciptakan untuk satu turnamen, material yang belum pernah dipakai untuk merchandise. Di sinilah semuanya bermula.",
    examplesEn: [
      "Retail and booth merchandise", "Limited-edition product lines",
      "3D-printed prototypes and trophies", "NFC and smart merchandise",
      "Gift set development", "New material exploration",
    ],
    examplesId: [
      "Merchandise ritel dan booth", "Lini produk edisi terbatas",
      "Prototipe dan trofi cetak 3D", "Merchandise NFC dan pintar",
      "Pengembangan set hadiah", "Eksplorasi material baru",
    ],
    branding: ["Full custom development", "Prototyping", "Material sourcing", "Packaging design"],
    shot: "Prototype bench — 3D prints, samples, material tests",
  },
];

export function familyBySlug(slug: string) {
  return FAMILIES.find((f) => f.slug === slug);
}
