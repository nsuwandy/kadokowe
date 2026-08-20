import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Stories we've crafted. Every project here started as a brief someone else would have answered with a catalogue.",
};

/**
 * Our Work index — FR-7.1, FR-7.5, FR-7.6.
 *
 * FR-7.1 requires treatment distinct from Idea Library listings. The
 * distinction is enforced by layout rather than by styling: the featured
 * project takes a full-bleed dark band, and the remainder use uneven column
 * spans, so the page cannot be mistaken for a product grid even at a glance.
 */
export default async function OurWorkPage({
  params,
}: PageProps<"/[locale]/our-work">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const projects = await db.project.findMany({
    where: { visibility: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });

  const [featured, ...rest] = projects;

  // Deliberately uneven spans so the grid never settles into a rhythm.
  const spans = ["lg:col-span-4", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"];

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <div className="grid items-end gap-6 pb-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow accent>{t("Our Work", "Karya Kami")}</Eyebrow>
              <h1 className="balance text-xl-display font-bold tracked-tight">
                {t("Stories we've crafted.", "Cerita yang kami rangkai.")}
              </h1>
            </div>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {t(
                "Every project here started as a brief someone else would have answered with a catalogue. What follows is the thinking, not just the product.",
                "Setiap proyek di sini bermula dari brief yang orang lain akan jawab dengan katalog. Yang berikut ini adalah pemikirannya, bukan sekadar produknya.",
              )}
            </p>
          </div>

          {featured && (
            <Link
              href={path(`/our-work/${featured.slug}`)}
              className="group mb-10 grid bg-ink text-warm lg:grid-cols-2"
            >
              <div className="relative min-h-[300px] lg:min-h-[520px]">
                <Plate
                  tone="red"
                  ratio="auto"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  publicId={featured.heroImage}
                  alt={pick(featured, "title", l)}
                  caption={pick(featured, "title", l)}
                  className="h-full min-h-[300px] lg:min-h-full"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center gap-5 px-8 py-10 lg:px-14">
                <Eyebrow className="text-plate-c">
                  {featured.client}
                  {featured.industry ? ` — ${featured.industry}` : ""}
                </Eyebrow>
                <h2 className="balance text-xl-display font-bold tracked-tight text-paper transition-colors group-hover:text-red">
                  {pick(featured, "title", l)}
                </h2>
                {pickOptional(featured, "summary", l) && (
                  <p className="max-w-[42ch] font-editorial text-lede italic text-plate-c">
                    {pick(featured, "summary", l)}
                  </p>
                )}
                <span className="font-display text-xs font-semibold uppercase tracking-[0.13em] text-red">
                  {t("Read the story", "Baca ceritanya")}{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          )}

          <ul className="grid gap-8 lg:grid-cols-6 lg:gap-x-6 lg:gap-y-12">
            {rest.map((p, i) => (
              <li key={p.slug} className={spans[i % spans.length]}>
                <Link href={path(`/our-work/${p.slug}`)} className="group flex flex-col gap-4">
                  <Plate
                    publicId={p.heroImage}
                    alt={pick(p, "title", l)}
                    caption={pick(p, "title", l)}
                    ratio={i % spans.length === 1 ? "4 / 4.4" : "16 / 8.2"}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                        {p.client}
                      </span>
                      {p.industry && (
                        <span className="text-[0.625rem] uppercase tracking-[0.13em] text-muted">
                          {p.industry}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg-display/[1.15] font-bold tracked-tight transition-colors group-hover:text-red">
                      {pick(p, "title", l)}
                    </h3>
                    {pickOptional(p, "summary", l) && (
                      <p className="max-w-[46ch] font-editorial text-[0.9375rem] leading-snug italic text-muted">
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

      <Section>
        <Wrap>
          <div className="flex flex-col items-start gap-5 bg-warm p-8 md:p-14">
            <h2 className="max-w-[24ch] text-lg-display font-bold tracked-tight">
              {t(
                "Your brief is the next one on this page.",
                "Brief Anda adalah yang berikutnya di halaman ini.",
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
