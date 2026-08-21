import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { pageCopy } from "@/lib/page-content";
import { Wrap, Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kadokowe was built from decades of sourcing and manufacturing experience fused with brand storytelling. A strategic merchandising partner, not a vendor.",
};

/** Content drawn from the Kadokowe company profile, 2025 v1.0. */
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const values = [
    { en: "Creativity", id: "Kreativitas", dEn: "Turning ordinary ideas into extraordinary merchandise.", dId: "Mengubah ide biasa menjadi merchandise luar biasa." },
    { en: "Customer-Centric Partnership", id: "Kemitraan Berpusat pada Klien", dEn: "Starting with client needs, we solve pain points with tailored solutions.", dId: "Bermula dari kebutuhan klien, kami menyelesaikan masalah dengan solusi khusus." },
    { en: "Impact", id: "Dampak", dEn: "Every product is crafted to last — a walking brand ambassador, not a throwaway.", dId: "Setiap produk dibuat untuk bertahan — duta merek berjalan, bukan barang sekali pakai." },
    { en: "Agility", id: "Kelincahan", dEn: "Fast, flexible and precise — from rush orders to large-scale campaigns.", dId: "Cepat, fleksibel, dan presisi — dari pesanan kilat hingga kampanye berskala besar." },
    { en: "Professional Excellence", id: "Keunggulan Profesional", dEn: "Operating with the rigour of a branding consultant: structured, detailed, perfection-driven.", dId: "Bekerja dengan ketelitian konsultan merek: terstruktur, detail, dan menuntut kesempurnaan." },
  ];

  // FR-10.5 — overridable from the admin; the code copy is the default.
  const heading = await pageCopy(
    "about.story", "heading", l,
    t("Merchandise should be more than gifts.",
      "Merchandise seharusnya lebih dari sekadar hadiah."),
  );
  const intro = await pageCopy(
    "about.story", "intro", l,
    t("It should be stories in motion. Walking brand ambassadors. It should deliver ROI, impact and memories — not waste.",
      "Ia seharusnya menjadi cerita yang bergerak. Duta merek berjalan. Ia harus memberi ROI, dampak, dan kenangan — bukan pemborosan."),
  );

  return (
    <>
      <Section className="pb-0">
        <Wrap>
          <div className="mx-auto max-w-[820px]">
            <Eyebrow accent>{t("About Kadokowe", "Tentang Kadokowe")}</Eyebrow>
            <h1 className="balance my-4 text-xl-display font-bold tracked-tight">
              {heading}
            </h1>
            <p className="font-editorial text-lede italic text-muted">
              {intro}
            </p>
          </div>
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Plate
              ratio="4 / 3.4"
              caption="Founders — Lanny Kwandy and Icabel Suwandy"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="flex flex-col justify-center gap-5">
              <Eyebrow accent>{t("The problem we saw", "Masalah yang kami lihat")}</Eyebrow>
              <p className="text-[1.0625rem] leading-relaxed">
                {t(
                  "For decades, companies spent heavily on promotional merchandise. Most of it ended up forgotten, wasted or irrelevant — because vendors offered the same generic products without understanding brand identity, production quality or campaign goals.",
                  "Selama puluhan tahun, perusahaan mengeluarkan biaya besar untuk merchandise promosi. Sebagian besar berakhir terlupakan, terbuang, atau tidak relevan — karena vendor menawarkan produk generik yang sama tanpa memahami identitas merek, kualitas produksi, atau tujuan kampanye.",
                )}
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                {t(
                  "Kadokowe was born from the fusion of decades of sourcing and manufacturing expertise with creative energy and brand storytelling — not to be another vendor, but a strategic merchandising partner.",
                  "Kadokowe lahir dari perpaduan puluhan tahun keahlian pengadaan dan manufaktur dengan energi kreatif serta penceritaan merek — bukan untuk menjadi vendor lain, melainkan mitra merchandising strategis.",
                )}
              </p>
            </div>
          </div>
        </Wrap>
      </Section>

      <Section tone="warm">
        <Wrap>
          <Eyebrow accent>{t("The people", "Orang-orangnya")}</Eyebrow>
          <ul className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-16">
            {[
              {
                name: "Lanny Kwandy",
                roleEn: "Founder — sourcing, manufacturing, brand strategy",
                roleId: "Pendiri — pengadaan, manufaktur, strategi merek",
                bioEn:
                  "Thirty years handling international buyers and partnerships including Yonex, Lotto, Disney and Debenhams, with a New Balance USA partnership factory signed in 2024. Since 2004, twenty years as a Retail & Franchise Consultant, helping brands scale from one outlet to thousands — and co-founding partner of Chipmunks Playland & Café, New Zealand, growing from three outlets to more than eighty franchises worldwide as their exclusive buying house.",
                bioId:
                  "Tiga puluh tahun menangani pembeli internasional dan kemitraan termasuk Yonex, Lotto, Disney, dan Debenhams, dengan pabrik kemitraan New Balance USA yang ditandatangani pada 2024. Sejak 2004, dua puluh tahun sebagai Konsultan Ritel & Waralaba, membantu merek berkembang dari satu gerai menjadi ribuan — sekaligus mitra pendiri Chipmunks Playland & Café, Selandia Baru, yang tumbuh dari tiga gerai menjadi lebih dari delapan puluh waralaba di seluruh dunia.",
                shot: "Portrait — Lanny Kwandy",
              },
              {
                name: "Icabel Suwandy",
                roleEn: "Digital marketing — content and engagement strategy",
                roleId: "Pemasaran digital — strategi konten dan keterlibatan",
                bioEn:
                  "Creative training from age thirteen at the New York Film Academy, Hollywood Studio — storytelling, scriptwriting, photography and videography. Now leads Kadokowe's digital marketing division, crafting engagement strategies that help brands connect with their audiences.",
                bioId:
                  "Pelatihan kreatif sejak usia tiga belas tahun di New York Film Academy, Hollywood Studio — penceritaan, penulisan naskah, fotografi, dan videografi. Kini memimpin divisi pemasaran digital Kadokowe, menyusun strategi keterlibatan yang membantu merek terhubung dengan audiensnya.",
                shot: "Portrait — Icabel Suwandy",
              },
            ].map((p) => (
              <li key={p.name} className="flex flex-col gap-4">
                <Plate ratio="4 / 3" caption={p.shot} sizes="(min-width: 1024px) 50vw, 100vw" />
                <h2 className="text-md-display font-semibold">{p.name}</h2>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red">
                  {t(p.roleEn, p.roleId)}
                </p>
                <p className="text-[0.875rem] leading-relaxed text-muted">
                  {t(p.bioEn, p.bioId)}
                </p>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <Eyebrow accent>{t("Vision", "Visi")}</Eyebrow>
                <p className="font-editorial text-[1.0625rem] italic">
                  {t(
                    "To be our clients' most trusted strategic merchandising partner by setting new standards of creativity, efficiency and brand value.",
                    "Menjadi mitra merchandising strategis paling tepercaya bagi klien kami dengan menetapkan standar baru kreativitas, efisiensi, dan nilai merek.",
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Eyebrow accent>{t("Mission", "Misi")}</Eyebrow>
                <p className="font-editorial text-[1.0625rem] italic">
                  {t(
                    "We transform budgets into brand-powered stories by merging creativity, technology and storytelling.",
                    "Kami mengubah anggaran menjadi cerita bertenaga merek dengan memadukan kreativitas, teknologi, dan penceritaan.",
                  )}
                </p>
              </div>
            </div>

            <div>
              <Eyebrow accent>{t("Core values", "Nilai inti")}</Eyebrow>
              <ul className="mt-5 flex flex-col">
                {values.map((v) => (
                  <li
                    key={v.en}
                    className="grid gap-1 border-t border-line py-4 last:border-b sm:grid-cols-[0.8fr_1.2fr] sm:gap-6"
                  >
                    <span className="text-[0.9375rem] font-semibold">{t(v.en, v.id)}</span>
                    <span className="text-[0.875rem] leading-relaxed text-muted">
                      {t(v.dEn, v.dId)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Wrap>
      </Section>

      <section className="bg-red py-14 text-paper md:py-20">
        <Wrap className="flex flex-col items-start gap-6">
          <h2 className="balance max-w-[26ch] text-xl-display font-bold tracked-tight">
            {t(
              "Most vendors give you products. We give you results.",
              "Kebanyakan vendor memberi Anda produk. Kami memberi Anda hasil.",
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
