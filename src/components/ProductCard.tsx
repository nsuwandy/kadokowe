import Link from "next/link";
import { Plate } from "@/components/ui/Plate";
import { Tag } from "@/components/ui/Section";
import { pick, pickArray, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * Product card — FR-4.1 to FR-4.3.
 *
 * Three prohibitions shape this component, and all three are easy to erode:
 *
 *   1. No price as a primary element (FR-4.3). Pricing here is
 *      quantity-dependent and meaningless without a conversation.
 *   2. No commerce action (FR-4.2). The call is "Explore Idea", never "Buy"
 *      or "Add to Cart" — the site has no cart at all.
 *   3. The idea-led line leads (FR-4.1). It is the sentence that makes this a
 *      library rather than a price list.
 *
 * The card is the most-repeated component on the site, so any drift here
 * propagates everywhere. SRS §3.2 supplies the review test: does this look
 * like Kadokowe is selling products?
 */
export type ProductCardData = {
  slug: string;
  nameEn: string;
  nameId: string | null;
  shortEn: string;
  shortId: string | null;
  tagsEn: string[];
  tagsId: string[];
  heroImage: string | null;
  availability: string;
};

export function ProductCard({
  product,
  locale,
  wide = false,
  sizes = "(min-width: 1100px) 25vw, (min-width: 780px) 33vw, 50vw",
}: {
  product: ProductCardData;
  locale: AppLocale;
  /** Editorial variation — every seventh card spans two columns (FR-3.8). */
  wide?: boolean;
  sizes?: string;
}) {
  const name = pick(product, "name", locale);
  const short = pick(product, "short", locale);
  const tags = pickArray(product, "tags", locale).slice(0, 3);
  const readyStock = product.availability === "READY_STOCK";

  return (
    <Link
      href={localePath(`/ideas/${product.slug}`, locale)}
      className={cn("group flex flex-col gap-3", wide && "sm:col-span-2")}
    >
      <div className="relative">
        <Plate
          publicId={product.heroImage}
          alt={name}
          caption={name}
          ratio={wide ? "16 / 8.6" : "3 / 3.3"}
          sizes={sizes}
          className="transition-opacity duration-200 group-hover:opacity-88"
        />
        {/* FR-3.15 — the badge, positioned as "Ready when you are." */}
        {readyStock && (
          <span className="absolute top-0 left-0 z-2 bg-red px-2.5 py-1.5 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-paper">
            {locale === "id" ? "Stok Siap" : "Ready Stock"}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      <h3 className="text-base font-semibold transition-colors group-hover:text-red">
        {name}
      </h3>

      {short && (
        <p className="font-editorial text-[0.9375rem] leading-snug italic text-muted">
          {short}
        </p>
      )}
    </Link>
  );
}
