import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { ArrowLink } from "@/components/ui/Button";
import { AxisBar, TermChips } from "@/components/AxisBar";
import { ProductCard } from "@/components/ProductCard";
import { AXES, isAxisKey, type AxisKey } from "@/content/taxonomy";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";

/**
 * Axis-filtered Idea Library view — /ideas/{axis}/{term}.
 *
 * A shareable, indexable URL per filtered view (FR-3.11). Position one is the
 * axis here and a product slug one level up; see the note in the sibling
 * route.
 *
 * `ready-stock` is handled as a pseudo-axis so FR-3.16 gets a real URL
 * (/ideas/ready-stock/all) without inventing a fifth taxonomy — availability
 * is a product field, not a browse axis.
 */

const AXIS_TO_ENUM = {
  product: "PRODUCT",
  purpose: "PURPOSE",
  industry: "INDUSTRY",
  budget: "BUDGET",
} as const;

const PRODUCT_SELECT = {
  slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
  tagsEn: true, tagsId: true, heroImage: true, availability: true,
} as const;

function readyStockCopy(l: AppLocale) {
  return l === "id"
    ? {
        eyebrow: "Stok Siap",
        title: "Siap saat Anda siap.",
        intro:
          "Merchandise pilihan yang sudah tersedia di gudang lokal kami, siap untuk kustomisasi cepat dan kebutuhan mendesak.",
      }
    : {
        eyebrow: "Ready Stock",
        title: "Ready when you are.",
        intro:
          "Curated merchandise already available locally, ready for faster customisation and rush requirements.",
      };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ideas/[segment]/[term]">): Promise<Metadata> {
  const { locale, segment } = await params;
  if (!isLocale(locale)) return {};
  const l = locale as AppLocale;
  if (segment === "ready-stock") {
    const c = readyStockCopy(l);
    return { title: c.eyebrow, description: c.intro };
  }
  if (!isAxisKey(segment)) return {};
  const axis = AXES[segment];
  return { title: l === "id" ? axis.id : axis.en };
}

export default async function FilteredIdeasPage({
  params,
  searchParams,
}: PageProps<"/[locale]/ideas/[segment]/[term]">) {
  const { locale, segment, term } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page ?? 1) || 1);
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const isReadyStock = segment === "ready-stock";
  if (!isReadyStock && !isAxisKey(segment)) notFound();

  let products;
  let total = 0;
  let heading: { eyebrow: string; title: string; intro?: string };

  if (isReadyStock) {
    const c = readyStockCopy(l);
    heading = c;
    const where = { visibility: "PUBLISHED", availability: "READY_STOCK" } as const;
    [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: [{ featured: "desc" }, { nameEn: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: PRODUCT_SELECT,
      }),
      db.product.count({ where }),
    ]);
  } else {
    const axisKey = segment as AxisKey;
    const record = await db.taxonomyTerm.findFirst({
      where: { axis: AXIS_TO_ENUM[axisKey], slugEn: term },
    });
    if (!record) notFound();

    heading = {
      eyebrow: l === "id" ? AXES[axisKey].id : AXES[axisKey].en,
      title: pick(record, "name", l),
    };
    const where = {
      visibility: "PUBLISHED",
      terms: { some: { id: record.id } },
    } as const;
    [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: [{ featured: "desc" }, { nameEn: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: PRODUCT_SELECT,
      }),
      db.product.count({ where }),
    ]);
  }

  return (
    <Section>
      <Wrap>
        <Eyebrow accent>{heading.eyebrow}</Eyebrow>
        <h1 className="my-3 text-xl-display font-bold tracked-tight balance">
          {heading.title}
        </h1>
        {heading.intro && (
          <p className="mb-8 max-w-[60ch] font-editorial text-lede">
            {heading.intro}
          </p>
        )}

        <div className="mt-8">
          <AxisBar active={isReadyStock ? undefined : (segment as AxisKey)} locale={l} />
          {!isReadyStock && (
            <TermChips axis={segment as AxisKey} activeSlug={term} locale={l} />
          )}
        </div>

        {/* FR-3.5 — indicative pricing stated wherever budget is in play. */}
        {segment === "budget" && (
          <p className="mb-8 max-w-[74ch] border-l-2 border-red bg-warm px-5 py-4 text-[0.8125rem] text-muted">
            {t(
              "Budget ranges are indicative only. Final pricing depends on quantity, branding, customisation, packaging and lead time — which is why we quote rather than list.",
              "Rentang anggaran hanya bersifat indikatif. Harga akhir bergantung pada kuantitas, branding, kustomisasi, kemasan, dan waktu pengerjaan — itulah sebabnya kami memberi penawaran, bukan daftar harga.",
            )}
          </p>
        )}

        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
          <span className="text-xs uppercase tracking-[0.1em] tabular-nums text-muted">
            {t(
              `${total} ${total === 1 ? "idea" : "ideas"}`,
              `${total} ide`,
            )}
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
          /* A thin filter result is the failure mode SRS §7.2 warns about:
             a visitor concludes the site is broken, not that the catalogue is
             young. Saying so plainly, with a route onward, is the mitigation
             until the launch catalogue is loaded. */
          <div className="border border-dashed border-line px-6 py-16 text-center">
            <p className="font-editorial text-lede italic text-muted">
              {t(
                "Nothing here yet — but that does not mean we cannot make it.",
                "Belum ada di sini — bukan berarti kami tidak bisa membuatnya.",
              )}
            </p>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-muted">
              {t(
                "Most of what we produce starts as a brief rather than a catalogue entry. Tell us what you are planning.",
                "Sebagian besar yang kami produksi bermula dari brief, bukan dari entri katalog. Sampaikan rencana Anda.",
              )}
            </p>
            <ArrowLink
              href={path("/start-a-project")}
              className="mt-6 justify-center"
            >
              {t("Start a Project", "Mulai Proyek")}
            </ArrowLink>
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          basePath={path(`/ideas/${segment}/${term}`)}
          locale={l}
        />
      </Wrap>
    </Section>
  );
}
