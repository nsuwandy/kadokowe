import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { livePublished } from "@/lib/articles";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Plate } from "@/components/ui/Plate";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { CATEGORIES, categoryLabel } from "@/content/insights";

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

export const metadata: Metadata = {
  title: "Insights",
  description:
    "How to think about merchandise, gifting, branding and campaigns — from a strategic merchandising partner.",
};

/**
 * Insights index — FR-8.1, FR-8.2.
 *
 * FR-8.2 requires an editorial magazine layout rather than a uniform grid of
 * blog cards: a featured story at full width, two secondary stories beside
 * each other, then the remainder as horizontal editorial rows. The variation
 * is the requirement, not a flourish — a repeating card grid is precisely
 * what SRS §3.4 lists as the "generic corporate website" failure.
 *
 * Insights teaches how to think about merchandise; Custom Made teaches how
 * products get made. Keeping that distinction visible is why the categories
 * are strategy-led rather than format-led.
 */
export default async function InsightsPage({
  params,
}: PageProps<"/[locale]/insights">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  // NFR-1.2 — the index renders titles, standfirsts and hero images. Selecting
  // the whole row would ship every article's full body HTML to build a page
  // that never displays it, and that payload grows with the archive.
  const articles = await db.article.findMany({
    where: livePublished(),
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: {
      slug: true, category: true, heroImage: true,
      titleEn: true, titleId: true, excerptEn: true, excerptId: true,
    },
  });

  const [lead, second, third, ...rest] = articles;

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <div className="grid items-end gap-6 pb-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow accent>{t("Ideas & Insights", "Ide & Wawasan")}</Eyebrow>
              <h1 className="balance text-xl-display font-bold tracked-tight">
                {t("How to think about merchandise.", "Cara memikirkan merchandise.")}
              </h1>
            </div>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {t(
                "Not company news. What we have learned about making merchandise earn its budget — the strategy behind the object.",
                "Bukan berita perusahaan. Apa yang kami pelajari tentang membuat merchandise sepadan dengan anggarannya — strategi di balik bendanya.",
              )}
            </p>
          </div>

          <nav
            aria-label={t("Categories", "Kategori")}
            className="mb-12 flex flex-wrap gap-2 border-y border-line py-5"
          >
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={path(`/insights/category/${c.slug}`)}
                className="border border-line px-4 py-2.5 text-xs font-semibold transition-colors hover:border-ink"
              >
                {l === "id" ? c.id : c.en}
              </Link>
            ))}
          </nav>

          {articles.length === 0 ? (
            <p className="border border-dashed border-line px-6 py-16 text-center font-editorial text-lede italic text-muted">
              {t("First pieces are being written.", "Tulisan pertama sedang disiapkan.")}
            </p>
          ) : (
            <>
              {/* Lead story — full width, the largest thing on the page. */}
              {lead && (
                <Link
                  href={path(`/insights/${lead.slug}`)}
                  className="group mb-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12"
                >
                  <Plate
                    publicId={lead.heroImage}
                    alt={pick(lead, "title", l)}
                    caption={pick(lead, "title", l)}
                    ratio="16 / 10"
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    priority
                  />
                  <div className="flex flex-col justify-center gap-4">
                    <span className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-red">
                      {categoryLabel(lead.category, l)}
                    </span>
                    <h2 className="balance text-xl-display/[1.05] font-bold tracked-tight transition-colors group-hover:text-red">
                      {pick(lead, "title", l)}
                    </h2>
                    {pickOptional(lead, "excerpt", l) && (
                      <p className="max-w-[46ch] font-editorial text-lede italic text-muted">
                        {pick(lead, "excerpt", l)}
                      </p>
                    )}
                  </div>
                </Link>
              )}

              {/* Two secondary stories, side by side. */}
              {(second || third) && (
                <ul className="mb-12 grid gap-8 border-t border-line pt-12 md:grid-cols-2 md:gap-12">
                  {[second, third].filter(Boolean).map((a) => (
                    <li key={a!.slug}>
                      <Link
                        href={path(`/insights/${a!.slug}`)}
                        className="group flex flex-col gap-4"
                      >
                        <Plate
                          publicId={a!.heroImage}
                          alt={pick(a!, "title", l)}
                          caption={pick(a!, "title", l)}
                          ratio="16 / 9.5"
                          sizes="(min-width: 768px) 45vw, 100vw"
                        />
                        <span className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-red">
                          {categoryLabel(a!.category, l)}
                        </span>
                        <h2 className="text-lg-display/[1.15] font-bold tracked-tight transition-colors group-hover:text-red">
                          {pick(a!, "title", l)}
                        </h2>
                        {pickOptional(a!, "excerpt", l) && (
                          <p className="max-w-[46ch] text-[0.9375rem] leading-snug text-muted">
                            {pick(a!, "excerpt", l)}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* The rest as horizontal editorial rows — a third composition. */}
              {rest.length > 0 && (
                <>
                  <h2 className="mb-6 border-t border-line pt-12 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted">
                    {t("Latest thinking", "Pemikiran terbaru")}
                  </h2>
                  <ul className="flex flex-col">
                    {rest.map((a) => (
                      <li key={a.slug} className="border-b border-line">
                        <Link
                          href={path(`/insights/${a.slug}`)}
                          className="group grid items-center gap-5 py-6 sm:grid-cols-[180px_1fr] sm:gap-8"
                        >
                          <Plate
                            publicId={a.heroImage}
                            alt={pick(a, "title", l)}
                            caption={pick(a, "title", l)}
                            ratio="16 / 11"
                            sizes="180px"
                          />
                          <div className="flex flex-col gap-2">
                            <span className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-red">
                              {categoryLabel(a.category, l)}
                            </span>
                            <h3 className="text-md-display font-semibold transition-colors group-hover:text-red">
                              {pick(a, "title", l)}
                            </h3>
                            {pickOptional(a, "excerpt", l) && (
                              <p className="max-w-[62ch] text-[0.875rem] text-muted">
                                {pick(a, "excerpt", l)}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <NewsletterSignup locale={l} sourcePage="/insights" />
        </Wrap>
      </Section>
    </>
  );
}
