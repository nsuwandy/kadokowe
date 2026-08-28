import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatPrice } from "./price";
import { cartTotals, type ResolvedLine } from "./cart";

/**
 * The request-for-quotation PDF — FR-6.x.
 *
 * Generated on the server so the buyer and Kadokowe hold the same document:
 * the visitor downloads it and the notification carries it as an attachment.
 * Two renderings of the same basket, drifting apart in the details, is how a
 * conversation starts with an argument about what was actually asked for.
 *
 * Laid out with pdf-lib's built-in fonts rather than embedded ones. Helvetica
 * has no rupiah glyph, so amounts are written "Rp" plus digits, which is how
 * they are written in Indonesia anyway.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const INK = rgb(0.06, 0.05, 0.05);
const RED = rgb(0.75, 0.0, 0.0);
const MUTED = rgb(0.45, 0.43, 0.42);
const LINE = rgb(0.85, 0.84, 0.83);

export type CartPdfInput = {
  reference: string;
  submittedAt: Date;
  brand: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  attachments: string[];
  lines: ResolvedLine[];
};

/** Helvetica is Latin-1 only; anything outside it renders as a blank box. */
function safe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\xFF]/g, "");
}

export async function buildCartPdf(input: CartPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Kadokowe — request for quotation ${input.reference}`);
  doc.setProducer("Kadokowe");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([A4.width, A4.height]);
  let y = A4.height - MARGIN;

  const text = (
    value: string,
    opts: { size?: number; font?: typeof regular; color?: typeof INK; x?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    page.drawText(safe(value), {
      x: opts.x ?? MARGIN,
      y,
      size,
      font: opts.font ?? regular,
      color: opts.color ?? INK,
    });
  };

  /** Start a new page before writing anything that would fall off this one. */
  const room = (needed: number) => {
    if (y - needed > MARGIN) return;
    page = doc.addPage([A4.width, A4.height]);
    y = A4.height - MARGIN;
  };

  const rule = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4.width - MARGIN, y },
      thickness: 0.75,
      color: LINE,
    });
  };

  // ---------------------------------------------------------------- header
  text("KADOKOWE", { size: 16, font: bold });
  y -= 14;
  text("More Than Gifts. We Craft Brand Stories.", { size: 8, color: MUTED });
  y -= 26;

  text("REQUEST FOR QUOTATION", { size: 12, font: bold, color: RED });
  y -= 16;
  text(
    `Reference ${input.reference}   ·   ${input.submittedAt.toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    })}`,
    { size: 9, color: MUTED },
  );
  y -= 22;
  rule();
  y -= 20;

  // ----------------------------------------------------------------- who
  text("FROM", { size: 8, font: bold, color: MUTED });
  y -= 14;
  for (const row of [
    input.brand,
    input.name,
    input.email,
    input.phone ?? "",
  ].filter(Boolean)) {
    text(row, { size: 10 });
    y -= 13;
  }
  y -= 10;
  rule();
  y -= 20;

  // --------------------------------------------------------------- lines
  const cols = { product: MARGIN, qty: 330, unit: 390, total: 500 };
  text("PRODUCT", { size: 8, font: bold, color: MUTED });
  text("QTY", { size: 8, font: bold, color: MUTED, x: cols.qty });
  text("PER UNIT", { size: 8, font: bold, color: MUTED, x: cols.unit });
  text("LINE", { size: 8, font: bold, color: MUTED, x: cols.total });
  y -= 8;
  rule();
  y -= 16;

  for (const line of input.lines) {
    room(46);
    text(line.name, { size: 10, font: bold });
    text(String(line.quantity), { size: 10, x: cols.qty });
    text(
      line.quoteOnly || line.unitPrice === null
        ? "To be quoted"
        : formatPrice(line.unitPrice, line.unitPriceMax) ?? "-",
      { size: 10, x: cols.unit },
    );
    text(
      line.quoteOnly || line.unitPrice === null
        ? "-"
        : formatPrice(
            line.unitPrice * line.quantity,
            line.unitPriceMax === null ? null : line.unitPriceMax * line.quantity,
          ) ?? "-",
      { size: 10, x: cols.total },
    );
    y -= 13;

    text(
      line.packagingName
        ? `Packaging & branding: ${line.packagingName}`
        : "Product only",
      { size: 8.5, color: MUTED, x: MARGIN + 10 },
    );
    y -= 16;
  }

  rule();
  y -= 20;

  // --------------------------------------------------------------- total
  const totals = cartTotals(input.lines);
  room(60);
  if (totals.quoteOnly) {
    text("TOTAL", { size: 9, font: bold, color: MUTED });
    text("To be quoted", { size: 12, font: bold, color: RED, x: cols.unit });
    y -= 15;
    // The reason is stated rather than left to be inferred. A buyer who sees
    // no total and no explanation assumes something failed.
    text(
      "This request includes packaging that is quoted rather than listed, so no",
      { size: 8.5, color: MUTED },
    );
    y -= 11;
    text(
      "estimate is shown. Kadokowe will confirm the full price in a written quotation.",
      { size: 8.5, color: MUTED },
    );
    y -= 18;
  } else {
    text("INDICATIVE TOTAL", { size: 9, font: bold, color: MUTED });
    text(
      formatPrice(totals.total, totals.totalMax) ?? "-",
      { size: 12, font: bold, x: cols.unit },
    );
    y -= 15;
    text(
      `${totals.units} units across ${totals.lines} ${totals.lines === 1 ? "line" : "lines"}.`,
      { size: 8.5, color: MUTED },
    );
    y -= 11;
    text(
      "Indicative only. Final pricing depends on quantity, branding, packaging and lead",
      { size: 8.5, color: MUTED },
    );
    y -= 11;
    text(
      "time, and is confirmed in a written quotation.",
      { size: 8.5, color: MUTED },
    );
    y -= 18;
  }

  // ------------------------------------------------------------- message
  if (input.message) {
    room(60);
    rule();
    y -= 18;
    text("NOTES", { size: 8, font: bold, color: MUTED });
    y -= 14;
    for (const chunk of wrap(input.message, 92)) {
      room(16);
      text(chunk, { size: 9.5 });
      y -= 12;
    }
    y -= 8;
  }

  if (input.attachments.length > 0) {
    room(40);
    text(
      `${input.attachments.length} file${input.attachments.length === 1 ? "" : "s"} attached to this request.`,
      { size: 8.5, color: MUTED },
    );
    y -= 12;
  }

  // -------------------------------------------------------------- footer
  page.drawText(
    safe("Kadokowe · Surabaya, Indonesia · kreasikadokowe@gmail.com"),
    { x: MARGIN, y: MARGIN - 16, size: 8, font: regular, color: MUTED },
  );

  return doc.save();
}

/** Naive wrap by word count of characters — enough for a notes field. */
function wrap(value: string, width: number): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > width) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
