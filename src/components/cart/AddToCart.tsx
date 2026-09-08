"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/useCart";
import { formatPrice } from "@/lib/price";
import { splitAddOns, type PackagingChoice } from "@/lib/add-ons";

/**
 * Choose an add-on, a quantity, and put it in the cart — FR-4.x, FR-6.x.
 *
 * The add-ons are checkboxes. Engraving and a hardbox are not alternatives,
 * and offering them as though they were forced a buyer to describe half of
 * what they wanted. They are not a dropdown either: there are eleven, they
 * carry prices that differ, and a closed control hides the one thing worth
 * comparing.
 *
 * A family with constructions beneath it is a heading rather than a choice.
 * Ticking "custom paper packaging" and "hardbox packaging" together says the
 * same thing twice, and the construction is what anyone actually means.
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
    branding: string;
    packaging: string;
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
  const [picked, setPicked] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const { branding, packaging } = splitAddOns(options);

  // A family with constructions beneath it is not itself selectable.
  const selectable = options.flatMap((o) =>
    o.children.length > 0 ? o.children : [o],
  );
  const chosen = selectable.filter((o) => picked.includes(o.id));

  // One quoted add-on makes the whole line quoted: the price of a product
  // with engraving and a hardbox is not the price of the engraving.
  const quoteOnly = chosen.some((o) => o.quoteOnly);
  const delta = chosen.reduce((sum, o) => sum + (o.priceDelta ?? 0), 0);

  const unit = basePrice === null ? null : basePrice + delta;
  const unitMax = basePriceMax === null ? null : basePriceMax + delta;

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const submit = () => {
    // Sent in the order they are offered, so the same choices always read the
    // same way wherever they are shown.
    add({
      slug,
      quantity,
      packagingIds: selectable.filter((o) => picked.includes(o.id)).map((o) => o.id),
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 4000);
  };

  const row = (option: PackagingChoice, nested: boolean) => (
    <label
      key={option.id}
      className={`flex cursor-pointer items-baseline gap-3 border-t border-line py-2.5 text-sm ${nested ? "pl-7" : ""}`}
    >
      <input
        type="checkbox"
        checked={picked.includes(option.id)}
        onChange={() => toggle(option.id)}
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

  /** A family heading: names the group, offers nothing to tick. */
  const group = (option: PackagingChoice) => (
    <p
      key={`${option.id}-heading`}
      className="border-t border-line pt-3 pb-1 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted"
    >
      {option.name}
    </p>
  );

  return (
    <div className="flex flex-col gap-5 border border-line bg-paper p-6">
      {/* Two lists, not one. What is done to the product and what the product
          goes in are separate decisions, and running them together as eleven
          undifferentiated tick boxes made the buyer sort them out. */}
      {([
        [labels.branding, branding],
        [labels.packaging, packaging],
      ] as const).map(([legend, list]) =>
        list.length === 0 ? null : (
          <fieldset key={legend} className="flex flex-col">
            <legend className="mb-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
              {legend}
            </legend>
            {list.map((option) =>
              option.children.length > 0 ? (
                <div key={option.id}>
                  {group(option)}
                  {option.children.map((child) => row(child, true))}
                </div>
              ) : (
                <div key={option.id}>{row(option, false)}</div>
              ),
            )}
          </fieldset>
        ),
      )}

      {options.length > 0 && (
        <p className="-mt-1 text-xs text-muted">{labels.none}</p>
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
