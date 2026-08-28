import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { CartView } from "@/components/cart/CartView";
import { resolveCart } from "./actions";

export const metadata: Metadata = {
  title: "Your request",
  // A cart is personal to whoever holds it and has nothing to offer a search
  // engine, so it stays out of the index.
  robots: { index: false, follow: true },
};

/**
 * The cart — FR-6.x.
 *
 * Not a shop. Nothing is charged, nothing is reserved, and the page says so
 * rather than leaving a buyer to discover it at a checkout that never asks
 * for a card. What it produces is a brief: a list of products, quantities and
 * finishes, sent to Kadokowe and handed back as a PDF.
 */
export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);

  return (
    <Section>
      <Wrap>
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow accent>{t("Your request", "Permintaan Anda")}</Eyebrow>
          <h1 className="balance text-xl-display font-bold tracked-tight">
            {t("Everything you are considering.", "Semua yang Anda pertimbangkan.")}
          </h1>
          <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
            {t(
              "Nothing here is an order. Send it over and we come back with a written quotation — and you keep a PDF of exactly what you asked for.",
              "Ini bukan pesanan. Kirimkan kepada kami dan kami akan kembali dengan penawaran tertulis — dan Anda menyimpan PDF berisi persis apa yang Anda minta.",
            )}
          </p>
        </div>

        <CartView
          locale={l}
          resolve={resolveCart}
          labels={{
            loading: t("Loading your request…", "Memuat permintaan Anda…"),
            empty: t("Nothing here yet.", "Belum ada apa-apa di sini."),
            browse: t("Browse the Product Library", "Jelajahi Pustaka Produk"),
            productOnly: t("Product only", "Produk saja"),
            qty: t("Qty", "Jml"),
            unit: t("unit", "unit"),
            units: t("units", "unit"),
            quoted: t("To be quoted", "Akan ditawarkan"),
            quotedWhy: t(
              "This request includes packaging that is quoted rather than listed, so no estimate is shown.",
              "Permintaan ini mencakup kemasan yang ditawarkan secara terpisah, sehingga tidak ada estimasi yang ditampilkan.",
            ),
            indicativeTotal: t("Indicative total", "Total indikatif"),
            removeLine: t("Remove", "Hapus"),
            checkoutHeading: t("Send this to us", "Kirimkan kepada kami"),
            checkoutIntro: t(
              "We reply with a written quotation, usually within a working day.",
              "Kami membalas dengan penawaran tertulis, biasanya dalam satu hari kerja.",
            ),
            brand: t("Brand or company", "Merek atau perusahaan"),
            yourName: t("Your name", "Nama Anda"),
            email: t("Email", "Email"),
            phone: t("Phone or WhatsApp", "Telepon atau WhatsApp"),
            message: t("Anything we should know", "Hal yang perlu kami ketahui"),
            files: t("Files", "Berkas"),
            filesHint: t(
              "Logo, brand guidelines, design references — anything that helps us quote accurately.",
              "Logo, panduan merek, referensi desain — apa pun yang membantu kami memberi penawaran akurat.",
            ),
            send: t("Send request", "Kirim permintaan"),
            sending: t("Sending…", "Mengirim…"),
            sendNote: t(
              "You will get a PDF of this request straight away.",
              "Anda akan langsung menerima PDF permintaan ini.",
            ),
            sentHeading: t("Request sent.", "Permintaan terkirim."),
            sentBody: t(
              "Your PDF has downloaded, and we have it too. Quote this reference when you get in touch:",
              "PDF Anda telah diunduh, dan kami juga menerimanya. Sebutkan nomor referensi ini saat menghubungi kami:",
            ),
            keepBrowsing: t("Keep browsing", "Lanjut menjelajah"),
            errorUpload: t(
              "One of those files is too large or the wrong kind. PDF, images, Word or a zip work best.",
              "Salah satu berkas terlalu besar atau jenisnya tidak sesuai. PDF, gambar, Word, atau zip paling sesuai.",
            ),
            errorRate: t(
              "That is a lot of requests at once. Give it a minute and try again.",
              "Terlalu banyak permintaan sekaligus. Tunggu sebentar lalu coba lagi.",
            ),
            errorGeneric: t(
              "That did not send. Try again, or message us on WhatsApp.",
              "Pengiriman gagal. Coba lagi, atau hubungi kami via WhatsApp.",
            ),
          }}
        />
      </Wrap>
    </Section>
  );
}
