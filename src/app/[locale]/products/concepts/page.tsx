import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { publishedConcepts } from "@/content/concepts";

export const metadata: Metadata = {
  title: "Concept Collections",
  description:
    "How we explore a brief. Brand-specific merchandise proposals and creative explorations — not all of which were produced.",
};

/**
 * Concept Collections index — FR-13.1, FR-13.6.
 *
 * The section occupies the space between what is possible and what was
 * delivered:
 *   Product Library      — what products are possible
 *   Concept Collections — how Kadokowe thinks about a brief
 *   Our Work          — what Kadokowe actually executed
 *
 * Presented editorially rather than as a product grid, because the subject is
 * thinking rather than merchandise.
 */
export default async function ConceptsPage({
  params,
}: PageProps<"/[locale]/products/concepts">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const concepts = publishedConcepts();

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <div className="grid items-end gap-6 pb-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow accent>{t("Concept Collections", "Koleksi Konsep")}</Eyebrow>
              <h1 className="balance text-xl-display font-bold tracked-tight">
                {t("How we explore a brief.", "Cara kami mengeksplorasi brief.")}
              </h1>
            </div>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {t(
                "Not every concept becomes a product. These are explorations developed around real briefs — the thinking that happens before anything is made.",
                "Tidak setiap konsep menjadi produk. Ini adalah eksplorasi yang dikembangkan dari brief nyata — pemikiran yang terjadi sebelum sesuatu dibuat.",
              )}
            </p>
          </div>

          {/* States the three-way distinction plainly, since the section only
              makes sense in contrast to the other two. */}
          <dl className="mb-12 grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              {
                k: t("Product Library", "Pustaka Produk"),
                v: t("What products are possible.", "Produk apa yang mungkin."),
                href: "/products",
              },
              {
                k: t("Concept Collections", "Koleksi Konsep"),
                v: t("How we think about a brief.", "Cara kami memikirkan sebuah brief."),
                href: null,
              },
              {
                k: t("Our Work", "Karya Kami"),
                v: t("What we actually executed.", "Apa yang benar-benar kami kerjakan."),
                href: "/our-work",
              },
            ].map((x) => (
              <div key={x.k} className="flex flex-col gap-1.5 bg-paper p-6">
                <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red">
                  {x.href ? (
                    <Link href={path(x.href)} className="hover:underline">
                      {x.k}
                    </Link>
                  ) : (
                    x.k
                  )}
                </dt>
                <dd className="text-[0.875rem] text-muted">{x.v}</dd>
              </div>
            ))}
          </dl>

          {concepts.length === 0 ? (
            <p className="border border-dashed border-line px-6 py-16 text-center font-editorial text-lede italic text-muted">
              {t(
                "Collections are being prepared for publication.",
                "Koleksi sedang disiapkan untuk dipublikasikan.",
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-10">
              {concepts.map((c, i) => (
                <li key={c.slug}>
                  <Link
                    href={path(`/products/concepts/${c.slug}`)}
                    className={`group grid gap-6 lg:gap-12 ${
                      i % 2 === 0
                        ? "lg:grid-cols-[1.15fr_0.85fr]"
                        : "lg:grid-cols-[0.85fr_1.15fr]"
                    }`}
                  >
                    <Plate
                      tone={i % 2 === 0 ? "light" : "dark"}
                      ratio="16 / 9.5"
                      caption={c.shots?.[0] ?? c.titleEn}
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className={i % 2 === 0 ? "" : "lg:order-2"}
                    />
                    <div
                      className={`flex flex-col justify-center gap-4 ${
                        i % 2 === 0 ? "" : "lg:order-1"
                      }`}
                    >
                      <h2 className="text-lg-display font-bold tracked-tight transition-colors group-hover:text-red">
                        {t(c.titleEn, c.titleId)}
                      </h2>
                      {c.themeEn && (
                        <p className="max-w-[46ch] font-editorial text-lede italic text-muted">
                          {t(c.themeEn, c.themeId ?? c.themeEn)}
                        </p>
                      )}
                      <span className="font-display text-xs font-semibold uppercase tracking-[0.13em] text-red">
                        {t("See the collection", "Lihat koleksinya")}{" "}
                        <span className="inline-block transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <div className="flex flex-col items-start gap-5 bg-warm p-8 md:p-14">
            <h2 className="max-w-[26ch] text-lg-display font-bold tracked-tight">
              {t(
                "Bring us a brief and we'll explore it the same way.",
                "Bawa brief Anda dan kami akan mengeksplorasinya dengan cara yang sama.",
              )}
            </h2>
            <Button href={path("/start-a-project")}>
              {t("Start a Project", "Mulai Proyek")}
            </Button>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
