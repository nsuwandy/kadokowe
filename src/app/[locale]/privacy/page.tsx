import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { Wrap, Section } from "@/components/ui/Section";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kadokowe collects, uses and protects personal data.",
};

/**
 * Privacy policy — required, not advisory.
 *
 * Earlier revisions of the SRS recorded that no compliance regime applied.
 * That was accurate while the site only collected enquiries and stopped being
 * accurate the moment it began sending newsletter campaigns: marketing email
 * to recipients in Indonesia engages Law No. 27 of 2022 on Personal Data
 * Protection, which requires demonstrable consent and a route to withdraw it.
 *
 * This is a working draft covering what the site actually does. It should be
 * reviewed by someone qualified before launch — the data practices described
 * are accurate, but the legal framing is not a substitute for advice.
 */
export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);

  const sections = [
    {
      h: t("What we collect", "Data yang kami kumpulkan"),
      p: t(
        "When you submit a project enquiry we collect your name, email address, and any company, phone number, project details or files you choose to provide. When you subscribe to our newsletter we collect your email address, the date and time you consented, the page you subscribed from, and the language you were reading in.",
        "Saat Anda mengirim permintaan proyek, kami mengumpulkan nama, alamat email, serta perusahaan, nomor telepon, detail proyek, atau berkas yang Anda berikan. Saat Anda berlangganan buletin, kami mengumpulkan alamat email, tanggal dan waktu persetujuan, halaman tempat Anda mendaftar, dan bahasa yang Anda gunakan.",
      ),
    },
    {
      h: t("Why we collect it", "Mengapa kami mengumpulkannya"),
      p: t(
        "Enquiry details are used to respond to you and to develop a proposal. Newsletter details are used to send you the newsletter you asked for, and to demonstrate that you consented to receive it. We do not use either for any other purpose.",
        "Detail permintaan digunakan untuk membalas Anda dan menyusun proposal. Detail buletin digunakan untuk mengirimkan buletin yang Anda minta dan untuk membuktikan bahwa Anda telah menyetujuinya. Kami tidak menggunakan keduanya untuk tujuan lain.",
      ),
    },
    {
      h: t("Consent and withdrawal", "Persetujuan dan penarikannya"),
      p: t(
        "We only send newsletters to addresses that have confirmed the subscription by clicking a link we email. Every newsletter carries a one-click unsubscribe link that takes effect immediately, with no login and no further steps. You can also ask us to remove your details at any time by emailing us.",
        "Kami hanya mengirim buletin ke alamat yang telah mengonfirmasi langganannya melalui tautan yang kami kirim. Setiap buletin memuat tautan berhenti berlangganan satu klik yang langsung berlaku, tanpa login dan tanpa langkah tambahan. Anda juga dapat meminta kami menghapus data Anda kapan saja melalui email.",
      ),
    },
    {
      h: t("Who we share it with", "Dengan siapa kami membagikannya"),
      p: t(
        "We use third-party services to run the site: a database and file storage provider, an email delivery service for transactional messages, an email service provider for newsletters, and a web analytics tool. These providers process data on our behalf and only for the purposes above. We do not sell personal data.",
        "Kami menggunakan layanan pihak ketiga untuk menjalankan situs ini: penyedia basis data dan penyimpanan berkas, layanan pengiriman email transaksional, penyedia layanan email untuk buletin, dan alat analitik web. Penyedia ini memproses data atas nama kami dan hanya untuk tujuan di atas. Kami tidak menjual data pribadi.",
      ),
    },
    {
      h: t("How long we keep it", "Berapa lama kami menyimpannya"),
      p: t(
        "Enquiry records are kept for as long as the commercial relationship or its follow-up requires. Newsletter records are kept until you unsubscribe, after which we retain a minimal record that you unsubscribed so that we do not contact you again.",
        "Catatan permintaan disimpan selama hubungan komersial atau tindak lanjutnya membutuhkannya. Catatan buletin disimpan sampai Anda berhenti berlangganan, setelah itu kami menyimpan catatan minimal bahwa Anda telah berhenti agar kami tidak menghubungi Anda lagi.",
      ),
    },
    {
      h: t("Your rights", "Hak Anda"),
      p: t(
        "You can ask us what data we hold about you, ask us to correct it, or ask us to delete it. Write to us and we will respond.",
        "Anda dapat menanyakan data apa yang kami simpan tentang Anda, meminta kami memperbaikinya, atau meminta kami menghapusnya. Hubungi kami dan kami akan menanggapi.",
      ),
    },
  ];

  return (
    <Section>
      <Wrap>
        <div className="mx-auto max-w-[68ch]">
          <h1 className="mb-3 text-xl-display font-bold tracked-tight">
            {t("Privacy Policy", "Kebijakan Privasi")}
          </h1>
          <p className="mb-10 text-sm text-muted">
            {t("Last updated", "Terakhir diperbarui")}: 20 August 2026
          </p>

          {sections.map((s) => (
            <section key={s.h} className="mb-8">
              <h2 className="mb-3 text-md-display font-semibold">{s.h}</h2>
              <p className="text-[1.0625rem] leading-relaxed text-muted">{s.p}</p>
            </section>
          ))}

          <section className="border-t border-line pt-8">
            <h2 className="mb-3 text-md-display font-semibold">
              {t("Contact us", "Hubungi kami")}
            </h2>
            <p className="text-[1.0625rem] leading-relaxed text-muted">
              {t("Email", "Email")}{" "}
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-red hover:underline">
                {CONTACT.email}
              </a>{" "}
              {t("or WhatsApp", "atau WhatsApp")} {CONTACT.phoneDisplay}.
            </p>
          </section>
        </div>
      </Wrap>
    </Section>
  );
}
