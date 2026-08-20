import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { EnquiryForm } from "@/components/EnquiryForm";
import { CONTACT, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start a Project",
  description:
    "You don't need a product in mind. An event, a rough budget and a date is enough for us to come back with options.",
};

export default async function StartProjectPage({
  params,
}: PageProps<"/[locale]/start-a-project">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);

  return (
    <Section>
      <Wrap>
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <Eyebrow accent>{t("Start a Project", "Mulai Proyek")}</Eyebrow>
            <h1 className="balance text-xl-display font-bold tracked-tight">
              {t(
                "Tell us what you're planning.",
                "Ceritakan apa yang Anda rencanakan.",
              )}
            </h1>
            <p className="font-editorial text-lede text-muted">
              {t(
                "You do not need a product in mind. An event, a rough budget and a date is enough for us to come back with options.",
                "Anda tidak perlu tahu produknya. Sebuah acara, perkiraan anggaran, dan tanggal sudah cukup bagi kami untuk kembali dengan pilihan.",
              )}
            </p>
            <hr className="my-2 border-line" />
            <p className="text-sm text-muted">
              {t("Prefer to talk?", "Lebih suka berbicara?")}{" "}
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-red hover:underline"
              >
                WhatsApp {CONTACT.phoneDisplay}
              </a>{" "}
              {t("or email", "atau email")}{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-semibold text-red hover:underline"
              >
                {CONTACT.email}
              </a>
              .
            </p>
          </aside>

          {/* useSearchParams needs a Suspense boundary to keep the rest of the
              page static-renderable. */}
          <Suspense fallback={<div className="min-h-[600px]" />}>
            <EnquiryForm locale={l} />
          </Suspense>
        </div>
      </Wrap>
    </Section>
  );
}
