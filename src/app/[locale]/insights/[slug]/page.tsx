import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { categoryLabel } from "@/content/insights";

async function getArticle(slug: string) {
  return db.article.findFirst({
    where: { slug, visibility: "PUBLISHED" },
    include: {
      projects: {
        where: { visibility: "PUBLISHED" },
        select: {
          slug: true, titleEn: true, titleId: true, client: true,
          summaryEn: true, summaryId: true, heroImage: true,
        },
      },
      products: {
        where: { visibility: "PUBLISHED" },
        select: {
          slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
          tagsEn: true, tagsId: true, heroImage: true, availability: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/insights/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await getArticle(slug);
  if (!article) return {};
  const l = locale as AppLocale;
  return {
    title: pick(article, "seoTitle", l) || pick(article, "title", l),
    description: pick(article, "seoDesc", l) || pick(article, "excerpt", l),
  };
}

export async function generateStaticParams() {
  const articles = await db.article.findMany({
    where: { visibility: "PUBLISHED" },
    select: { slug: true },
  });
  return articles.flatMap((a) =>
    ["en", "id"].map((locale) => ({ locale, slug: a.slug })),
  );
}

/**
 * Article — FR-8.3, FR-8.8.
 *
 * The three cross-link blocks at the foot are a template pattern, not a
 * per-article decision: See It In Action, Explore Alternative Ideas, Have a
 * Similar Challenge. Each renders only when its relationship is populated,
 * so the route from reading to enquiring exists on every article by
 * construction rather than when someone remembers to add it.
 *
 * This is the mechanism by which editorial content converts. Leaving it to
 * the author would mean the articles that most deserve a route onward — the
 * ones written in a hurry — are the ones that lack it.
 */
export default async function ArticlePage({
  params,
}: PageProps<"/[locale]/insights/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const article = await getArticle(slug);
  if (!article) notFound();

  const title = pick(article, "title", l);
  const excerpt = pickOptional(article, "excerpt", l);
  const body = pickOptional(article, "body", l);

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <ArrowLink href={path("/insights")} className="mb-8">
            {t("Back to Insights", "Kembali ke Wawasan")}
          </ArrowLink>

          <div className="mx-auto max-w-[820px]">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
              {categoryLabel(article.category, l)}
            </span>
            <h1 className="balance mt-3 mb-5 text-xl-display font-bold tracked-tight">
              {title}
            </h1>
            {excerpt && (
              <p className="mb-8 font-editorial text-lede italic text-muted">
                {excerpt}
              </p>
            )}
          </div>

          <Plate
            publicId={article.heroImage}
            alt={title}
            caption={title}
            ratio="16 / 8"
            sizes="100vw"
            priority
          />

          <div className="mx-auto mt-10 max-w-[68ch]">
            {body ? (
              body.split("\n\n").map((para, i) => (
                <p key={i} className="mb-5 text-[1.0625rem] leading-relaxed">
                  {para}
                </p>
              ))
            ) : (
              <p className="font-editorial text-lede italic text-muted">
                {t(
                  "This piece is being written. In the meantime, the related work below covers the same ground.",
                  "Tulisan ini sedang disiapkan. Sementara itu, karya terkait di bawah membahas hal serupa.",
                )}
              </p>
            )}
          </div>
        </Wrap>
      </Section>

      {/* FR-8.8 — block one: the proof. */}
      {article.projects.length > 0 && (
        <Section tone="warm">
          <Wrap>
            <Eyebrow accent>{t("See it in action", "Lihat dalam praktik")}</Eyebrow>
            <ul className="mt-6 grid gap-8 md:grid-cols-2">
              {article.projects.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={path(`/our-work/${p.slug}`)}
                    className="group flex flex-col gap-4"
                  >
                    <Plate
                      publicId={p.heroImage}
                      alt={pick(p, "title", l)}
                      caption={pick(p, "title", l)}
                      ratio="16 / 9"
                      sizes="(min-width: 768px) 45vw, 100vw"
                      tone="red"
                    />
                    <div className="flex flex-col gap-2">
                      <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                        {p.client}
                      </span>
                      <h2 className="text-lg-display/[1.15] font-bold tracked-tight transition-colors group-hover:text-red">
                        {pick(p, "title", l)}
                      </h2>
                      {pickOptional(p, "summary", l) && (
                        <p className="max-w-[46ch] font-editorial text-[0.9375rem] italic text-muted">
                          {pick(p, "summary", l)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      {/* FR-8.8 — block two: the alternatives. */}
      {article.products.length > 0 && (
        <Section>
          <Wrap>
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-lg-display font-bold tracked-tight">
                {t("Explore alternative ideas", "Jelajahi ide alternatif")}
              </h2>
              <ArrowLink href={path("/ideas")}>
                {t("All ideas", "Semua ide")}
              </ArrowLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {article.products.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} locale={l} sizes="25vw" />
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      {/* FR-8.8 — block three: the ask. Always present. */}
      <section className="bg-red py-14 text-paper md:py-20">
        <Wrap className="flex flex-col items-start gap-6">
          <h2 className="balance max-w-[24ch] text-xl-display font-bold tracked-tight">
            {t("Have a similar challenge?", "Punya tantangan serupa?")}
          </h2>
          <p className="max-w-[48ch] font-editorial text-lede italic text-paper/85">
            {t(
              "Tell us the campaign, the budget or the deadline. We will work out what to make.",
              "Sampaikan kampanye, anggaran, atau tenggat waktunya. Kami yang akan menentukan apa yang harus dibuat.",
            )}
          </p>
          <Button href={path("/start-a-project")} variant="onRed">
            {t("Start a Project", "Mulai Proyek")}
          </Button>
        </Wrap>
      </section>

      <Section>
        <Wrap>
          <NewsletterSignup locale={l} sourcePage={`/insights/${slug}`} />
        </Wrap>
      </Section>
    </>
  );
}
