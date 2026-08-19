import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow, SectionHead } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { OUTCOMES, PROCESS, PRODUCT_CATEGORIES } from "@/content/home";

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
            <span className="block">
              {t("More Than Gifts.", "Lebih Dari Sekadar Hadiah.")}
            </span>
            <span className="block font-editorial text-red italic font-normal">
              {t("We Craft Brand Stories.", "Kami Merangkai Cerita Merek.")}
            </span>
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
                {t("Don't start with a product.", "Jangan mulai dari produk.")}
                <br />
                <span className="font-editorial italic font-normal text-muted">
                  {t(
                    "Start with what you want it to achieve.",
                    "Mulai dari apa yang ingin dicapai.",
                  )}
                </span>
              </>
            }
            intro={t(
              "Most clients arrive with a campaign, a deadline and a budget — not a product code. These are the six conversations we have most often.",
              "Sebagian besar klien datang dengan kampanye, tenggat waktu, dan anggaran — bukan kode produk. Inilah enam percakapan yang paling sering kami lakukan.",
            )}
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
              <ArrowLink href={path("/ideas")}>
                {t("Explore the Idea Library", "Jelajahi Pustaka Ide")}
              </ArrowLink>
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

      {/* 04 — Featured project. Full-width, dark. */}
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
            href={path("/our-work/breaking-the-tumbler-trap")}
            variant="onDark"
            className="self-start"
          >
            {t("Read the full story", "Baca cerita lengkap")}
          </Button>
        </div>
      </section>

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
          <ArrowLink href={path("/what-we-do")} className="self-start">
            {t("See how we make it happen", "Lihat bagaimana kami mewujudkannya")}
          </ArrowLink>
        </div>
      </section>

      {/* 07 — New products. Horizontal rail. */}
      <Section>
        <Wrap>
          <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-lg-display font-bold tracked-tight">
              {t("New discoveries", "Temuan terbaru")}
            </h2>
            <ArrowLink href={path("/ideas")}>{t("See all", "Lihat semua")}</ArrowLink>
          </div>
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {[
              ["Insulated Takeaway Bag", "Tas Bawa Pulang Berinsulasi"],
              ["Cold DTF Jacket", "Jaket Cold DTF"],
              ["Smart Series Organiser", "Organiser Seri Pintar"],
              ["Silicone Keychain", "Gantungan Kunci Silikon"],
              ["3-in-1 Ballpoint", "Pulpen 3-in-1"],
            ].map(([en, id]) => (
              <li
                key={en}
                className="w-[clamp(230px,26vw,320px)] shrink-0 snap-start"
              >
                <Plate ratio="3 / 3.4" caption={en} sizes="300px" />
                <p className="mt-3 text-base font-semibold">{t(en, id)}</p>
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
