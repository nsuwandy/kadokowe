import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CONTACT, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Kadokowe — WhatsApp, email, or start a project brief.",
};

/**
 * Contact — FR-10.3.
 *
 * WhatsApp leads because it is how clients actually reach Kadokowe (SRS §2.8),
 * not because it is the newest channel. Address and social links are omitted
 * entirely rather than shown empty (FR-1.6): they are administrator-managed
 * optional fields, unset at launch by client decision.
 */
export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);

  return (
    <Section>
      <Wrap>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="flex flex-col gap-5">
            <Eyebrow accent>{t("Contact", "Kontak")}</Eyebrow>
            <h1 className="balance text-xl-display font-bold tracked-tight">
              {t("Let's talk.", "Mari bicara.")}
            </h1>
            <p className="font-editorial text-lede text-muted">
              {t(
                "A campaign, a deadline, a budget — or just a problem you haven't solved yet. Any of those is enough to start.",
                "Sebuah kampanye, tenggat waktu, anggaran — atau sekadar masalah yang belum terpecahkan. Semuanya cukup untuk memulai.",
              )}
            </p>
          </div>

          <div className="flex flex-col gap-px border border-line bg-line">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 bg-paper p-7 transition-colors hover:bg-warm"
            >
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                WhatsApp
              </span>
              <span className="text-md-display font-semibold transition-colors group-hover:text-red">
                {CONTACT.phoneDisplay}
              </span>
              <span className="text-sm text-muted">
                {t("Fastest way to reach us.", "Cara tercepat menghubungi kami.")}
              </span>
            </a>

            <a
              href={`mailto:${CONTACT.email}`}
              className="group flex flex-col gap-1 bg-paper p-7 transition-colors hover:bg-warm"
            >
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                {t("Email", "Surel")}
              </span>
              <span className="text-md-display font-semibold transition-colors group-hover:text-red">
                {CONTACT.email}
              </span>
              <span className="text-sm text-muted">
                {t(
                  "Good for briefs, brand files and detail.",
                  "Cocok untuk brief, berkas merek, dan detail.",
                )}
              </span>
            </a>

            <div className="flex flex-col gap-3 bg-paper p-7">
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-red">
                {t("Start a brief", "Mulai brief")}
              </span>
              <p className="text-sm text-muted">
                {t(
                  "If you would rather set out the project in one go, the form captures everything we need to come back with options.",
                  "Jika Anda lebih suka menjabarkan proyek sekaligus, formulir kami mencakup semua yang dibutuhkan untuk kembali dengan pilihan.",
                )}
              </p>
              <Button href={localePath("/start-a-project", l)} className="self-start">
                {t("Start a Project", "Mulai Proyek")}
              </Button>
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
