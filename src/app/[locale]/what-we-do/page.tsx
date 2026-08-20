import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { PROCESS } from "@/content/home";
import { CAPABILITIES, EXECUTION_STAGES, WORKFLOWS } from "@/content/what-we-do";

export const metadata: Metadata = {
  title: "What We Do",
  description:
    "Strategy, ideation, design, sourcing, production, packaging and delivery — under one roof. We don't stop at ideas. We make them happen.",
};

export default async function WhatWeDoPage({
  params,
}: PageProps<"/[locale]/what-we-do">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <div className="grid items-end gap-6 pb-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow accent>{t("What We Do", "Apa Yang Kami Lakukan")}</Eyebrow>
              <h1 className="balance text-xl-display font-bold tracked-tight">
                {t(
                  "A strategic merchandising partner, not a vendor.",
                  "Mitra merchandising strategis, bukan vendor.",
                )}
              </h1>
            </div>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {t(
                "Seven capabilities that normally sit in separate businesses. Holding them together is what lets one team answer a brief with an idea and then actually produce it.",
                "Tujuh kemampuan yang biasanya berada di perusahaan berbeda. Menyatukannya memungkinkan satu tim menjawab brief dengan ide lalu benar-benar memproduksinya.",
              )}
            </p>
          </div>

          {/* Seven items across a three-column grid leaves two empty cells on
              the last row, which show through as divider colour. The final
              capability spans the remainder — Delivery is the one that closes
              the sequence, so the emphasis reads as intent rather than
              leftover space. */}
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c, i) => (
              <li
                key={c.en}
                className={
                  i === CAPABILITIES.length - 1
                    ? "flex flex-col gap-2 bg-paper p-7 sm:col-span-2 lg:col-span-3"
                    : "flex flex-col gap-2 bg-paper p-7"
                }
              >
                <h2 className="text-md-display font-semibold">{t(c.en, c.id)}</h2>
                <p className="max-w-[62ch] text-[0.875rem] leading-relaxed text-muted">
                  {t(c.descEn, c.descId)}
                </p>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* The single process model — decision V2. */}
      <Section tone="warm">
        <Wrap>
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow accent>{t("Our process", "Proses kami")}</Eyebrow>
              <h2 className="balance text-lg-display font-bold tracked-tight">
                {t(
                  "Our real product is the process. The merchandise is what comes out of it.",
                  "Produk kami yang sesungguhnya adalah prosesnya. Merchandise adalah hasilnya.",
                )}
              </h2>
            </div>
            <ol className="flex flex-col">
              {PROCESS.map((s, i) => (
                <li
                  key={s.en}
                  className="grid grid-cols-[2.6rem_1fr] items-baseline gap-4 border-t border-line py-4 last:border-b"
                >
                  <span className="text-[0.6875rem] font-bold tracking-[0.1em] tabular-nums text-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-[0.9375rem] font-semibold">
                      {t(s.en, s.id)}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-muted">
                      {t(s.descEn, s.descId)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Wrap>
      </Section>

      {/* ---------------------------------------------------------------
          From Idea to Reality — FR-14.
          A photo essay, not a process diagram. The six stages are framed
          explicitly as chapters of Craft and Deliver so they never read as
          a second, competing model (FR-14.2).
          --------------------------------------------------------------- */}
      <section id="from-idea-to-reality" className="bg-ink py-14 text-warm md:py-24">
        <Wrap>
          <div className="mb-12 flex max-w-[46ch] flex-col gap-4">
            <Eyebrow className="text-red">
              {t("From Idea to Reality", "Dari Ide ke Kenyataan")}
            </Eyebrow>
            <h2 className="balance text-xl-display font-bold tracked-tight text-paper">
              {t(
                "We don't stop at ideas. We make them happen.",
                "Kami tidak berhenti pada ide. Kami mewujudkannya.",
              )}
            </h2>
            <p className="text-[0.9375rem] leading-relaxed text-plate-c">
              {t(
                "Craft and Deliver are where most of the work actually lives. Here is what those two stages look like on the floor.",
                "Wujudkan dan Kirimkan adalah tempat sebagian besar pekerjaan sesungguhnya berlangsung. Beginilah kedua tahap itu terlihat di lapangan.",
              )}
            </p>
          </div>

          <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {EXECUTION_STAGES.map((s, i) => (
              <li key={s.key} className="flex flex-col gap-4">
                <Plate
                  tone="dark"
                  ratio="4 / 3"
                  caption={s.shot}
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[0.6875rem] font-bold tracking-[0.1em] tabular-nums text-red">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-md-display font-semibold text-paper">
                      {t(s.en, s.id)}
                    </h3>
                    {/* Names the parent stage, so the six never read as a
                        competing five-stage alternative. */}
                    <span className="ml-auto text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
                      {s.parent}
                    </span>
                  </div>
                  <p className="font-editorial text-[1.0625rem] italic text-warm">
                    {t(s.leadEn, s.leadId)}
                  </p>
                  <p className="text-[0.875rem] leading-relaxed text-plate-c">
                    {t(s.bodyEn, s.bodyId)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* FR-14.4 — the hybrid claim, stated accurately. */}
          <div className="mt-14 border-t border-[#2e2829] pt-10">
            <h3 className="mb-4 text-lg-display font-bold tracked-tight text-paper">
              {t("Built for agility.", "Dibangun untuk kelincahan.")}
            </h3>
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-plate-c">
              {t(
                "Our in-house capabilities let us prototype, customise and respond quickly. When scale is required, our production network in Indonesia and our sourcing and manufacturing partners in China take ideas from hundreds to thousands.",
                "Kemampuan in-house kami memungkinkan pembuatan prototipe, kustomisasi, dan respons cepat. Ketika skala dibutuhkan, jaringan produksi kami di Indonesia serta mitra pengadaan dan manufaktur di Tiongkok membawa ide dari ratusan menjadi ribuan.",
              )}
            </p>
          </div>
        </Wrap>
      </section>

      {/* Two engagement workflows. */}
      <Section>
        <Wrap>
          <Eyebrow accent>{t("How we start", "Cara kami memulai")}</Eyebrow>
          <h2 className="mt-3 mb-10 max-w-[28ch] text-lg-display font-bold tracked-tight">
            {t(
              "Two ways in, depending on how clear the brief already is.",
              "Dua cara memulai, tergantung sejelas apa brief Anda.",
            )}
          </h2>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {WORKFLOWS.map((w) => (
              <div key={w.en} className="flex flex-col gap-4 bg-warm p-7 md:p-9">
                <h3 className="text-md-display font-semibold">{t(w.en, w.id)}</h3>
                <p className="font-editorial text-[0.9375rem] italic text-muted">
                  {t(w.forEn, w.forId)}
                </p>
                <ol className="mt-2 flex flex-col">
                  {w.steps.map((step, i) => (
                    <li
                      key={step.en}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line py-3 last:border-b"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="text-[0.625rem] font-bold tabular-nums text-red">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[0.875rem] font-semibold">
                          {t(step.en, step.id)}
                        </span>
                      </span>
                      {step.timeEn && (
                        <span className="text-[0.75rem] tabular-nums text-muted">
                          {t(step.timeEn, step.timeId)}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Wrap>
      </Section>

      <section className="bg-red py-14 text-paper md:py-20">
        <Wrap className="flex flex-col items-start gap-6">
          <h2 className="balance max-w-[26ch] text-xl-display font-bold tracked-tight">
            {t(
              "Whether you have a brief or just a problem.",
              "Baik Anda punya brief atau sekadar masalah.",
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
