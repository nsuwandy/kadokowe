import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { Wrap, Section } from "@/components/ui/Section";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Kadokowe website.",
};

/**
 * Terms of use — working draft.
 *
 * Deliberately short. This site sells nothing and takes no payment, so the
 * terms that matter are about the accuracy of what is shown and the status of
 * an enquiry — specifically that indicative pricing is not an offer, which
 * matters because the whole Product Library shows budget tiers. Should be
 * reviewed by someone qualified before launch.
 */
export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);

  const sections = [
    {
      h: t("About this site", "Tentang situs ini"),
      p: t(
        "This website presents Kadokowe's merchandising capabilities, products and past work. It is not a shop: there is no cart, no checkout and no payment. Nothing on this site constitutes a binding offer to sell.",
        "Situs ini menyajikan kemampuan merchandising, produk, dan karya Kadokowe. Ini bukan toko: tidak ada keranjang, checkout, maupun pembayaran. Tidak ada bagian dari situs ini yang merupakan penawaran jual yang mengikat.",
      ),
    },
    {
      h: t("Pricing is indicative", "Harga bersifat indikatif"),
      p: t(
        "Any budget range or indicative price shown is for orientation only. Final pricing depends on quantity, branding, customisation, packaging and lead time, and is confirmed in a written quotation. A quotation, not this website, is the basis of any agreement.",
        "Setiap rentang anggaran atau harga indikatif yang ditampilkan hanya sebagai gambaran. Harga akhir bergantung pada kuantitas, branding, kustomisasi, kemasan, dan waktu pengerjaan, serta dikonfirmasi dalam penawaran tertulis. Penawaran tertulis, bukan situs ini, menjadi dasar setiap kesepakatan.",
      ),
    },
    {
      h: t("Product information", "Informasi produk"),
      p: t(
        "Materials, dimensions, colours, minimum order quantities and lead times are provided in good faith and may change with availability and production conditions. Images are illustrative; branded mockups show possibilities rather than a finished item.",
        "Bahan, dimensi, warna, kuantitas pesanan minimum, dan waktu pengerjaan diberikan dengan itikad baik dan dapat berubah sesuai ketersediaan serta kondisi produksi. Gambar bersifat ilustratif; mockup bermerek menunjukkan kemungkinan, bukan barang jadi.",
      ),
    },
    {
      h: t("Enquiries", "Permintaan"),
      p: t(
        "Submitting an enquiry starts a conversation. It does not create an order or oblige either party to proceed.",
        "Mengirimkan permintaan berarti memulai percakapan. Hal itu tidak menciptakan pesanan maupun mewajibkan pihak mana pun untuk melanjutkan.",
      ),
    },
    {
      h: t("Intellectual property", "Kekayaan intelektual"),
      p: t(
        "Content on this site, including photography, copy and design, belongs to Kadokowe or its clients. Client names and logos are shown with permission and remain the property of their owners.",
        "Konten di situs ini, termasuk fotografi, naskah, dan desain, adalah milik Kadokowe atau kliennya. Nama dan logo klien ditampilkan dengan izin dan tetap menjadi milik pemiliknya.",
      ),
    },
  ];

  return (
    <Section>
      <Wrap>
        <div className="mx-auto max-w-[68ch]">
          <h1 className="mb-3 text-xl-display font-bold tracked-tight">
            {t("Terms of Use", "Ketentuan Penggunaan")}
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
              {t("Questions", "Pertanyaan")}
            </h2>
            <p className="text-[1.0625rem] leading-relaxed text-muted">
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-red hover:underline">
                {CONTACT.email}
              </a>
            </p>
          </section>
        </div>
      </Wrap>
    </Section>
  );
}
