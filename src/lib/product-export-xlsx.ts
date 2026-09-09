import "server-only";
import ExcelJS from "exceljs";
import type { ExportableProduct } from "./product-export";
import { PHOTO_FIELD, type ExportField } from "./product-export-fields";
import { fetchThumbs, type Thumb } from "./product-export-media";

/**
 * The catalogue as a spreadsheet, photographs in the cells.
 *
 * Excel has no notion of a picture that *belongs* to a cell — images float on
 * a drawing layer above the grid, anchored to a position. So "in the cell" is
 * something this has to construct: the row is made tall enough, the column
 * wide enough, and the picture is inset slightly from the anchor so it sits
 * inside the gridlines rather than on top of them.
 *
 * Two consequences the operator meets rather than reads about. Where a
 * photograph could not be fetched the cell keeps the Cloudinary public ID as
 * text, so an empty-looking cell can still be traced back to an asset; where
 * one was placed the text is cleared, because it would otherwise show around
 * the edges of the picture. And anchors follow a filter but not a sort —
 * hiding rows moves the drawing layer with them, reordering rows does not.
 * The sheet is filterable for that reason and the export page says so.
 */

/** Pixels. The row is sized to match, so the picture fills its cell. */
const PHOTO_BOX = 76;

/** Excel's column width unit is roughly one character of the default font. */
const PHOTO_COL_WIDTH = 13;

/** Points, Excel's row height unit. 96px to the inch, 72pt to the inch. */
const px2pt = (px: number) => (px * 72) / 96;

export type XlsxResult = { bytes: Uint8Array; photosSkipped: number };

export async function productsToXlsx(
  products: ExportableProduct[],
  fields: ExportField[],
  { includePhotos }: { includePhotos: boolean },
): Promise<XlsxResult> {
  const photoColumn = fields.find((f) => f.key === PHOTO_FIELD);
  const wantPhotos = includePhotos && photoColumn !== undefined;

  let thumbs = new Map<string, Thumb>();
  let photosSkipped = 0;
  if (wantPhotos) {
    const got = await fetchThumbs(products.map((p, i) => photoColumn!.value(p, i)));
    thumbs = got.thumbs;
    photosSkipped = got.skipped;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kadokowe";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Products", {
    // The header stays put while a long catalogue is scrolled, which is the
    // difference between a usable sheet and one where column 14 is a mystery.
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = fields.map((f) => ({
    header: f.label,
    key: f.key,
    width: f.key === PHOTO_FIELD ? PHOTO_COL_WIDTH : Math.min(f.width, 48),
  }));

  const header = sheet.getRow(1);
  header.font = { bold: true, size: 10 };
  header.height = 22;
  header.alignment = { vertical: "middle" };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F0EE" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFD9D6D3" } } };
  });

  // ExcelJS stores each `addImage` as its own part, identical bytes or not.
  // Product variants routinely share one photograph, so registering per public
  // ID rather than per row keeps a family of forty from carrying forty copies.
  const imageIds = new Map<string, number>();

  products.forEach((product, index) => {
    const row = sheet.addRow(
      Object.fromEntries(fields.map((f) => [f.key, f.value(product, index)])),
    );
    row.alignment = { vertical: "top", wrapText: true };
    if (wantPhotos) row.height = px2pt(PHOTO_BOX + 8);

    if (!wantPhotos || !photoColumn) return;

    const publicId = photoColumn.value(product, index);
    const thumb = publicId ? thumbs.get(publicId) : undefined;
    if (!thumb) return;

    // Blank the public ID once a picture is actually in place — with the
    // photograph sitting over it the text would only show through as a smear
    // at the edges.
    row.getCell(PHOTO_FIELD).value = null;

    let imageId = imageIds.get(publicId);
    if (imageId === undefined) {
      // Handed over as base64 rather than as a Buffer: ExcelJS's typings carry
      // their own bundled Node types, and the two Buffers do not agree.
      imageId = workbook.addImage({
        base64: Buffer.from(thumb.bytes).toString("base64"),
        extension: "jpeg",
      });
      imageIds.set(publicId, imageId);
    }
    // Fitted rather than stretched: a portrait shot forced into a square box
    // is a distorted product, which is worse than a small one.
    const scale = Math.min(PHOTO_BOX / thumb.width, PHOTO_BOX / thumb.height);
    sheet.addImage(imageId, {
      // Columns and rows are zero-based here, and the fraction insets the
      // picture from the cell's own corner.
      tl: { col: fields.indexOf(photoColumn) + 0.12, row: index + 1.08 },
      ext: { width: Math.round(thumb.width * scale), height: Math.round(thumb.height * scale) },
    });
  });

  // Excel's own filter row, so the sheet is usable as a working document
  // rather than only as something to look at.
  if (products.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: fields.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { bytes: new Uint8Array(buffer as ArrayBuffer), photosSkipped };
}
