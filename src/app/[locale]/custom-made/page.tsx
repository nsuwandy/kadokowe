import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { pageCopy } from "@/lib/page-content";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { FAMILIES } from "@/content/custom-made";

export const metadata: Metadata = {
  title: "Custom Made",
  description:
    "Made for your brand. Not picked from a catalogue. Seven families of merchandise developed from scratch.",
};

/**
 * Custom Made index — FR-12.1.
 *
 * The distinction this page has to carry: the Product Library shows what already
 * exists, Custom Made shows what can be made. Family names are prefixed
 * "Custom" partly to keep them apart from Product Library categories and partly
 * because the prefix states the promise.
 */
export default async function CustomMadePage({
  params,
}: PageProps<"/[locale]/custom-made">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const [first, ...rest] = FAMILIES;

  // FR-10.5 / FR-12.11 — the index headline is overridable like the seven
  // family pages beneath it.
  const heading = await pageCopy(
    "custom-made.intro", "heading", l,
    t("Made for your brand. Not picked from a catalogue.",
      "Dibuat untuk merek Anda. Bukan dipilih dari katalog."),
  );
  const intro = await pageCopy(
    "custom-made.intro", "intro", l,
    t("Where the Product Library shows what exists, this shows what can be made. Tell us the idea — we handle material, construction, sampling and production.",
      "Jika Pustaka Produk menunjukkan apa yang sudah ada, bagian ini menunjukkan apa yang bisa dibuat. Sampaikan idenya — kami menangani bahan, konstruksi, sampel, dan produksi."),
  );

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <div className="grid items-end gap-6 pb-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow accent>{t("Custom Made", "Dibuat Khusus")}</Eyebrow>
              <h1 className="balance text-xl-display font-bold tracked-tight">
                {heading}
              </h1>
            </div>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {intro}
            </p>
          </div>

          {/* Lead family gets a wide band; the rest sit in an uneven grid so
              the page does not settle into a catalogue rhythm (FR-12.5). */}
          {first && (
            <Link
              href={path(`/custom-made/${first.slug}`)}
              className="group mb-6 grid overflow-hidden bg-ink text-warm lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="relative min-h-[280px] lg:min-h-[440px]">
                <Plate
                  tone="dark"
                  ratio="auto"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  caption={first.shot}
                  className="h-full min-h-[280px] lg:min-h-full"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center gap-4 px-8 py-10 lg:px-12">
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                  01
                </span>
                <h2 className="text-xl-display/[1.05] font-bold tracked-tight text-paper transition-colors group-hover:text-red">
                  {t(first.nameEn, first.nameId)}
                </h2>
                <p className="max-w-[40ch] font-editorial text-lede italic text-plate-c">
                  {t(first.leadEn, first.leadId)}
                </p>
              </div>
            </Link>
          )}

          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((f, i) => (
              <li key={f.slug} className="bg-paper">
                <Link
                  href={path(`/custom-made/${f.slug}`)}
                  className="group flex h-full flex-col transition-colors hover:bg-warm"
                >
                  <Plate
                    ratio="4 / 2.8"
                    caption={f.shot}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="flex flex-1 flex-col gap-2 px-6 pt-5 pb-7">
                    <span className="text-[0.625rem] font-bold tracking-[0.16em] tabular-nums text-red">
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    <h2 className="text-md-display font-semibold transition-colors group-hover:text-red">
                      {t(f.nameEn, f.nameId)}
                    </h2>
                    <p className="font-editorial text-[0.9375rem] leading-snug italic text-muted">
                      {t(f.leadEn, f.leadId)}
                    </p>
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
            <h2 className="max-w-[26ch] text-lg-display font-bold tracked-tight">
              {t(
                "Not sure which of these fits? That's what the first conversation is for.",
                "Belum yakin yang mana yang cocok? Untuk itulah percakapan pertama kami.",
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
