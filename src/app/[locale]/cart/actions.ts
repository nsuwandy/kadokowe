"use server";

import { db } from "@/lib/db";
import { pick, type AppLocale } from "@/lib/i18n";
import { packagingFor, flattenPackaging } from "@/lib/packaging";
import type { CartLine, ResolvedLine } from "@/lib/cart";

/**
 * Turn the identifiers held in the browser into something displayable.
 *
 * Prices are resolved here, on every view, rather than being stored alongside
 * the cart. A cart left open in a tab for a fortnight would otherwise quote a
 * price that has since moved, and the first anyone would learn of it is a
 * customer holding a PDF that disagrees with the quotation.
 */
export async function resolveCart(
  lines: CartLine[],
  locale: AppLocale,
): Promise<ResolvedLine[]> {
  if (lines.length === 0) return [];

  const slugs = [...new Set(lines.map((l) => l.slug))];
  const products = await db.product.findMany({
    where: { slug: { in: slugs }, visibility: "PUBLISHED" },
    select: {
      id: true, slug: true, nameEn: true, nameId: true,
      heroImage: true, indicativePrice: true, indicativePriceMax: true,
    },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Packaging is resolved per product, because a product may carry its own
  // price for an option the rest of the catalogue shares.
  const packagingByProduct = new Map(
    await Promise.all(
      products.map(async (p) =>
        [p.id, flattenPackaging(await packagingFor(p.id, locale))] as const,
      ),
    ),
  );

  const resolved: ResolvedLine[] = [];
  for (const line of lines) {
    const product = bySlug.get(line.slug);
    // A product unpublished or deleted since it was added simply drops out.
    // Carrying a line nobody can buy through to a quotation helps no one.
    if (!product) continue;

    const options = packagingByProduct.get(product.id) ?? [];
    const option = line.packagingId
      ? options.find((o) => o.id === line.packagingId) ?? null
      : null;

    const quoteOnly = option?.quoteOnly ?? false;
    const base = product.indicativePrice;
    const baseMax = product.indicativePriceMax;
    const delta = option?.priceDelta ?? 0;

    resolved.push({
      slug: product.slug,
      name: pick(product, "name", locale),
      heroImage: product.heroImage,
      quantity: line.quantity,
      packagingId: option?.id ?? null,
      packagingName: option?.name ?? null,
      // A product with no indicative price is itself a quotation, add-on or
      // not — there is no figure to build on.
      unitPrice: quoteOnly || base === null ? null : base + delta,
      unitPriceMax: quoteOnly || baseMax === null ? null : baseMax + delta,
      quoteOnly: quoteOnly || base === null,
    });
  }
  return resolved;
}
