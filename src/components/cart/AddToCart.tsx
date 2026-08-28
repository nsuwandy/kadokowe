"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/useCart";
import { formatPrice } from "@/lib/price";
import type { PackagingChoice } from "@/lib/packaging";

/**
 * Choose an add-on, a quantity, and put it in the cart — FR-4.x, FR-6.x.
 *
 * The add-ons are radio buttons rather than a dropdown. There are eleven of
 * them, they carry prices that differ, and a closed control would hide the
 * one thing worth comparing. The sub-constructions are indented under their
 * group and selectable in their own right, since "custom paper packaging" is
 * a family and hardbox is the actual choice.
 *
 * A quote-only option shows no price at all. Writing "Rp 0" or "free" against
 * something that will be charged is worse than saying nothing, and the cart
 * carries the consequence forward: one quoted line and the whole basket is
 * sent as a request rather than an estimate.
 */
export function AddToCart({
  slug,
  options,
  basePrice,
  basePriceMax,
  labels,
}: {
  slug: string;
  options: PackagingChoice[];
  basePrice: number | null;
  basePriceMax: number | null;
  labels: {
    heading: string;
    none: string;
    quantity: string;
    add: string;
    added: string;
    viewCart: string;
    quoted: string;
    from: string;
  };
}) {
  const { add } = useCart();
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const flat = options.flatMap((o) => [o, ...o.children]);
  const chosen = flat.find((o) => o.id === packagingId) ?? null;
  const quoteOnly = chosen?.quoteOnly ?? false;

  const unit = basePrice === null ? null : basePrice + (chosen?.priceDelta ?? 0);
  const unitMax =
    basePriceMax === null ? null : basePriceMax + (chosen?.priceDelta ?? 0);

  const submit = () => {
    add({ slug, quantity, packagingId });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 4000);
  };

  const row = (option: PackagingChoice, nested: boolean) => (
    <label
      key={option.id}
      className={`flex cursor-pointer items-baseline gap-3 border-t border-line py-2.5 text-sm ${nested ? "pl-7" : ""}`}
    >
      <input
        type="radio"
        name="packaging"
        checked={packagingId === option.id}
        onChange={() => setPackagingId(option.id)}
        className="mt-1 accent-red"
      />
      <span className="flex-1">{option.name}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted">
        {option.quoteOnly
          ? labels.quoted
          : option.priceDelta
            ? `+ ${formatPrice(option.priceDelta)}`
            : "—"}
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-5 border border-line bg-paper p-6">
      {options.length > 0 && (
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
            {labels.heading}
          </legend>
          <label className="flex cursor-pointer items-baseline gap-3 py-2.5 text-sm">
            <input
              type="radio"
              name="packaging"
              checked={packagingId === null}
              onChange={() => setPackagingId(null)}
              className="mt-1 accent-red"
            />
            <span className="flex-1">{labels.none}</span>
          </label>
          {options.map((option) => (
            <div key={option.id}>
              {row(option, false)}
              {option.children.map((child) => row(child, true))}
            </div>
          ))}
        </fieldset>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
            {labels.quantity}
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-28 border border-line px-3 py-2.5 text-sm tabular-nums outline-none focus:border-red"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
            {quoteOnly ? "" : labels.from}
          </span>
          <span className="text-md-display font-semibold tabular-nums">
            {quoteOnly || unit === null
              ? labels.quoted
              : formatPrice(unit, unitMax)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={submit}
          className="bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink"
        >
          {labels.add}
        </button>
        {justAdded && (
          <span role="status" className="text-sm">
            {labels.added}{" "}
            <Link href="/cart" className="font-semibold text-red hover:underline">
              {labels.viewCart}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
