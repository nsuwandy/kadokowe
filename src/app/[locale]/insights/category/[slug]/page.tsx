import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { livePublished } from "@/lib/articles";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Plate } from "@/components/ui/Plate";
import { ArrowLink } from "@/components/ui/Button";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { CATEGORIES, categoryBySlug, categoryLabel } from "@/content/insights";
import type { ArticleCategory } from "@/generated/prisma/enums";

/**
 * Revalidated hourly so scheduling actually takes effect — FR-8.5.
 *
 * These pages are prerendered, so without this an article scheduled for
 * Tuesday would sit invisible until the next deploy. An hour is the coarsest
 * granularity that still makes "schedule it for tomorrow morning" behave the
 * way the operator means it, and it keeps the pages static for almost every
 * request rather than rendering each one on demand.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  return CATEGORIES.flatMap((c) =>
    ["en", "id"].map((locale) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/insights/category/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = categoryBySlug(slug);
  if (!isLocale(locale) || !category) return {};
  const l = locale as AppLocale;
  return {
    title: l === "id" ? category.id : category.en,
    description: l === "id" ? category.descId : category.descEn,
  };
}

/** Category-filtered Insights — FR-8.2. */
export default async function InsightsCategoryPage({
  params,
}: PageProps<"/[locale]/insights/category/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const articles = await db.article.findMany({
    where: {
      ...livePublished(),
      category: category.key as ArticleCategory,
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <ArrowLink href={path("/insights")} className="mb-8">
            {t("All insights", "Semua wawasan")}
          </ArrowLink>

          <Eyebrow accent>{t("Insights", "Wawasan")}</Eyebrow>
          <h1 className="my-3 text-xl-display font-bold tracked-tight balance">
            {l === "id" ? category.id : category.en}
          </h1>
          <p className="mb-10 max-w-[58ch] font-editorial text-lede">
            {l === "id" ? category.descId : category.descEn}
          </p>

          <nav
            aria-label={t("Categories", "Kategori")}
            className="mb-12 flex flex-wrap gap-2 border-y border-line py-5"
          >
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={path(`/insights/category/${c.slug}`)}
                aria-current={c.slug === slug ? "page" : undefined}
                className={
                  c.slug === slug
                    ? "border border-red bg-red px-4 py-2.5 text-xs font-semibold text-paper"
                    : "border border-line px-4 py-2.5 text-xs font-semibold transition-colors hover:border-ink"
                }
              >
                {l === "id" ? c.id : c.en}
              </Link>
            ))}
          </nav>

          {articles.length === 0 ? (
            <p className="border border-dashed border-line px-6 py-16 text-center font-editorial text-lede italic text-muted">
              {t(
                "Nothing published in this category yet.",
                "Belum ada tulisan di kategori ini.",
              )}
            </p>
          ) : (
            <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={path(`/insights/${a.slug}`)}
                    className="group flex flex-col gap-4"
                  >
                    <Plate
                      publicId={a.heroImage}
                      alt={pick(a, "title", l)}
                      caption={pick(a, "title", l)}
                      ratio="16 / 9.5"
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                    />
                    <span className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-red">
                      {categoryLabel(a.category, l)}
                    </span>
                    <h2 className="text-md-display font-semibold transition-colors group-hover:text-red">
                      {pick(a, "title", l)}
                    </h2>
                    {pickOptional(a, "excerpt", l) && (
                      <p className="text-[0.875rem] leading-snug text-muted">
                        {pick(a, "excerpt", l)}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <NewsletterSignup locale={l} sourcePage={`/insights/category/${slug}`} />
        </Wrap>
      </Section>
    </>
  );
}
