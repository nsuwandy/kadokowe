/**
 * Indicative prices — FR-4.3.
 *
 * A price may be a single figure or a range. Kadokowe quotes rather than
 * lists, and a range is often the more honest answer at this stage: the real
 * number depends on quantity, branding and packaging, none of which the
 * catalogue knows.
 *
 * Parsing and formatting live together because they are two halves of one
 * agreement about what a price looks like. They were about to be written
 * three times — the product editor, the bulk importer and the cart — and the
 * third copy is always the one that rounds differently.
 */

export type PriceRange = { min: number; max: number | null };

/** "Rp 45.000" — Indonesian grouping, no decimals, which is how rupiah is written. */
export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

/**
 * "Rp 45.000", or "Rp 30.000–45.000" for a range.
 *
 * The upper bound drops its own "Rp": repeating the unit inside a single span
 * reads as two prices rather than one range. An en dash, not a hyphen — this
 * is a span of values.
 */
export function formatPrice(
  min: number | null | undefined,
  max?: number | null,
): string | null {
  if (min === null || min === undefined) return null;
  if (max === null || max === undefined || max <= min) return formatRupiah(min);
  return `Rp ${Math.round(min).toLocaleString("id-ID")}–${Math.round(max).toLocaleString("id-ID")}`;
}

/**
 * Read a price or a range out of whatever the operator typed.
 *
 * Accepts "45000", "Rp 45.000", "30000-45000", "30.000 – 45.000", "30000 to
 * 45000". Separators are stripped before parsing, so a thousands dot cannot be
 * mistaken for a decimal point — in rupiah there are no decimals to lose, and
 * reading "45.000" as forty-five would be a silent hundredfold error.
 */
export function parsePrice(input: string | null | undefined): PriceRange | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  // The currency marker goes first. Left in, a second "Rp" after the dash
  // stops the split matching — and the two numbers then concatenate into one
  // enormous figure rather than failing, which is the worst way to be wrong.
  const cleaned = raw.toLowerCase().replace(/rp\.?/g, " ");

  // Split on a dash or the word "to", but only between digits, so a stray
  // leading minus does not create a phantom range.
  const parts = cleaned
    .split(/(?<=\d)\s*(?:-|–|—|to|s\/d|sampai)\s*(?=\d)/i)
    .map((part) => part.replace(/[^\d]/g, ""))
    .filter(Boolean);

  if (parts.length === 0) return null;

  const min = Number(parts[0]);
  if (!Number.isFinite(min)) return null;

  const max = parts.length > 1 ? Number(parts[1]) : null;
  if (max !== null && (!Number.isFinite(max) || max <= min)) {
    // A reversed or equal upper bound is not a range; treat it as a single
    // figure rather than rejecting the row over it.
    return { min, max: null };
  }
  return { min, max };
}

/** What the operator sees in an input they can edit back. */
export function priceToInput(min: number | null, max: number | null): string {
  if (min === null) return "";
  return max === null ? String(min) : `${min}-${max}`;
}
