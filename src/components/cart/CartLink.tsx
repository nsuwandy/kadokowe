"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/useCart";
import { localePath } from "@/lib/nav";
import type { AppLocale } from "@/lib/i18n";

/**
 * The cart's place in the header.
 *
 * Hidden entirely while the cart is empty. A permanent empty-cart icon is
 * shop furniture, and this is not a shop — it earns its place in the header
 * only once someone has actually collected something.
 */
export function CartLink({ locale }: { locale: AppLocale }) {
  const { count } = useCart();
  if (count === 0) return null;

  return (
    <Link
      href={localePath("/cart", locale)}
      className="inline-flex items-center gap-2 border border-line px-3 py-2 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.11em] whitespace-nowrap transition-colors hover:border-ink"
    >
      {locale === "id" ? "Keranjang" : "Cart"}
      <span className="bg-red px-1.5 py-0.5 text-[0.625rem] font-bold tabular-nums text-paper">
        {count}
      </span>
    </Link>
  );
}
