import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, pick, pickArray, pickOptional, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { shareMetadata } from "@/lib/share";
import { isPreview, visibilityFilter, PreviewBanner } from "@/lib/preview";
import { JsonLd, productSchema } from "@/lib/structured-data";
import { SITE } from "@/lib/site";
import { Wrap, Section, Eyebrow, Tag } from "@/components/ui/Section";
import { Button, ArrowLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard } from "@/components/ProductCard";
import { AddToCart } from "@/components/cart/AddToCart";
import { packagingFor } from "@/lib/packaging";

/**
 * Product detail — FR-4.4 to FR-4.13.
 *
 * URL note: /products/{segment} is a product slug, while /products/{segment}/{term}
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

async function getProduct(slug: string, preview = false) {
  return db.product.findFirst({
    where: { slug, ...visibilityFilter(preview) },
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
}: PageProps<"/[locale]/products/[segment]">): Promise<Metadata> {
  const { locale, segment } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(segment);
  if (!product) return {};
  const l = locale as AppLocale;
  return shareMetadata({
    title: pick(product, "seoTitle", l) || pick(product, "name", l),
    description: pick(product, "seoDesc", l) || pick(product, "short", l),
    image: product.heroImage,
    path: localePath(`/products/${segment}`, l),
    locale: l,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/products/[segment]">) {
  const { locale, segment } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);
  const path = (p: string) => localePath(p, l);

  // FR-10.12 — a signed-in administrator sees drafts here; anyone else 404s.
  const preview = await isPreview();
  const product = await getProduct(segment, preview);
  if (!product) notFound();

  const packaging = await packagingFor(product.id, l);

  const name = pick(product, "name", l);
  const why = pickOptional(product, "why", l);
  const tags = pickArray(product, "tags", l);

  // The hero leads, then everything in the gallery, in one strip.
  //
  // The page used to show the first three beside the hero and push the rest
  // into the "Make It Yours" grid further down, so a product with six
  // photographs had them in two places and the fourth appeared to belong to a
  // different section. One gallery, one place.
  const media = [
    ...(product.heroImage
      ? [{ id: "hero", publicId: product.heroImage, kind: "IMAGE" as const,
           alt: name, caption: name }]
      : []),
    ...product.gallery.map((img) => ({
      id: img.id,
      publicId: img.publicId,
      kind: img.kind === "VIDEO" ? ("VIDEO" as const) : ("IMAGE" as const),
      alt: pickOptional(img, "alt", l),
      caption: pickOptional(img, "caption", l),
    })),
  ];


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
    <>
      {preview && product.visibility !== "PUBLISHED" && (
        <PreviewBanner status={product.visibility} />
      )}
    <Section>
      {/* NFR-6.4 — no offers block: price must never lead (FR-4.3), and an
          offers block puts one straight into the search result. */}
      <JsonLd
        data={productSchema({
          name: pick(product, "name", l),
          description: pickOptional(product, "short", l),
          url: `${SITE.url}${path(`/products/${segment}`)}`,
          material: product.material,
        })}
      />
      <Wrap>
        <ArrowLink href={path("/products")} className="mb-8">
          {t("Back to the Product Library", "Kembali ke Pustaka Produk")}
        </ArrowLink>

        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Gallery */}
          <div className="lg:sticky lg:top-24">
            {media.length > 0 ? (
              <ProductGallery
                media={media}
                name={name}
                badge={
                  product.availability === "READY_STOCK"
                    ? t("Ready when you are", "Siap saat Anda siap")
                    : null
                }
                labels={{
                  gallery: t("Product photographs", "Foto produk"),
                  video: t("video", "video"),
                  showing: t("Showing", "Menampilkan"),
                }}
              />
            ) : (
              <Plate
                publicId={null}
                alt={name}
                caption={name}
                ratio="4 / 3.6"
                sizes="(min-width: 1024px) 52vw, 100vw"
                priority
              />
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
                        href={path(`/products/purpose/${p.slugEn}`)}
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
                Custom Made family pages so the two read as one idea. It now
                carries the branding methods alone: the mockups it used to show
                were gallery images past the third, and they belong with the
                rest of the photography rather than in a second grid. */}
            {product.customisation.length > 0 && (
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

            {/* The cart collects products into one request. It is still not
                commerce — nothing is charged and nothing is reserved — so the
                line beneath says what it actually does. */}
            <div className="flex flex-col gap-3 pt-2">
              <AddToCart
                slug={product.slug}
                options={packaging}
                basePrice={product.indicativePrice}
                basePriceMax={product.indicativePriceMax}
                labels={{
                  branding: t("Branding", "Branding"),
                  packaging: t("Packaging", "Kemasan"),
                  none: t("Leave both empty for the product on its own.", "Kosongkan keduanya untuk produk saja."),
                  quantity: t("Quantity", "Jumlah"),
                  add: t("I'm Interested", "Saya Tertarik"),
                  added: t("Added.", "Ditambahkan."),
                  viewCart: t("View interests", "Lihat minat"),
                  quoted: t("Quoted", "Ditawarkan"),
                  from: t("Per unit", "Per unit"),
                }}
              />
              <Button
                href={path(`/start-a-project?product=${product.slug}`)}
                variant="ghost"
                className="w-full"
              >
                {t("Or tell us about the project →", "Atau ceritakan proyeknya →")}
              </Button>
              <p className="text-center font-editorial text-xs italic text-muted">
                {t(
                  "Nothing is charged here. Your interests become a brief we quote against.",
                  "Tidak ada pembayaran di sini. Daftar minat Anda menjadi brief yang kami tawarkan harganya.",
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
              <ArrowLink href={path("/products")}>
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
    </>
  );
}

/** Pre-render published products; the filtered views resolve at request time. */
/**
 * How many products are built ahead of time.
 *
 * Not the whole catalogue. Prerendering every product in both languages means
 * two pages per product on every deploy, each with its own database queries
 * and its own set of Cloudinary derivatives — a thousand products is two
 * thousand pages built whether or not anyone ever asks for them, and it is
 * what makes a build slow enough to exhaust the database's connections.
 *
 * `dynamicParams` stays true, so anything outside this set is rendered on the
 * first request and cached from then on. The difference is only ever when a
 * page is built, never whether it works.
 *
 * Raise it if the catalogue is small enough that build time does not matter.
 */
const PRERENDERED_PRODUCTS = 150;

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { visibility: "PUBLISHED" },
    // The ones most likely to be asked for first: featured, then new, then
    // whatever was added most recently.
    orderBy: [
      { featured: "desc" },
      { isNew: "desc" },
      { createdAt: "desc" },
    ],
    take: PRERENDERED_PRODUCTS,
    select: { slug: true },
  });
  return products.flatMap((p) =>
    ["en", "id"].map((locale) => ({ locale, segment: p.slug })),
  );
}

export const dynamicParams = true;
