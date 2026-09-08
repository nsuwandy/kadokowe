/**
 * The cart — FR-6.x, replacing the Phase 2 Idea Board.
 *
 * A cart here is a request for a quotation, not an order. Nothing is charged,
 * nothing is reserved, and the totals are indicative: Kadokowe quotes rather
 * than lists (FR-4.3), and half the packaging options carry no list price at
 * all. What the cart actually produces is a brief — a list of products, how
 * many of each, and what should be done to them.
 *
 * Only the identifiers live in the browser. Names, prices and packaging are
 * resolved on the server every time the cart is opened, so a cart left in a
 * tab for a fortnight cannot quote a price that has since changed.
 */

export const CART_STORAGE_KEY = "kadokowe.cart.v1";
export const CART_MAX_LINES = 40;

/** What the browser stores: identity and intent, nothing derived. */
export type CartLine = {
  slug: string;
  quantity: number;
  /**
   * Every add-on chosen, in the order they are offered. More than one is
   * normal — engraving and a hardbox are not alternatives, and offering them
   * as though they were forced a buyer to describe half of what they wanted.
   */
  packagingIds: string[];
};

/** What the server sends back for display. */
export type ResolvedLine = {
  slug: string;
  name: string;
  heroImage: string | null;
  quantity: number;
  packagingIds: string[];
  packagingNames: string[];
  /** Per unit, add-on included. Null when the line has to be quoted. */
  unitPrice: number | null;
  unitPriceMax: number | null;
  quoteOnly: boolean;
};

export type CartTotals = {
  /** Null when any line is quote-only — see below. */
  total: number | null;
  totalMax: number | null;
  quoteOnly: boolean;
  lines: number;
  units: number;
};

/**
 * One quote-only line suppresses the whole total.
 *
 * A total that silently excluded the quoted lines would be read as the price
 * of the basket, and it is not — it is the price of part of it. Showing the
 * partial figure is the kind of accuracy that misleads, so the cart says
 * plainly that the order will be quoted rather than offering a number that
 * will not survive contact with the quotation.
 */
export function cartTotals(lines: ResolvedLine[]): CartTotals {
  const units = lines.reduce((n, l) => n + l.quantity, 0);
  const quoteOnly = lines.some((l) => l.quoteOnly || l.unitPrice === null);

  if (quoteOnly) {
    return { total: null, totalMax: null, quoteOnly: true, lines: lines.length, units };
  }

  let total = 0;
  let totalMax = 0;
  let hasRange = false;
  for (const line of lines) {
    total += (line.unitPrice ?? 0) * line.quantity;
    // A line priced as a range contributes its span, so a basket of ranges
    // reads as a span rather than collapsing to a single false figure.
    const upper = line.unitPriceMax ?? line.unitPrice ?? 0;
    if (line.unitPriceMax !== null) hasRange = true;
    totalMax += upper * line.quantity;
  }

  return {
    total,
    totalMax: hasRange ? totalMax : null,
    quoteOnly: false,
    lines: lines.length,
    units,
  };
}

/** Read the stored cart. Never throws: storage can be blocked or stale. */
export function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine =>
        !!l && typeof l === "object" &&
        typeof (l as { slug?: unknown }).slug === "string" &&
        Number.isFinite((l as { quantity?: unknown }).quantity))
      .map((l) => {
        // Carts written before add-ons became multiple stored a single
        // packagingId. Read them rather than discarding them: someone with a
        // basket open across the change should not lose it.
        const legacy = (l as unknown as { packagingId?: unknown }).packagingId;
        const ids = Array.isArray(l.packagingIds)
          ? l.packagingIds.filter((id): id is string => typeof id === "string")
          : typeof legacy === "string"
            ? [legacy]
            : [];
        return {
          slug: l.slug,
          quantity: Math.max(1, Math.round(l.quantity)),
          packagingIds: ids,
        };
      })
      .slice(0, CART_MAX_LINES);
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage disabled or full. The cart still works for this page view.
  }
}

/**
 * The same product with a different add-on is a different line.
 *
 * Someone ordering two hundred plain and fifty engraved is describing two
 * things, and merging them on slug alone would quietly lose half the brief.
 */
export function sameLine(a: CartLine, b: { slug: string; packagingIds: string[] }) {
  if (a.slug !== b.slug) return false;
  if (a.packagingIds.length !== b.packagingIds.length) return false;
  // Order is presentation, not meaning: engraving-then-hardbox and
  // hardbox-then-engraving are the same request and must merge.
  const mine = [...a.packagingIds].sort();
  const theirs = [...b.packagingIds].sort();
  return mine.every((id, i) => id === theirs[i]);
}

export function addLine(lines: CartLine[], entry: CartLine): CartLine[] {
  const existing = lines.findIndex((l) => sameLine(l, entry));
  if (existing === -1) return [...lines, entry].slice(0, CART_MAX_LINES);
  return lines.map((l, i) =>
    i === existing ? { ...l, quantity: l.quantity + entry.quantity } : l,
  );
}
