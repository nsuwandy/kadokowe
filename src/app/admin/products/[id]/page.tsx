import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import type { ProductPackagingRow } from "@/lib/product-form";
import { saveProduct } from "../actions";

/**
 * Product editor — FR-10.2.
 *
 * `new` is handled by this same route rather than a separate /new page, so the
 * create and edit forms cannot drift apart: one component, one action, one set
 * of fields. Separate pages are how half the fields end up missing on creation
 * and only appearing on edit.
 */
export default async function ProductEditor({
  params,
}: PageProps<"/admin/products/[id]">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const isNew = id === "new";

  const product = isNew
    ? null
    : await db.product.findUnique({
        where: { id },
        include: {
          terms: { select: { id: true } },
          gallery: { orderBy: { sortOrder: "asc" } },
        },
      });

  if (!isNew && !product) notFound();

  // Every option, plus whatever this product has already priced. The
  // catalogue figure is carried through as the placeholder, so a blank box is
  // visibly "falls back to Rp X" rather than "costs nothing".
  const [options, overrides] = await Promise.all([
    db.packagingOption.findMany({
      where: { visibility: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true, nameEn: true, pricing: true, priceDelta: true, parentId: true,
      },
    }),
    isNew
      ? Promise.resolve([])
      : db.productPackaging.findMany({
          where: { productId: id },
          select: { optionId: true, priceDelta: true },
        }),
  ]);

  const overrideBy = new Map(overrides.map((o) => [o.optionId, o.priceDelta]));
  const shapeOption = (o: (typeof options)[number], isChild: boolean): ProductPackagingRow => {
    const own = overrideBy.get(o.id);
    return {
      id: o.id,
      name: o.nameEn,
      quoteOnly: o.pricing === "QUOTE",
      priceDelta: own === undefined || own === null ? "" : String(own),
      defaultDelta: o.priceDelta,
      isChild,
    };
  };

  // Each group followed by what is inside it, as on the Packaging page.
  const childrenOf = new Map<string, typeof options>();
  for (const o of options) {
    if (!o.parentId) continue;
    const list = childrenOf.get(o.parentId) ?? [];
    list.push(o);
    childrenOf.set(o.parentId, list);
  }
  const packaging: ProductPackagingRow[] = options
    .filter((o) => !o.parentId)
    .flatMap((o) => [
      shapeOption(o, false),
      ...(childrenOf.get(o.id) ?? []).map((c) => shapeOption(c, true)),
    ]);

  const terms = await db.taxonomyTerm.findMany({
    orderBy: [{ axis: "asc" }, { sortOrder: "asc" }],
    select: { id: true, axis: true, nameEn: true, slugEn: true },
  });

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <Link href="/admin/products" className="text-xs font-semibold text-red hover:underline">
        ← All products
      </Link>

      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">
          {isNew ? "Add product" : product!.nameEn}
        </h1>
        {product && (
          <Link
            href={
              product.visibility === "PUBLISHED"
                ? `/products/${product.slug}`
                : `/api/draft/enable?next=${encodeURIComponent(`/products/${product.slug}`)}`
            }
            target="_blank"
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            {product.visibility === "PUBLISHED" ? "View on site ↗" : "Preview ↗"}
          </Link>
        )}
      </div>

      <ProductForm
        action={saveProduct}
        terms={terms}
        packaging={packaging}
        product={
          product
            ? {
                id: product.id,
                slug: product.slug,
                nameEn: product.nameEn,
                nameId: product.nameId,
                shortEn: product.shortEn,
                shortId: product.shortId,
                whyEn: product.whyEn,
                whyId: product.whyId,
                material: product.material,
                dimensions: product.dimensions,
                capacity: product.capacity,
                colours: product.colours,
                moq: product.moq,
                leadTime: product.leadTime,
                customisation: product.customisation,
                availability: product.availability,
                indicativePrice: product.indicativePrice,
                indicativePriceMax: product.indicativePriceMax,
                tagsEn: product.tagsEn,
                tagsId: product.tagsId,
                heroImage: product.heroImage,
                gallery: product.gallery.map((g) => ({
                  publicId: g.publicId,
                  altEn: g.altEn ?? "",
                })),
                seoTitleEn: product.seoTitleEn,
                seoTitleId: product.seoTitleId,
                seoDescEn: product.seoDescEn,
                seoDescId: product.seoDescId,
                featured: product.featured,
                isNew: product.isNew,
                visibility: product.visibility,
                termIds: product.terms.map((t) => t.id),
              }
            : null
        }
      />
    </div>
  );
}
