import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { FAMILIES, familyBySlug } from "@/content/custom-made";

export function generateStaticParams() {
  return FAMILIES.flatMap((f) =>
    ["en", "id"].map((locale) => ({ locale, family: f.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/custom-made/[family]">): Promise<Metadata> {
  const { locale, family } = await params;
  const f = familyBySlug(family);
  if (!isLocale(locale) || !f) return {};
  const l = locale as AppLocale;
  return {
    title: l === "id" ? f.nameId : f.nameEn,
    description: l === "id" ? f.leadId : f.leadEn,
  };
}

/**
 * Custom Made family — FR-12.2 to FR-12.10.
 *
 * Shared template: What Can We Create, Understanding Your Options, Make It
 * Yours, See What We've Made, and the enquiry call to action.
 *
 * The governing rule is FR-12.3 and FR-12.5 — educate, don't overwhelm.
 * Options are broad families with a plain statement that Kadokowe recommends
 * the exact specification during development. No specification tables, no
 * configurator: those shift work onto the client that they are engaging
 * Kadokowe to do.
 */
export default async function FamilyPage({
  params,
}: PageProps<"/[locale]/custom-made/[family]">) {
  const { locale, family } = await params;
  if (!isLocale(locale)) notFound();
  const f = familyBySlug(family);
  if (!f) notFound();

  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const examples = l === "id" ? f.examplesId : f.examplesEn;

  // FR-12.4 — related work, rendered only when a relationship exists.
  const projects = await db.project.findMany({
    where: { visibility: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: 2,
    select: {
      slug: true, titleEn: true, titleId: true, client: true,
      summaryEn: true, summaryId: true, heroImage: true,
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="relative grid min-h-[clamp(300px,44vw,480px)]">
        <Plate
          tone="dark"
          ratio="auto"
          sizes="100vw"
          caption={f.shot}
          className="absolute inset-0 h-full"
          priority
        />
        <div className="relative z-2 flex max-w-[820px] flex-col gap-4 self-end px-gutter py-10 lg:py-14">
          <Link
            href={path("/custom-made")}
            className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-red"
          >
            {t("Custom Made", "Dibuat Khusus")}
          </Link>
          <h1 className="balance text-mega/[0.98] font-bold tracked-tight text-paper">
            {t(f.nameEn, f.nameId)}
          </h1>
          <p className="max-w-[44ch] font-editorial text-lede italic text-plate-c">
            {t(f.leadEn, f.leadId)}
          </p>
        </div>
      </section>

      <Section>
        <Wrap>
          <p className="mx-auto max-w-[68ch] font-editorial text-lede">
            {t(f.introEn, f.introId)}
          </p>
        </Wrap>
      </Section>

      {/* What can we create? */}
      <Section tone="warm" className="py-14 md:py-20">
        <Wrap>
          <Eyebrow accent>{t("What can we create?", "Apa yang bisa kami buat?")}</Eyebrow>
          <ul className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {examples.map((ex, i) => (
              <li key={ex} className="flex flex-col bg-paper">
                <Plate
                  ratio="4 / 3"
                  caption={ex}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
                <span className="px-5 py-4 text-[0.9375rem] font-semibold">
                  {ex}
                </span>
                <span className="sr-only">{i + 1}</span>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* Understanding your options — broad families only (FR-12.3). */}
      {f.options && (
        <Section>
          <Wrap>
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
              <div className="flex flex-col gap-3">
                <Eyebrow accent>
                  {t("Understanding your options", "Memahami pilihan Anda")}
                </Eyebrow>
                <p className="max-w-[40ch] text-[0.9375rem] leading-relaxed text-muted">
                  {t(
                    "Only the choices worth knowing about at this stage. We recommend the exact material, construction and specification during project development.",
                    "Hanya pilihan yang perlu Anda ketahui pada tahap ini. Kami merekomendasikan bahan, konstruksi, dan spesifikasi persisnya saat pengembangan proyek.",
                  )}
                </p>
              </div>
              <ul className="flex flex-col">
                {f.options.map((o) => (
                  <li
                    key={o.en}
                    className="grid gap-1 border-t border-line py-5 last:border-b sm:grid-cols-[0.7fr_1.3fr] sm:gap-6"
                  >
                    <span className="text-[0.9375rem] font-semibold">
                      {t(o.en, o.id)}
                    </span>
                    <span className="text-[0.875rem] leading-relaxed text-muted">
                      {t(o.descEn, o.descId)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Wrap>
        </Section>
      )}

      {/* Make it yours */}
      <Section tone={f.options ? "warm" : "paper"}>
        <Wrap>
          <Eyebrow accent>{t("Make it yours", "Jadikan milik Anda")}</Eyebrow>
          <h2 className="mt-3 mb-7 max-w-[24ch] text-lg-display font-bold tracked-tight">
            {t(
              "The branding decisions that change how it lands.",
              "Keputusan branding yang mengubah kesannya.",
            )}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {f.branding.map((b) => (
              <li
                key={b}
                className="border border-line bg-paper px-5 py-3 text-[0.8125rem] font-semibold"
              >
                {b}
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* See what we've made — FR-12.4 */}
      {projects.length > 0 && (
        <Section>
          <Wrap>
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-lg-display font-bold tracked-tight">
                {t("See what we've made", "Lihat yang telah kami buat")}
              </h2>
              <ArrowLink href={path("/our-work")}>
                {t("All work", "Semua karya")}
              </ArrowLink>
            </div>
            <ul className="grid gap-8 md:grid-cols-2">
              {projects.map((p) => (
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
                    <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                      {p.client}
                    </span>
                    <h3 className="text-md-display font-semibold transition-colors group-hover:text-red">
                      {pick(p, "title", l)}
                    </h3>
                    {pickOptional(p, "summary", l) && (
                      <p className="max-w-[46ch] font-editorial text-[0.9375rem] italic text-muted">
                        {pick(p, "summary", l)}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      {/* Have something in mind? — FR-12.10 offers the softer route too. */}
      <section className="bg-red py-14 text-paper md:py-20">
        <Wrap className="flex flex-col items-start gap-6">
          <h2 className="balance max-w-[24ch] text-xl-display font-bold tracked-tight">
            {t("Have something in mind?", "Punya sesuatu di benak Anda?")}
          </h2>
          <p className="max-w-[48ch] font-editorial text-lede italic text-paper/85">
            {t(
              "Bring a sketch, a reference, or just the problem. We will work out what to make.",
              "Bawa sketsa, referensi, atau sekadar masalahnya. Kami yang akan menentukan apa yang harus dibuat.",
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href={path("/start-a-project")} variant="onRed">
              {t("Start a Project →", "Mulai Proyek →")}
            </Button>
            <Button href={path("/start-a-project")} variant="onDark">
              {t("Not sure? Let us help →", "Belum yakin? Kami bantu →")}
            </Button>
          </div>
        </Wrap>
      </section>
    </>
  );
}
