import "server-only";
import { db } from "./db";
import type { AppLocale } from "./i18n";
import { pick } from "./i18n";

/**
 * Packaging and decoration add-ons offered on a product — FR-4.x.
 *
 * Two kinds sit in one tree. The priced decoration methods carry an uplift per
 * unit; the packaging types carry none, because quantity, material and artwork
 * decide them and inventing a number would be worse than admitting we cannot
 * yet give one. The cart treats the two differently and the buyer is told
 * which is which, rather than being shown a total that quietly excludes half
 * of what they picked.
 */

export type PackagingChoice = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Null when this option has to be quoted. */
  priceDelta: number | null;
  quoteOnly: boolean;
  children: PackagingChoice[];
};

const SELECT = {
  id: true, slug: true, nameEn: true, nameId: true,
  descEn: true, descId: true, pricing: true, priceDelta: true,
  parentId: true, sortOrder: true, appliesToAll: true, visibility: true,
} as const;

type Row = {
  id: string; slug: string; nameEn: string; nameId: string | null;
  descEn: string | null; descId: string | null;
  pricing: string; priceDelta: number | null;
  parentId: string | null; sortOrder: number;
};

function shape(row: Row, locale: AppLocale, override: number | null): PackagingChoice {
  const quoteOnly = row.pricing === "QUOTE";
  return {
    id: row.id,
    slug: row.slug,
    name: pick({ nameEn: row.nameEn, nameId: row.nameId }, "name", locale),
    description:
      pick({ descEn: row.descEn, descId: row.descId }, "desc", locale) || null,
    // A per-product override wins, then the option's own figure. Quote-only
    // options carry no price at all, whatever is stored against them.
    priceDelta: quoteOnly ? null : (override ?? row.priceDelta ?? 0),
    quoteOnly,
    children: [],
  };
}

/**
 * Everything on offer for one product, as a tree.
 *
 * The four defaults are not stored per product: an option marked
 * `appliesToAll` is offered everywhere, and a ProductPackaging row exists only
 * to add something product-specific or to change a price for this product
 * alone. A thousand products would otherwise mean four thousand join rows
 * saying the same thing.
 */
export async function packagingFor(
  productId: string,
  locale: AppLocale,
): Promise<PackagingChoice[]> {
  const [options, overrides] = await Promise.all([
    db.packagingOption.findMany({
      where: { visibility: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: SELECT,
    }),
    db.productPackaging.findMany({
      where: { productId },
      select: { optionId: true, priceDelta: true },
    }),
  ]);

  const overrideBy = new Map(overrides.map((o) => [o.optionId, o.priceDelta]));
  const offered = options.filter(
    (o) => o.appliesToAll || overrideBy.has(o.id),
  );
  const offeredIds = new Set(offered.map((o) => o.id));

  const byId = new Map<string, PackagingChoice>();
  for (const row of offered) {
    byId.set(row.id, shape(row, locale, overrideBy.get(row.id) ?? null));
  }

  const roots: PackagingChoice[] = [];
  for (const row of offered) {
    const node = byId.get(row.id)!;
    // A child whose parent is not offered is promoted rather than dropped —
    // losing it silently would be a worse answer than showing it flat.
    const parent = row.parentId && offeredIds.has(row.parentId)
      ? byId.get(row.parentId)
      : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Flattened, for looking a choice up by id when a cart line is submitted. */
export function flattenPackaging(tree: PackagingChoice[]): PackagingChoice[] {
  return tree.flatMap((node) => [node, ...flattenPackaging(node.children)]);
}
