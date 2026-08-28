import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { db } from "@/lib/db";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { ArrowLink } from "@/components/ui/Button";
import { AxisBar } from "@/components/AxisBar";
import { SearchBox } from "@/components/SearchBox";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { ProductCard } from "@/components/ProductCard";
import { AXIS_KEYS } from "@/content/taxonomy";
import { getAllAxes, axisLabel } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "The Idea Library",
  description:
    "Not a catalogue — a working set of starting points. Browse merchandise ideas by product, purpose, industry or budget.",
};

export default async function IdeasPage({
  params,
  searchParams,
}: PageProps<"/[locale]/ideas">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page ?? 1) || 1);
  // One wave, not two. The browse terms and the product page do not depend on
  // each other, so awaiting them in sequence spent two round trips where one
  // would do — which is invisible next to a local database and very much not
  // invisible when the database is on another continent.
  const [axes, products, totalProducts] = await Promise.all([
    getAllAxes(l),
    db.product.findMany({
    where: { visibility: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      slug: true,
      nameEn: true,
      nameId: true,
      shortEn: true,
      shortId: true,
      tagsEn: true,
      tagsId: true,
      heroImage: true,
      availability: true,
    },
    }),
    db.product.count({ where: { visibility: "PUBLISHED" } }),
  ]);

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <Eyebrow accent>{t("The Idea Library", "Pustaka Ide")}</Eyebrow>
          <h1 className="my-3 text-xl-display font-bold tracked-tight balance">
            {t("Explore possibilities.", "Jelajahi kemungkinan.")}
          </h1>
          <p className="mb-10 max-w-[60ch] font-editorial text-lede">
            {t(
              "Four ways in. Come with a product in mind, or come with nothing but an event and a budget — both routes work.",
              "Empat cara masuk. Datang dengan produk di benak Anda, atau hanya dengan acara dan anggaran — keduanya bisa.",
            )}
          </p>

          {/* FR-3.7 — search sits above the axes: a visitor who already knows
              the word for what they want should not have to pick an axis first. */}
          <div className="mb-7 max-w-[640px]">
            <SearchBox locale={l} />
          </div>

          <AxisBar locale={l} />

          {/* FR-3.16 — Ready Stock is a view, not a fifth axis. Availability
              is a product field; giving it equal billing with the four browse
              axes would misrepresent how the library is organised. */}
          <Link
            href={path("/ideas/ready-stock/all")}
            className="group mb-10 flex flex-wrap items-center justify-between gap-4 border border-line bg-warm px-6 py-5 transition-colors hover:border-red"
          >
            <span className="flex flex-col gap-1">
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-red">
                {t("Need it fast?", "Butuh cepat?")}
              </span>
              <span className="text-[0.9375rem]">
                {t(
                  "Explore merchandise already available locally and ready for customisation.",
                  "Jelajahi merchandise yang sudah tersedia secara lokal dan siap dikustomisasi.",
                )}
              </span>
            </span>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.13em] text-red">
              {t("Explore Ready Stock", "Jelajahi Stok Siap")}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>

          {/* Entry points for every axis, so no axis is subordinated (FR-3.6). */}
          <div className="mb-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {AXIS_KEYS.map((key) => {
              const terms = axes[key];
              if (terms.length === 0) return null;
              return (
                <div key={key} className="flex flex-col gap-3 bg-paper p-6">
                  <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red">
                    {axisLabel(key, l)}
                  </h2>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {terms.slice(0, 6).map((term) => (
                      <li key={term.slug}>
                        <Link
                          href={path(`/ideas/${key}/${term.slug}`)}
                          className="text-[0.8125rem] text-muted transition-colors hover:text-ink"
                        >
                          {term.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <ArrowLink
                    href={path(`/ideas/${key}/${terms[0].slug}`)}
                    className="mt-auto pt-2"
                  >
                    {t("Browse", "Telusuri")}
                  </ArrowLink>
                </div>
              );
            })}
          </div>

          {/* FR-3.5 — indicative pricing must be stated wherever budget appears. */}
          <p className="mb-9 max-w-[74ch] border-l-2 border-red bg-warm px-5 py-4 text-[0.8125rem] text-muted">
            {t(
              "Budget ranges are indicative only. Final pricing depends on quantity, branding, customisation, packaging and lead time — which is why we quote rather than list.",
              "Rentang anggaran hanya bersifat indikatif. Harga akhir bergantung pada kuantitas, branding, kustomisasi, kemasan, dan waktu pengerjaan — itulah sebabnya kami memberi penawaran, bukan daftar harga.",
            )}
          </p>

          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
            <span className="text-xs uppercase tracking-[0.1em] tabular-nums text-muted">
              {totalProducts > 0
                ? t(
                    `${totalProducts} ideas`,
                    `${totalProducts} ide`,
                  )
                : t("Catalogue in preparation", "Katalog sedang disiapkan")}
            </span>
            <ArrowLink href={path("/start-a-project")}>
              {t(
                "Can't find it? Ask us to develop it",
                "Tidak menemukannya? Minta kami mengembangkannya",
              )}
            </ArrowLink>
          </div>

          {products.length > 0 ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <li key={p.slug} className={i % 7 === 4 ? "col-span-2" : ""}>
                  <ProductCard product={p} locale={l} wide={i % 7 === 4} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCatalogue locale={l} />
          )}

          <Pagination
            page={page}
            total={totalProducts}
            basePath={path("/ideas")}
            locale={l}
          />
        </Wrap>
      </Section>

      {/* Idea Board is Phase 2 — shown here as a signposted next step rather
          than a dead control, so the page explains where it is going. */}
      <Section>
        <Wrap>
          <div className="flex flex-col items-start gap-5 bg-warm p-8 md:p-14">
            <Eyebrow accent>{t("Coming next", "Segera hadir")}</Eyebrow>
            <h2 className="max-w-[22ch] text-lg-display font-bold tracked-tight">
              {t(
                "Collect what interests you. Then hand it to us.",
                "Kumpulkan yang menarik bagi Anda. Lalu serahkan kepada kami.",
              )}
            </h2>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {t(
                "Products will be saveable to a named Idea Board and submitted as a single brief. It replaces the shopping cart entirely: no totals, no checkout, just a conversation starter.",
                "Produk akan dapat disimpan ke Papan Ide bernama dan dikirim sebagai satu brief. Ini menggantikan keranjang belanja sepenuhnya: tanpa total, tanpa checkout, hanya pembuka percakapan.",
              )}
            </p>
          </div>
        </Wrap>
      </Section>
    </>
  );
}

/**
 * The catalogue is seeded after launch content is written, so an empty state
 * is a real condition during build-out — not a theoretical one.
 */
function EmptyCatalogue({ locale }: { locale: AppLocale }) {
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="font-editorial text-lede italic text-muted">
        {t(
          "The Idea Library is being prepared.",
          "Pustaka Ide sedang disiapkan.",
        )}
      </p>
      <p className="mx-auto mt-3 max-w-[52ch] text-[0.875rem] text-muted">
        {t(
          "In the meantime, tell us what you are planning and we will come back with options.",
          "Sementara itu, sampaikan rencana Anda dan kami akan kembali dengan pilihan.",
        )}
      </p>
      <ArrowLink
        href={localePath("/start-a-project", locale)}
        className="mt-6 justify-center"
      >
        {t("Start a Project", "Mulai Proyek")}
      </ArrowLink>
    </div>
  );
}
