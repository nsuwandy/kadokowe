import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickArray, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { shareMetadata } from "@/lib/share";
import { JsonLd, productSchema } from "@/lib/structured-data";
import { SITE } from "@/lib/site";
import { Wrap, Section, Eyebrow, Tag } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { ProductCard } from "@/components/ProductCard";

/**
 * Product detail — FR-4.4 to FR-4.13.
 *
 * URL note: /ideas/{segment} is a product slug, while /ideas/{segment}/{term}
 * is an axis-filtered view. SRS §6.2 specifies both shapes, so position one
 * serves double duty and the segment is named neutrally rather than as
 * `[slug]` or `[axis]`.
 */

const AVAILABILITY_LABEL: Record<string, { en: string; id: string }> = {
  READY_STOCK: { en: "Ready stock", id: "Stok siap" },
  LOCAL_PRODUCTION: { en: "Local production", id: "Produksi lokal" },
  IMPORT_SOURCING: { en: "Import & sourcing", id: "Impor & pengadaan" },
  CUSTOM_MADE: { en: "Custom made", id: "Dibuat khusus" },
};

async function getProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, visibility: "PUBLISHED" },
    include: {
      terms: true,
      gallery: { orderBy: { sortOrder: "asc" } },
      projects: {
        where: { visibility: "PUBLISHED" },
        select: { slug: true, titleEn: true, titleId: true, client: true },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ideas/[segment]">): Promise<Metadata> {
  const { locale, segment } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(segment);
  if (!product) return {};
  const l = locale as AppLocale;
  return shareMetadata({
    title: pick(product, "seoTitle", l) || pick(product, "name", l),
    description: pick(product, "seoDesc", l) || pick(product, "short", l),
    image: product.heroImage,
    path: localePath(`/ideas/${segment}`, l),
    locale: l,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/ideas/[segment]">) {
  const { locale, segment } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  const product = await getProduct(segment);
  if (!product) notFound();

  // The first three gallery images sit beside the hero; anything beyond them
  // is treated as branded mockups for "Make It Yours" (FR-4.9).
  const mockups = product.gallery.slice(3);

  const name = pick(product, "name", l);
  const why = pickOptional(product, "why", l);
  const tags = pickArray(product, "tags", l);

  // "Best For" is the Purpose axis surfaced under a client-facing label —
  // FR-4.6. Purposes are how a visitor without a product in mind navigates.
  const purposes = product.terms.filter((term) => term.axis === "PURPOSE");
  const availability = AVAILABILITY_LABEL[product.availability];

  const related = await db.product.findMany({
    where: {
      visibility: "PUBLISHED",
      slug: { not: product.slug },
      terms: { some: { id: { in: product.terms.map((x) => x.id) } } },
    },
    take: 4,
    select: {
      slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
      tagsEn: true, tagsId: true, heroImage: true, availability: true,
    },
  });

  const specs = [
    { label: t("Material", "Bahan"), value: product.material },
    { label: t("Capacity", "Kapasitas"), value: product.capacity },
    { label: t("Dimensions", "Dimensi"), value: product.dimensions },
    {
      label: t("Colours", "Warna"),
      value: product.colours.length ? product.colours.join(", ") : null,
    },
    {
      label: t("Minimum order", "Pesanan minimum"),
      value: product.moq ? `${product.moq} pcs` : null,
    },
    { label: t("Indicative lead time", "Perkiraan waktu"), value: product.leadTime },
    {
      label: t("Availability", "Ketersediaan"),
      value: availability ? t(availability.en, availability.id) : null,
    },
  ].filter((s) => s.value);

  return (
    <Section>
      {/* NFR-6.4 — no offers block: price must never lead (FR-4.3), and an
          offers block puts one straight into the search result. */}
      <JsonLd
        data={productSchema({
          name: pick(product, "name", l),
          description: pickOptional(product, "short", l),
          url: `${SITE.url}${path(`/ideas/${segment}`)}`,
          material: product.material,
        })}
      />
      <Wrap>
        <ArrowLink href={path("/ideas")} className="mb-8">
          {t("Back to the Idea Library", "Kembali ke Pustaka Ide")}
        </ArrowLink>

        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-24">
            <div className="relative">
              <Plate
                publicId={product.heroImage}
                alt={name}
                caption={name}
                ratio="4 / 3.6"
                sizes="(min-width: 1024px) 52vw, 100vw"
                priority
              />
              {product.availability === "READY_STOCK" && (
                <span className="absolute top-0 left-0 z-2 bg-red px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-paper">
                  {t("Ready when you are", "Siap saat Anda siap")}
                </span>
              )}
            </div>
            {product.gallery.length > 0 && (
              <ul className="grid grid-cols-3 gap-3">
                {product.gallery.slice(0, 3).map((img) => (
                  <li key={img.id}>
                    <Plate
                      publicId={img.publicId}
                      alt={pick(img, "alt", l)}
                      caption={pick(img, "caption", l)}
                      ratio="1 / 1"
                      sizes="18vw"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              )}
              <h1 className="balance text-xl-display font-bold tracked-tight">
                {name}
              </h1>
            </div>

            {/* FR-4.5 — the field that separates a library from a price list. */}
            {why && (
              <div className="border-t-2 border-red bg-warm px-7 py-6">
                <Eyebrow accent>{t("Why we like it", "Mengapa kami menyukainya")}</Eyebrow>
                <p className="mt-2 font-editorial text-[1.0625rem] leading-relaxed">
                  {why}
                </p>
              </div>
            )}

            {purposes.length > 0 && (
              <div className="flex flex-col gap-3">
                <Eyebrow>{t("Best for", "Paling cocok untuk")}</Eyebrow>
                <ul className="flex flex-wrap gap-2">
                  {purposes.map((p) => (
                    <li key={p.id}>
                      <a
                        href={path(`/ideas/purpose/${p.slugEn}`)}
                        className="block border border-line bg-warm px-4 py-2 text-xs font-semibold transition-colors hover:border-ink"
                      >
                        {pick(p, "name", l)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {specs.length > 0 && (
              <div className="flex flex-col gap-3">
                <Eyebrow>{t("Product information", "Informasi produk")}</Eyebrow>
                <dl className="w-full text-sm">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="grid grid-cols-[42%_1fr] border-b border-line py-3"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                        {s.label}
                      </dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* FR-4.9 — "Make It Yours", named to match the same section on the
                Custom Made family pages so the two read as one idea. Mockups
                are any gallery images past the three shown beside the hero:
                they exist to show the product carrying a brand, which is the
                point of the section and what the chips alone cannot do. */}
            {(product.customisation.length > 0 || mockups.length > 0) && (
              <div className="flex flex-col gap-3">
                <Eyebrow>{t("Make It Yours", "Jadikan Milik Anda")}</Eyebrow>
                {product.customisation.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {product.customisation.map((c) => (
                      <li
                        key={c}
                        className="border border-line bg-warm px-4 py-2 text-xs font-semibold"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
                {mockups.length > 0 && (
                  <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {mockups.map((image) => (
                      <li key={image.id}>
                        <Plate
                          publicId={image.publicId}
                          alt={pickOptional(image, "alt", l) ?? pick(product, "name", l)}
                          caption={pickOptional(image, "caption", l) ?? undefined}
                          ratio="4 / 3"
                          sizes="(min-width: 640px) 20vw, 45vw"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {product.projects.length > 0 && (
              <div className="flex flex-col gap-3">
                <Eyebrow accent>{t("See it in action", "Lihat dalam praktik")}</Eyebrow>
                <ul className="flex flex-col gap-2">
                  {product.projects.map((pr) => (
                    <li key={pr.slug}>
                      <ArrowLink href={path(`/our-work/${pr.slug}`)}>
                        {pr.client} — {pick(pr, "title", l)}
                      </ArrowLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* FR-4.10 / FR-4.11 — the only action, and it is not commerce. */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                href={path(`/start-a-project?product=${product.slug}`)}
                className="w-full"
              >
                {t("Develop This For My Brand →", "Kembangkan Ini Untuk Merek Saya →")}
              </Button>
              <p className="text-center font-editorial text-xs italic text-muted">
                {t(
                  "No cart. No checkout. We quote once we understand the campaign.",
                  "Tanpa keranjang. Tanpa checkout. Kami menawarkan harga setelah memahami kampanye Anda.",
                )}
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20 border-t border-line pt-12">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-lg-display font-bold tracked-tight">
                {t("Explore alternative ideas", "Jelajahi ide alternatif")}
              </h2>
              <ArrowLink href={path("/ideas")}>
                {t("All ideas", "Semua ide")}
              </ArrowLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} locale={l} sizes="25vw" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Wrap>
    </Section>
  );
}

/** Pre-render published products; the filtered views resolve at request time. */
export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { visibility: "PUBLISHED" },
    select: { slug: true },
  });
  return products.flatMap((p) =>
    ["en", "id"].map((locale) => ({ locale, segment: p.slug })),
  );
}

export const dynamicParams = true;
