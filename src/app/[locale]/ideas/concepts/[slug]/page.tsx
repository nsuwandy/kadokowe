import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { ProductCard } from "@/components/ProductCard";
import { CONCEPTS, conceptBySlug } from "@/content/concepts";

export function generateStaticParams() {
  return CONCEPTS.filter((c) => c.published).flatMap((c) =>
    ["en", "id"].map((locale) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ideas/concepts/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = conceptBySlug(slug);
  if (!isLocale(locale) || !c) return {};
  const l = locale as AppLocale;
  return {
    title: l === "id" ? c.titleId : c.titleEn,
    description: l === "id" ? c.themeId : c.themeEn,
  };
}

/**
 * Concept Collection detail — FR-13.2, FR-13.3.
 *
 * Every field is optional and the page renders only what a collection
 * carries. `conceptBySlug` filters on `published`, so an unpublished
 * collection 404s rather than being reachable by guessing the URL — with the
 * ANONYMIZED state dropped (decision V4), that check is the safeguard.
 */
export default async function ConceptPage({
  params,
}: PageProps<"/[locale]/ideas/concepts/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = conceptBySlug(slug);
  if (!c) notFound();

  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const products = c.products?.length
    ? await db.product.findMany({
        where: { slug: { in: c.products }, visibility: "PUBLISHED" },
        select: {
          slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
          tagsEn: true, tagsId: true, heroImage: true, availability: true,
        },
      })
    : [];

  const project = c.project
    ? await db.project.findFirst({
        where: { slug: c.project, visibility: "PUBLISHED" },
        select: {
          slug: true, titleEn: true, titleId: true, client: true,
          summaryEn: true, summaryId: true, heroImage: true,
        },
      })
    : null;

  return (
    <>
      <section className="relative grid min-h-[clamp(300px,44vw,480px)]">
        <Plate
          tone="dark"
          ratio="auto"
          sizes="100vw"
          caption={c.shots?.[0] ?? c.titleEn}
          className="absolute inset-0 h-full"
          priority
        />
        <div className="relative z-2 flex max-w-[820px] flex-col gap-4 self-end px-gutter py-10 lg:py-14">
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-red">
            {t("Concept Collection", "Koleksi Konsep")}
          </span>
          <h1 className="balance text-mega/[0.98] font-bold tracked-tight text-paper">
            {t(c.titleEn, c.titleId)}
          </h1>
        </div>
      </section>

      <Section>
        <Wrap>
          <ArrowLink href={path("/ideas/concepts")} className="mb-10">
            {t("All collections", "Semua koleksi")}
          </ArrowLink>

          <div className="mx-auto flex max-w-[68ch] flex-col gap-10">
            {c.themeEn && (
              <p className="font-editorial text-lede italic">
                {t(c.themeEn, c.themeId ?? c.themeEn)}
              </p>
            )}

            {c.briefEn && (
              <div className="flex flex-col gap-3">
                <Eyebrow accent>{t("The opportunity", "Peluangnya")}</Eyebrow>
                <p className="text-[1.0625rem] leading-relaxed">
                  {t(c.briefEn, c.briefId ?? c.briefEn)}
                </p>
              </div>
            )}

            {c.directionEn && (
              <div className="flex flex-col gap-3">
                <Eyebrow accent>{t("Creative direction", "Arah kreatif")}</Eyebrow>
                <p className="text-[1.0625rem] leading-relaxed">
                  {t(c.directionEn, c.directionId ?? c.directionEn)}
                </p>
              </div>
            )}
          </div>

          {c.shots && c.shots.length > 1 && (
            <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {c.shots.slice(1).map((shot) => (
                <li key={shot}>
                  <Plate
                    ratio="4 / 3.2"
                    caption={shot}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </li>
              ))}
            </ul>
          )}
        </Wrap>
      </Section>

      {products.length > 0 && (
        <Section tone="warm">
          <Wrap>
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-lg-display font-bold tracked-tight">
                {t("Products in this collection", "Produk dalam koleksi ini")}
              </h2>
              <ArrowLink href={path("/ideas")}>
                {t("All ideas", "Semua ide")}
              </ArrowLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {products.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} locale={l} sizes="25vw" />
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      {project && (
        <Section>
          <Wrap>
            <Eyebrow accent>{t("This one was made", "Yang ini terwujud")}</Eyebrow>
            <a
              href={path(`/our-work/${project.slug}`)}
              className="group mt-6 grid gap-6 lg:grid-cols-2 lg:gap-12"
            >
              <Plate
                publicId={project.heroImage}
                alt={pick(project, "title", l)}
                caption={pick(project, "title", l)}
                ratio="16 / 9"
                sizes="(min-width: 1024px) 50vw, 100vw"
                tone="red"
              />
              <div className="flex flex-col justify-center gap-3">
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                  {project.client}
                </span>
                <h2 className="text-lg-display font-bold tracked-tight transition-colors group-hover:text-red">
                  {pick(project, "title", l)}
                </h2>
                {pickOptional(project, "summary", l) && (
                  <p className="max-w-[46ch] font-editorial text-[0.9375rem] italic text-muted">
                    {pick(project, "summary", l)}
                  </p>
                )}
              </div>
            </a>
          </Wrap>
        </Section>
      )}

      <section className="bg-red py-14 text-paper md:py-20">
        <Wrap className="flex flex-col items-start gap-6">
          <h2 className="balance max-w-[26ch] text-xl-display font-bold tracked-tight">
            {t(
              "We'd explore your brief the same way.",
              "Kami akan mengeksplorasi brief Anda dengan cara yang sama.",
            )}
          </h2>
          <Button href={path("/start-a-project")} variant="onRed">
            {t("Start a Project", "Mulai Proyek")}
          </Button>
        </Wrap>
      </section>
    </>
  );
}
