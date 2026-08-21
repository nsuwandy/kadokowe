import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow, SectionHead } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { OUTCOMES, PROCESS, PRODUCT_CATEGORIES } from "@/content/home";
import { publishedConcepts } from "@/content/concepts";
import { ClientLogos } from "@/components/ClientLogos";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/lib/db";

const HOME_PRODUCT_SELECT = {
  slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
  tagsEn: true, tagsId: true, heroImage: true, availability: true,
} as const;
import { pageBlocks, blockCopy } from "@/lib/page-content";

/**
 * Homepage — SRS v1.4 §11.4 and FR-2.1 to FR-2.14.
 *
 * Ten sections, and FR-2.12 forbids any two consecutive sections sharing a
 * layout composition. That rule is the point of the page: source B identifies
 * changing composition as the characteristic to carry from the references —
 * "every scroll reveals a slightly different visual composition". The order
 * below is deliberate and should not be rearranged into something tidier.
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  // FR-10.6 / FR-2.2 — administrator-set hero imagery and headline, each
  // falling back to the design default when unset.
  const hero = await pageBlocks("home.hero");

  // FR-10.5 — the "Don't start with a product" section is editable too. Only
  // the first line of the headline is overridable: the italic second line is
  // a typographic pair with it, and letting the two drift apart is how this
  // section stops reading as one sentence.
  // FR-13.6 — only offered when a collection is actually published; the link
  // would otherwise lead to an empty page.
  const hasConcepts = publishedConcepts().length > 0;

  // FR-2.14 — drawn from published projects, so the strip cannot name a
  // client whose work is not on the site. distinct() keeps a client with
  // several projects from appearing several times.
  const clientRows = await db.project.findMany({
    where: { visibility: "PUBLISHED" },
    select: { client: true },
    distinct: ["client"],
    orderBy: { client: "asc" },
  });
  const clients = clientRows.map((row) => row.client);

  // FR-2.8 / FR-10.6 — the homepage reads the flags the editors set. Both
  // fall back so the section never renders a hole: "new" widens to the most
  // recent products, and the featured project to the newest published one.
  const [flaggedNew, recentProducts, flaggedProject, recentProject] = await Promise.all([
    db.product.findMany({
      where: { visibility: "PUBLISHED", isNew: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: HOME_PRODUCT_SELECT,
    }),
    db.product.findMany({
      where: { visibility: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: HOME_PRODUCT_SELECT,
    }),
    db.project.findFirst({
      where: { visibility: "PUBLISHED", featured: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true },
    }),
    db.project.findFirst({
      where: { visibility: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      select: { slug: true },
    }),
  ]);

  const newProducts = flaggedNew.length > 0 ? flaggedNew : recentProducts;
  const featuredProject = flaggedProject ?? recentProject;

  const outcomes = await pageBlocks("home.outcomes");
  const outcomesHeading = blockCopy(
    outcomes, "heading", l,
    t("Don't start with a product.", "Jangan mulai dari produk."),
  );
  const outcomesIntro = blockCopy(
    outcomes, "intro", l,
    t("Most clients arrive with a campaign, a deadline and a budget — not a product code. These are the six conversations we have most often.",
      "Sebagian besar klien datang dengan kampanye, tenggat waktu, dan anggaran — bukan kode produk. Inilah enam percakapan yang paling sering kami lakukan."),
  );
  const heroImage =
    [hero.hero1?.en, hero.hero2?.en, hero.hero3?.en].find((v) => v && v.trim()) ?? null;
  const heroHeading = (l === "id" ? hero.heading?.id : hero.heading?.en) || null;

  return (
    <>
      {/* 01 — Hero. Split composition, full bleed. */}
      <section className="grid min-h-[min(88vh,780px)] border-b border-line lg:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 flex flex-col justify-center gap-7 px-gutter py-12 lg:order-1 lg:py-20">
          <div className="flex items-center gap-3">
            <span className="h-0.5 w-10 bg-red" aria-hidden />
            <Eyebrow>
              {t("Strategic Merchandising Partner", "Mitra Merchandising Strategis")}
            </Eyebrow>
          </div>

          <h1 className="balance text-mega font-bold tracked-tight">
            {heroHeading ? (
              <span className="block">{heroHeading}</span>
            ) : (
              <>
                <span className="block">
                  {t("More Than Gifts.", "Lebih Dari Sekadar Hadiah.")}
                </span>
                <span className="block font-editorial text-red italic font-normal">
                  {t("We Craft Brand Stories.", "Kami Merangkai Cerita Merek.")}
                </span>
              </>
            )}
          </h1>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
            {[
              t("Strategy", "Strategi"),
              t("Design", "Desain"),
              t("Sourcing", "Pengadaan"),
              t("Production", "Produksi"),
            ].map((d, i, arr) => (
              <li key={d} className="flex items-center gap-5">
                {d}
                {i < arr.length - 1 && <span className="text-red" aria-hidden>·</span>}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button href={path("/our-work")}>
              {t("Explore Our Work", "Lihat Karya Kami")}
            </Button>
            <Button href={path("/start-a-project")} variant="ghost">
              {t("Start a Project", "Mulai Proyek")}
            </Button>
          </div>
        </div>

        <div className="order-1 min-h-[46vh] lg:order-2 lg:min-h-0">
          <Plate
            tone="dark"
            ratio="auto"
            priority
            publicId={heroImage}
            alt=""
            sizes="(min-width: 1024px) 50vw, 100vw"
            caption="Hero — rotating: custom gift set, packaging detail, event merchandise, production floor"
            className="h-full min-h-[46vh] lg:min-h-full"
          />
        </div>
      </section>

      {/* 02 — Don't start with a product. Large type + six outcome cards. */}
      <Section>
        <Wrap>
          <SectionHead
            eyebrow={t("Where to begin", "Mulai dari mana")}
            title={
              <>
                {outcomesHeading}
                <br />
                <span className="font-editorial italic font-normal text-muted">
                  {t(
                    "Start with what you want it to achieve.",
                    "Mulai dari apa yang ingin dicapai.",
                  )}
                </span>
              </>
            }
            intro={outcomesIntro}
          />

          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {OUTCOMES.map((o) => (
              <li key={o.slug} className="bg-paper">
                <a
                  href={path(`/ideas/purpose/${o.slug}`)}
                  className="group flex h-full flex-col transition-colors hover:bg-warm"
                >
                  <Plate
                    ratio="4 / 2.6"
                    caption={o.shot}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="flex flex-1 flex-col gap-2 px-6 pt-5 pb-7">
                    <h3 className="text-[1.0625rem] font-bold uppercase tracking-[0.02em] transition-colors group-hover:text-red">
                      {t(o.titleEn, o.titleId)}
                    </h3>
                    <p className="text-[0.8125rem] text-muted">
                      {t(o.subEn, o.subId)}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* 03 — Idea Library preview. Asymmetric collage that breaks the grid. */}
      <Section tone="warm">
        <Wrap>
          <SectionHead
            eyebrow={t("The Idea Library", "Pustaka Ide")}
            title={t("Ideas worth branding.", "Ide yang layak dijadikan merek.")}
            intro={t(
              "Not a catalogue. A working set of starting points — browsable by product, by purpose, by industry, or by budget.",
              "Bukan katalog. Kumpulan titik awal — dapat ditelusuri berdasarkan produk, tujuan, industri, atau anggaran.",
            )}
            action={
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <ArrowLink href={path("/ideas")}>
                  {t("Explore the Idea Library", "Jelajahi Pustaka Ide")}
                </ArrowLink>
                {/* FR-13.6 — surfaced within the Ideas section rather than
                    given a band of its own: collections are a way into the
                    library, not a competing destination. */}
                {hasConcepts && (
                  <ArrowLink href={path("/ideas/concepts")}>
                    {t("See Concept Collections", "Lihat Koleksi Konsep")}
                  </ArrowLink>
                )}
              </div>
            }
          />

          <div className="grid grid-cols-12 gap-3 md:gap-5">
            <div className="col-span-12 md:col-span-6">
              <Plate
                ratio="4 / 3.4"
                caption="Portable electric cooking pot, lifestyle context"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <Plate ratio="3 / 3.2" caption="NFC luggage tag, macro" sizes="25vw" />
            </div>
            <div className="col-span-6 md:col-span-3">
              <Plate ratio="3 / 3.2" caption="Bamboo desk set, top-down" sizes="25vw" />
            </div>
            <div className="col-span-12 md:col-span-6 md:col-start-7">
              <Plate
                ratio="16 / 6.4"
                caption="Wide lifestyle — merchandise in the field"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            {/* Deliberately breaks the grid — FR-2.4. */}
            <div className="col-span-12 md:col-span-5 md:col-start-3 md:-mt-16">
              <Plate
                tone="dark"
                ratio="4 / 3"
                caption="Feature product — breaks the grid deliberately"
                sizes="(min-width: 768px) 42vw, 100vw"
                className="md:shadow-[0_24px_60px_rgba(15,12,13,0.16)]"
              />
            </div>
          </div>
        </Wrap>
      </Section>

      {/* 04 — Featured project. Full-width, dark. Rendered only when a
          published project exists: an empty database is a normal starting
          state, and a band linking nowhere is worse than one absent band. */}
      {featuredProject && (
      <section className="grid min-h-[560px] bg-ink text-warm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[42vh] lg:min-h-0">
          <Plate
            tone="red"
            ratio="auto"
            sizes="(min-width: 1024px) 55vw, 100vw"
            caption="Foldable printed bags in public use across the city"
            className="h-full min-h-[42vh] lg:min-h-full"
          />
        </div>
        <div className="flex flex-col justify-center gap-6 px-gutter py-12 lg:py-16">
          <Eyebrow className="text-plate-c">
            {t(
              "Our Work — Pakuwon, Urban Sport Digital Game",
              "Karya Kami — Pakuwon, Urban Sport Digital Game",
            )}
          </Eyebrow>
          <h2 className="balance text-xl-display font-bold tracked-tight text-paper">
            {t("Breaking the Tumbler Trap", "Keluar dari Jebakan Tumbler")}
          </h2>
          <blockquote className="max-w-[46ch] border-l-2 border-red pl-5 font-editorial text-lede italic text-plate-a">
            {t(
              "The budget would only buy a poor tumbler. So we proposed a fully printed foldable bag instead — same money, far more use, and branding that stayed visible long after the event closed.",
              "Anggaran hanya cukup untuk tumbler berkualitas rendah. Maka kami mengusulkan tas lipat bercetak penuh — biaya sama, manfaat jauh lebih besar, dan merek tetap terlihat lama setelah acara usai.",
            )}
          </blockquote>
          <dl className="flex flex-wrap gap-10 pt-2">
            {[
              { v: "1,500", l: t("Units delivered", "Unit dikirim") },
              { v: "Rp 15K", l: t("Budget per piece", "Anggaran per unit") },
              { v: "0", l: t("Forgotten tumblers", "Tumbler terlupakan") },
            ].map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd>
                  <span className="block text-3xl font-bold tracked-tight tabular-nums text-paper">
                    {s.v}
                  </span>
                  <span className="text-[0.625rem] uppercase tracking-[0.15em] text-muted">
                    {s.l}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <Button
            href={path(`/our-work/${featuredProject.slug}`)}
            variant="onDark"
            className="self-start"
          >
            {t("Read the full story", "Baca cerita lengkap")}
          </Button>
        </div>
      </section>
      )}

      {/* Custom Made + Ready Stock teasers.
          The revision brief asks for small previews, not more full sections
          (§15): Custom Made earns visible presence, Ready Stock is a one-line
          prompt. Paired side by side so together they occupy one band rather
          than lengthening the page by two. */}
      <Section className="py-10 md:py-14">
        <Wrap>
          <div className="grid gap-px border border-line bg-line lg:grid-cols-[1.4fr_1fr]">
            <a
              href={path("/custom-made")}
              className="group flex flex-col gap-4 bg-paper p-8 transition-colors hover:bg-warm md:p-12"
            >
              <Eyebrow accent>{t("Custom Made", "Dibuat Khusus")}</Eyebrow>
              <h2 className="balance max-w-[20ch] text-lg-display font-bold tracked-tight transition-colors group-hover:text-red">
                {t(
                  "Made for your brand. Not picked from a catalogue.",
                  "Dibuat untuk merek Anda. Bukan dipilih dari katalog.",
                )}
              </h2>
              <p className="max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">
                {t(
                  "Bags, textiles, plush, silicone, apparel and packaging — developed from scratch around an idea rather than selected from stock.",
                  "Tas, tekstil, plush, silikon, pakaian, dan kemasan — dikembangkan dari nol berdasarkan ide, bukan dipilih dari stok.",
                )}
              </p>
              <span className="mt-auto pt-2 font-display text-xs font-semibold uppercase tracking-[0.13em] text-red">
                {t("See what we can make", "Lihat yang bisa kami buat")}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </a>

            <a
              href={path("/ideas/ready-stock/all")}
              className="group flex flex-col gap-3 bg-paper p-8 transition-colors hover:bg-warm md:p-12"
            >
              <Eyebrow accent>{t("Need it fast?", "Butuh cepat?")}</Eyebrow>
              <h2 className="text-md-display font-semibold transition-colors group-hover:text-red">
                {t("Ready when you are.", "Siap saat Anda siap.")}
              </h2>
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                {t(
                  "Merchandise already in our warehouse, ready for customisation and rush deadlines.",
                  "Merchandise yang sudah ada di gudang kami, siap dikustomisasi untuk tenggat mendesak.",
                )}
              </p>
              <span className="mt-auto pt-2 font-display text-xs font-semibold uppercase tracking-[0.13em] text-red">
                {t("Explore Ready Stock", "Jelajahi Stok Siap")}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </a>
          </div>
        </Wrap>
      </Section>

      {/* 05 — Category navigation. Clean, structured, no imagery. */}
      <Section className="pb-0">
        <Wrap className="mb-8">
          <Eyebrow accent>
            {t("Browse by product", "Telusuri berdasarkan produk")}
          </Eyebrow>
        </Wrap>
        <ul className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {PRODUCT_CATEGORIES.map((c) => (
            <li key={c.slug} className="bg-paper">
              <a
                href={path(`/ideas/product/${c.slug}`)}
                className="group flex h-full min-h-[118px] flex-col justify-between gap-1 p-5 transition-colors hover:bg-red"
              >
                <span className="text-[0.9375rem] font-semibold transition-colors group-hover:text-paper">
                  {t(c.en, c.id)}
                </span>
                <span className="text-[0.625rem] uppercase tracking-[0.14em] tabular-nums text-muted transition-colors group-hover:text-paper">
                  {c.count}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* 06 — Split editorial story. The process, on warm ground. */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[40vh] lg:min-h-[460px]">
          <Plate
            ratio="auto"
            sizes="(min-width: 1024px) 50vw, 100vw"
            caption="Studio — design review, mockups on the table"
            className="h-full min-h-[40vh] lg:min-h-full"
          />
        </div>
        <div className="flex flex-col justify-center gap-6 bg-warm px-gutter py-12 lg:py-20">
          <Eyebrow accent>{t("How we work", "Cara kami bekerja")}</Eyebrow>
          <h2 className="balance text-lg-display font-bold tracked-tight">
            {t(
              "Our real product is the process. The merchandise is what comes out of it.",
              "Produk kami yang sesungguhnya adalah prosesnya. Merchandise adalah hasilnya.",
            )}
          </h2>
          {/* Numbered because the process genuinely is a sequence — the
              stages happen in this order and the order carries meaning. */}
          <ol className="flex flex-col">
            {PROCESS.map((s, i) => (
              <li
                key={s.en}
                className={`grid grid-cols-[2.6rem_1fr] items-baseline gap-4 border-t border-line py-4 ${
                  i === PROCESS.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="text-[0.6875rem] font-bold tracking-[0.1em] tabular-nums text-red">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[0.9375rem] font-semibold">
                    {t(s.en, s.id)}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] text-muted">
                    {t(s.descEn, s.descId)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          {/* FR-14.6 — anchored to the section itself. Landing at the top of
              What We Do and expecting the visitor to find it is how a teaser
              stops teasing anything in particular. */}
          <ArrowLink
            href={`${path("/what-we-do")}#from-idea-to-reality`}
            className="self-start"
          >
            {t(
              "From idea to reality — see how we make it happen",
              "Dari ide ke kenyataan — lihat bagaimana kami mewujudkannya",
            )}
          </ArrowLink>
        </div>
      </section>

      {/* FR-2.14 — the proof band, placed after the featured project so it
          reads as corroboration of work just shown rather than a claim made
          before anything has been demonstrated. */}
      <ClientLogos
        clients={clients}
        heading={t("Trusted by", "Dipercaya oleh")}
      />

      {/* 07 — New products. Horizontal rail. */}
      <Section>
        <Wrap>
          <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-lg-display font-bold tracked-tight">
              {t("New discoveries", "Temuan terbaru")}
            </h2>
            <ArrowLink href={path("/ideas")}>{t("See all", "Lihat semua")}</ArrowLink>
          </div>
          {/* FR-2.8, FR-10.6 — real catalogue entries, not a fixed list. The
              product editor offers "Show in New discoveries"; before this the
              tick did nothing and the rail named five products that were not
              necessarily in the catalogue at all. */}
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {newProducts.map((product) => (
              <li
                key={product.slug}
                className="w-[clamp(230px,26vw,320px)] shrink-0 snap-start"
              >
                <ProductCard product={product} locale={l} sizes="300px" />
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* 08 — Behind the scenes. Large production photography, overlaid. */}
      <section className="relative grid min-h-[clamp(400px,56vw,620px)]">
        <Plate
          tone="dark"
          ratio="auto"
          sizes="100vw"
          caption="Production floor — UV printing, engraving, QC bench"
          className="absolute inset-0 h-full"
        />
        <div className="relative z-2 flex max-w-[640px] flex-col gap-4 self-end px-gutter py-12 lg:py-16">
          <Eyebrow className="text-red">
            {t("Behind the scenes", "Di balik layar")}
          </Eyebrow>
          <h2 className="balance text-lg-display font-bold tracked-tight text-warm">
            {t(
              "In-house machines for the rush. Trusted factories for the scale.",
              "Mesin sendiri untuk pesanan kilat. Pabrik tepercaya untuk skala besar.",
            )}
          </h2>
          <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-plate-c">
            {t(
              "UV, DTF, sublimation and engraving run under our own roof, so a small run does not wait in a queue. Beyond that we bridge to local production and global sourcing — which is how a rush order ships in five days and a large campaign still lands on time.",
              "UV, DTF, sublimasi, dan gravir berjalan di tempat kami sendiri, sehingga pesanan kecil tidak perlu mengantre. Selebihnya kami menjembatani produksi lokal dan pengadaan global — itulah sebabnya pesanan kilat terkirim dalam lima hari dan kampanye besar tetap tepat waktu.",
            )}
          </p>
        </div>
      </section>

      {/* 09 — Insights. Editorial cards. */}
      <Section tone="warm">
        <Wrap>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Eyebrow accent>{t("Ideas & Insights", "Ide & Wawasan")}</Eyebrow>
              <h2 className="text-lg-display font-bold tracked-tight">
                {t("What we are watching.", "Yang sedang kami amati.")}
              </h2>
            </div>
            <ArrowLink href={path("/insights")}>
              {t("All insights", "Semua wawasan")}
            </ArrowLink>
          </div>
          <ul className="grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              {
                cat: t("Gifting Strategy", "Strategi Hadiah"),
                title: t(
                  "Why your company doesn't need another tumbler",
                  "Mengapa perusahaan Anda tidak butuh tumbler lagi",
                ),
                shot: "Editorial — material samples",
              },
              {
                cat: t("Ideas & Trends", "Ide & Tren"),
                title: t(
                  "What NFC merchandise actually does for a campaign",
                  "Apa yang sebenarnya dilakukan merchandise NFC",
                ),
                shot: "Editorial — NFC chip in production",
              },
              {
                cat: t("Behind the Making", "Di Balik Pembuatan"),
                title: t(
                  "Five days from brief to delivery: how rush orders really run",
                  "Lima hari dari brief ke pengiriman",
                ),
                shot: "Editorial — factory visit",
              },
            ].map((a) => (
              <li key={a.title}>
                <a href={path("/insights")} className="group flex flex-col gap-3">
                  <Plate
                    ratio="16 / 9.5"
                    caption={a.shot}
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <span className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-red">
                    {a.cat}
                  </span>
                  <h3 className="text-[1.0625rem] font-semibold leading-snug transition-colors group-hover:text-red">
                    {a.title}
                  </h3>
                </a>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* 10 — Closing CTA. Red band. */}
      <section className="bg-red py-14 text-paper md:py-24">
        <Wrap className="flex flex-col items-start gap-8">
          <h2 className="balance text-mega font-bold tracked-tight">
            {t(
              "Your campaign deserves more than generic.",
              "Kampanye Anda layak mendapat lebih dari sekadar generik.",
            )}
          </h2>
          <p className="max-w-[48ch] font-editorial text-lede italic text-paper/85">
            {t(
              "Tell us the problem, the budget or the deadline. We will work out what to make.",
              "Sampaikan masalah, anggaran, atau tenggat waktunya. Kami yang akan menentukan apa yang harus dibuat.",
            )}
          </p>
          <Button href={path("/start-a-project")} variant="onRed">
            {t("Let's Create Something.", "Mari Ciptakan Sesuatu.")}
          </Button>
        </Wrap>
      </section>
    </>
  );
}
