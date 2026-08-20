import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { ProductCard } from "@/components/ProductCard";

type Stat = { value: string; labelEn: string; labelId?: string };

async function getProject(slug: string) {
  return db.project.findFirst({
    where: { slug, visibility: "PUBLISHED" },
    include: {
      gallery: { orderBy: { sortOrder: "asc" } },
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
}: PageProps<"/[locale]/our-work/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = await getProject(slug);
  if (!project) return {};
  const l = locale as AppLocale;
  return {
    title: pick(project, "seoTitle", l) || pick(project, "title", l),
    description: pick(project, "seoDesc", l) || pick(project, "summary", l),
  };
}

export async function generateStaticParams() {
  const projects = await db.project.findMany({
    where: { visibility: "PUBLISHED" },
    select: { slug: true },
  });
  return projects.flatMap((p) =>
    ["en", "id"].map((locale) => ({ locale, slug: p.slug })),
  );
}

/**
 * Project story — FR-7.2.
 *
 * Six narrative sections, every one optional. The page renders only the
 * sections that carry content and numbers them by what survives, so a project
 * with four populated sections reads 01–04 rather than 01, 03, 05, 06.
 *
 * Optionality is the point, not a convenience: two of the five documented case
 * studies have strong challenge-and-thinking material but little recorded
 * production detail. Forcing all six headings would put visible holes exactly
 * where a story is weakest.
 */
export default async function ProjectPage({
  params,
}: PageProps<"/[locale]/our-work/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const project = await getProject(slug);
  if (!project) notFound();

  const title = pick(project, "title", l);

  const sections = [
    { key: "brief", label: t("The Brief", "Brief-nya"), body: pickOptional(project, "brief", l) },
    { key: "challenge", label: t("The Challenge", "Tantangannya"), body: pickOptional(project, "challenge", l) },
    { key: "thinking", label: t("Our Thinking", "Pemikiran Kami"), body: pickOptional(project, "thinking", l) },
    { key: "createdWork", label: t("What We Created", "Yang Kami Ciptakan"), body: pickOptional(project, "createdWork", l) },
    { key: "making", label: t("Making It Happen", "Mewujudkannya"), body: pickOptional(project, "making", l) },
    { key: "impact", label: t("The Impact", "Dampaknya"), body: pickOptional(project, "impact", l) },
  ].filter((s) => s.body);

  const stats = (project.stats as Stat[] | null) ?? [];

  return (
    <>
      {/* Full-bleed hero with the title overlaid. */}
      <section className="relative grid min-h-[clamp(340px,50vw,560px)]">
        <Plate
          tone="red"
          ratio="auto"
          sizes="100vw"
          publicId={project.heroImage}
          alt={title}
          caption={`Hero — ${title}`}
          className="absolute inset-0 h-full"
          priority
        />
        <div className="relative z-2 flex max-w-[900px] flex-col gap-4 self-end px-gutter py-10 lg:py-16">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-paper">
            {project.client}
            {project.industry ? ` — ${project.industry}` : ""}
          </p>
          <h1 className="balance text-mega/[0.96] font-bold tracked-tight text-paper">
            {title}
          </h1>
        </div>
      </section>

      <Wrap>
        <dl className="grid grid-cols-2 border-b border-line md:grid-cols-4">
          {[
            { k: t("Client", "Klien"), v: project.client },
            { k: t("Industry", "Industri"), v: project.industry },
            { k: t("Scope", "Lingkup"), v: t("Ideation, design, production", "Ideasi, desain, produksi") },
            {
              k: t("Products", "Produk"),
              v: project.products.length ? `${project.products.length}` : null,
            },
          ]
            .filter((x) => x.v)
            .map((x) => (
              <div
                key={x.k}
                className="flex flex-col gap-1.5 border-r border-line px-5 py-6 last:border-r-0"
              >
                <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-muted">
                  {x.k}
                </dt>
                <dd className="text-[0.9375rem] font-semibold">{x.v}</dd>
              </div>
            ))}
        </dl>
      </Wrap>

      <Section className="py-0">
        <Wrap>
          {sections.map((s, i) => (
            <article
              key={s.key}
              className="grid items-start gap-4 border-b border-line py-10 last:border-b-0 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:py-16"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[0.6875rem] font-bold tracking-[0.1em] tabular-nums text-red">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-md-display font-semibold">{s.label}</h2>
              </div>
              <div className="flex flex-col gap-5">
                <p
                  className={
                    // The opening and closing sections carry the voice; the
                    // middle ones carry the detail.
                    i === 0 || s.key === "impact"
                      ? "font-editorial text-lede"
                      : "max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted"
                  }
                >
                  {s.body}
                </p>
                {s.key === "createdWork" && project.gallery.length > 0 && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {project.gallery.slice(0, 2).map((img) => (
                      <li key={img.id}>
                        <Plate
                          publicId={img.publicId}
                          alt={pick(img, "alt", l)}
                          caption={pick(img, "caption", l)}
                          ratio="4 / 3"
                          sizes="(min-width: 640px) 33vw, 100vw"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </Wrap>
      </Section>

      {stats.length > 0 && (
        <Section tone="warm">
          <Wrap>
            <ul className="grid gap-6 md:grid-cols-3 md:gap-12">
              {stats.map((s) => (
                <li key={s.labelEn}>
                  <span className="mb-2 block text-[clamp(2rem,4vw,3.25rem)]/[1] font-bold tracked-tight tabular-nums text-red">
                    {s.value}
                  </span>
                  <span className="block max-w-[30ch] text-[0.8125rem] leading-snug text-muted">
                    {l === "id" && s.labelId ? s.labelId : s.labelEn}
                  </span>
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      {project.products.length > 0 && (
        <Section>
          <Wrap>
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-lg-display font-bold tracked-tight">
                {t("Products from this project", "Produk dari proyek ini")}
              </h2>
              <ArrowLink href={path("/ideas")}>
                {t("Explore the Idea Library", "Jelajahi Pustaka Ide")}
              </ArrowLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {project.products.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} locale={l} sizes="25vw" />
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      <section className="bg-red py-14 text-paper md:py-20">
        <Wrap className="flex flex-col items-start gap-7">
          <h2 className="balance max-w-[24ch] text-xl-display font-bold tracked-tight">
            {t(
              "Tell us the constraint. We'll question the category.",
              "Sampaikan kendalanya. Kami akan mempertanyakan kategorinya.",
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
