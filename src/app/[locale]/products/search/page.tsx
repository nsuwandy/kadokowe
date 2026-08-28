import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { ArrowLink } from "@/components/ui/Button";
import { SearchBox } from "@/components/SearchBox";
import { ProductCard } from "@/components/ProductCard";
import { AxisBar } from "@/components/AxisBar";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Search",
  // A search result page has nothing durable to index.
  robots: { index: false, follow: true },
};

const PRODUCT_SELECT = {
  slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
  tagsEn: true, tagsId: true, heroImage: true, availability: true,
} as const;

/**
 * Product Library search — FR-3.7, FR-11.7.
 *
 * Matches across names, short lines, "Why We Like It", material and tags in
 * both languages. Searching only the current language would make half the
 * catalogue unfindable for an Indonesian visitor while translations are still
 * being written, which is the normal state for a while yet.
 *
 * FR-3.12's type-ahead is Phase 2; this is the Phase 1a requirement.
 */
export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/[locale]/products/search">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const sp = await searchParams;
  const q = String(sp?.q ?? "").trim();
  const page = Math.max(1, Number(sp?.page ?? 1) || 1);

  // FR-3.14 — the result set is paginated and counted separately. Taking a
  // fixed slice and reporting its length would understate a broad match: a
  // query hitting 300 products would say "60 results" and quietly hide the
  // rest, which reads as "we do not make many of these" rather than "there
  // is more to see".
  const where = q
    ? {
        visibility: "PUBLISHED" as const,
        OR: [
          { nameEn: { contains: q, mode: "insensitive" as const } },
          { nameId: { contains: q, mode: "insensitive" as const } },
          { shortEn: { contains: q, mode: "insensitive" as const } },
          { shortId: { contains: q, mode: "insensitive" as const } },
          { whyEn: { contains: q, mode: "insensitive" as const } },
          { whyId: { contains: q, mode: "insensitive" as const } },
          { material: { contains: q, mode: "insensitive" as const } },
          { tagsEn: { has: q } },
          { tagsId: { has: q } },
        ],
      }
    : null;

  const [products, total] = where
    ? await Promise.all([
        db.product.findMany({
          where,
          orderBy: [{ featured: "desc" }, { nameEn: "asc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: PRODUCT_SELECT,
        }),
        db.product.count({ where }),
      ])
    : [[], 0];

  return (
    <Section>
      <Wrap>
        <Eyebrow accent>{t("The Product Library", "Pustaka Produk")}</Eyebrow>
        <h1 className="my-3 text-xl-display font-bold tracked-tight balance">
          {q ? t(`Results for “${q}”`, `Hasil untuk “${q}”`) : t("Search", "Cari")}
        </h1>

        <div className="mt-6 mb-9 max-w-[640px]">
          <SearchBox locale={l} defaultValue={q} autoFocus={!q} />
        </div>

        <AxisBar locale={l} />

        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
          <span className="text-xs uppercase tracking-[0.1em] tabular-nums text-muted">
            {q
              ? t(
                  `${total} ${total === 1 ? "result" : "results"}`,
                  `${total} hasil`,
                )
              : t("Type something to search", "Ketik sesuatu untuk mencari")}
          </span>
          <ArrowLink href={path("/products")}>
            {t("Browse everything", "Telusuri semua")}
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
        ) : q && total > 0 ? (
          /* Past the last page. The results exist, so saying "nothing
             matched" here would be a lie the pagination below contradicts. */
          <p className="border border-dashed border-line px-6 py-16 text-center font-editorial text-lede italic text-muted">
            {t(
              "That page is past the end of the results.",
              "Halaman itu melewati akhir hasil.",
            )}
          </p>
        ) : q ? (
          /* FR-3.5's sibling concern: a dead end here loses the visitor, and
             an unmatched search is often a product we can make rather than
             one we lack. */
          <div className="border border-dashed border-line px-6 py-16 text-center">
            <p className="font-editorial text-lede italic text-muted">
              {t(
                `Nothing matched “${q}” — but that does not mean we cannot make it.`,
                `Tidak ada yang cocok dengan “${q}” — bukan berarti kami tidak bisa membuatnya.`,
              )}
            </p>
            <p className="mx-auto mt-3 max-w-[54ch] text-sm text-muted">
              {t(
                "Much of what we produce starts as a brief rather than a catalogue entry. Try browsing by purpose, or tell us what you are planning.",
                "Sebagian besar yang kami produksi bermula dari brief, bukan entri katalog. Coba telusuri berdasarkan tujuan, atau sampaikan rencana Anda.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <ArrowLink href={path("/products/purpose/corporate-gifts")}>
                {t("Browse by purpose", "Telusuri berdasarkan tujuan")}
              </ArrowLink>
              <ArrowLink href={path("/start-a-project")}>
                {t("Start a Project", "Mulai Proyek")}
              </ArrowLink>
            </div>
          </div>
        ) : null}

        {q && (
          <Pagination
            page={page}
            total={total}
            basePath={path("/products/search")}
            locale={l}
            extraParams={`q=${encodeURIComponent(q)}`}
          />
        )}
      </Wrap>
    </Section>
  );
}
