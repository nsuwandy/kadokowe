import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ExportableProduct } from "./product-export";
import { PHOTO_FIELD, type ExportField } from "./product-export-fields";
import { fetchThumbs, type Thumb } from "./product-export-media";

/**
 * The catalogue as a printable sheet.
 *
 * Laid out as rows of picture-plus-details rather than as a true spreadsheet
 * grid, and that is a deliberate limit rather than an unfinished job. The
 * picker can select twenty-odd columns; twenty columns of text across A4 gives
 * each one about two centimetres, which is narrower than the word "Customisation".
 * A landscape grid would only move the point at which it becomes unreadable.
 * So the photograph holds a column of its own and the chosen fields are set
 * beside it as labelled lines, which stays legible whether two fields were
 * ticked or all of them.
 *
 * Follows cart-pdf's conventions — pdf-lib, standard fonts, "Rp" spelled out —
 * so the two documents Kadokowe sends out look like they came from the same
 * company.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 40;
const INK = rgb(0.06, 0.05, 0.05);
const RED = rgb(0.75, 0.0, 0.0);
const MUTED = rgb(0.45, 0.43, 0.42);
const LINE = rgb(0.85, 0.84, 0.83);

const PHOTO_BOX = 84;
const GUTTER = 14;
const LABEL_WIDTH = 92;
const ROW_GAP = 12;

/** Helvetica is Latin-1 only; anything outside it renders as a blank box. */
function safe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\xFF]/g, "");
}

export type PdfResult = { bytes: Uint8Array; photosSkipped: number };

export async function productsToPdf(
  products: ExportableProduct[],
  fields: ExportField[],
  {
    includePhotos,
    title,
    subtitle,
  }: { includePhotos: boolean; title: string; subtitle: string },
): Promise<PdfResult> {
  const photoColumn = fields.find((f) => f.key === PHOTO_FIELD);
  const wantPhotos = includePhotos && photoColumn !== undefined;
  const textFields = fields.filter((f) => f.key !== PHOTO_FIELD);

  let thumbs = new Map<string, Thumb>();
  let photosSkipped = 0;
  if (wantPhotos) {
    const got = await fetchThumbs(products.map((p, i) => photoColumn!.value(p, i)));
    thumbs = got.thumbs;
    photosSkipped = got.skipped;
  }

  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setProducer("Kadokowe");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([A4.width, A4.height]);
  let y = A4.height - MARGIN;
  let pageNumber = 1;

  const detailX = MARGIN + (wantPhotos ? PHOTO_BOX + GUTTER : 0);
  const detailWidth = A4.width - MARGIN - detailX;

  const write = (
    value: string,
    x: number,
    at: number,
    opts: { size?: number; font?: typeof regular; color?: typeof INK } = {},
  ) => {
    page.drawText(safe(value), {
      x,
      y: at,
      size: opts.size ?? 9,
      font: opts.font ?? regular,
      color: opts.color ?? INK,
    });
  };

  /** Wrap to a pixel width rather than a character count — labels vary a lot. */
  const wrap = (value: string, width: number, size: number, font: typeof regular) => {
    const words = safe(value).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const footer = () => {
    page.drawText(safe(`Kadokowe  ·  ${title}  ·  page ${pageNumber}`), {
      x: MARGIN,
      y: MARGIN - 18,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
  };

  const newPage = () => {
    footer();
    page = doc.addPage([A4.width, A4.height]);
    pageNumber += 1;
    y = A4.height - MARGIN;
  };

  // ---------------------------------------------------------------- header
  write("KADOKOWE", MARGIN, y, { size: 15, font: bold });
  y -= 13;
  write("More Than Gifts. We Craft Brand Stories.", MARGIN, y, { size: 7.5, color: MUTED });
  y -= 22;
  write(title.toUpperCase(), MARGIN, y, { size: 11, font: bold, color: RED });
  y -= 14;
  write(subtitle, MARGIN, y, { size: 8.5, color: MUTED });
  y -= 14;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4.width - MARGIN, y },
    thickness: 0.75,
    color: LINE,
  });
  y -= 18;

  // ----------------------------------------------------------------- rows
  for (const [index, product] of products.entries()) {
    // Measure the row before drawing any of it. Starting a product at the foot
    // of a page and finishing it at the head of the next splits a photograph
    // from the thing it is a photograph of.
    const lines: { label: string; parts: string[] }[] = [];
    for (const field of textFields) {
      const value = field.value(product, index);
      if (!value) continue; // An empty field is not worth a line of its own.
      lines.push({
        label: field.label,
        parts: wrap(value, detailWidth - LABEL_WIDTH, 8.5, regular),
      });
    }

    const textHeight = lines.reduce((total, l) => total + l.parts.length * 11, 0) + 4;
    const rowHeight = Math.max(wantPhotos ? PHOTO_BOX : 0, textHeight) + ROW_GAP;

    if (y - rowHeight < MARGIN + 10) newPage();

    const top = y;

    if (wantPhotos && photoColumn) {
      const publicId = photoColumn.value(product, index);
      const thumb = publicId ? thumbs.get(publicId) : undefined;
      if (thumb) {
        try {
          const embedded = await doc.embedJpg(thumb.bytes);
          // Fitted inside the box, never stretched to fill it.
          const scale = Math.min(PHOTO_BOX / thumb.width, PHOTO_BOX / thumb.height);
          const w = thumb.width * scale;
          const h = thumb.height * scale;
          page.drawImage(embedded, {
            x: MARGIN + (PHOTO_BOX - w) / 2,
            y: top - PHOTO_BOX + (PHOTO_BOX - h) / 2,
            width: w,
            height: h,
          });
        } catch {
          // A malformed JPEG must not take the whole document with it.
        }
      } else {
        // The same labelled empty state the site uses, so a gap reads as
        // "no photograph yet" rather than as a rendering failure.
        page.drawRectangle({
          x: MARGIN,
          y: top - PHOTO_BOX,
          width: PHOTO_BOX,
          height: PHOTO_BOX,
          color: rgb(0.95, 0.94, 0.93),
        });
        write("NO PHOTO", MARGIN + 18, top - PHOTO_BOX / 2 - 3, { size: 6.5, color: MUTED });
      }
    }

    let ty = top - 9;
    for (const line of lines) {
      write(line.label, detailX, ty, { size: 7, font: bold, color: MUTED });
      for (const [i, part] of line.parts.entries()) {
        write(part, detailX + LABEL_WIDTH, ty - i * 11, { size: 8.5 });
      }
      ty -= line.parts.length * 11;
    }

    y = top - rowHeight;
    page.drawLine({
      start: { x: MARGIN, y: y + ROW_GAP / 2 },
      end: { x: A4.width - MARGIN, y: y + ROW_GAP / 2 },
      thickness: 0.5,
      color: LINE,
    });
  }

  if (products.length === 0) {
    write("No products match this selection.", MARGIN, y, { size: 9, color: MUTED });
  }

  footer();
  return { bytes: await doc.save(), photosSkipped };
}
