import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { selectedFields } from "@/lib/product-export-fields";
import { productsToXlsx } from "@/lib/product-export-xlsx";
import { productsToPdf } from "@/lib/product-export-pdf";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The catalogue as a spreadsheet or a printable sheet, with the columns the
 * operator picked and the photographs in them.
 *
 * One route for both formats because everything up to the last step is the
 * same — the same auth, the same filter, the same column selection, the same
 * pictures. Two routes would have meant keeping two copies of that in step,
 * and the copy used less often is the one that drifts.
 */

/**
 * Fetching a few hundred photographs takes longer than a page render.
 *
 * Vercel's Hobby tier caps a function at 60 seconds and defaults to less, so
 * the ceiling is asked for explicitly rather than discovered as a 504 by
 * whoever first exports the whole catalogue.
 */
export const maxDuration = 60;

const FORMATS = {
  xlsx: {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  },
  pdf: { type: "application/pdf", extension: "pdf" },
} as const;

export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const q = (url.searchParams.get("q") ?? "").trim();
  const visibility = (url.searchParams.get("visibility") ?? "").trim().toUpperCase();
  // Opt in, not opt out. An unticked checkbox submits nothing at all, so a
  // default of "on unless told otherwise" would be impossible to switch off
  // from the form that drives this.
  const includePhotos = url.searchParams.get("photos") === "1";
  const fields = selectedFields(url.searchParams.getAll("fields"));

  const where: Prisma.ProductWhereInput = {
    ...(["PUBLISHED", "DRAFT", "HIDDEN"].includes(visibility)
      ? { visibility: visibility as never }
      : {}),
    ...(q
      ? {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" as const } },
            { nameId: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const products = await db.product.findMany({
    where,
    // By name, which is also what the KDKW running numbers count down. An
    // export ordered by "recently updated" would renumber itself every time
    // anyone touched a product.
    orderBy: { nameEn: "asc" },
    select: {
      slug: true, nameEn: true, nameId: true, shortEn: true, shortId: true,
      whyEn: true, whyId: true, availability: true,
      indicativePrice: true, indicativePriceMax: true,
      material: true, dimensions: true, capacity: true, colours: true,
      moq: true, leadTime: true, customisation: true,
      tagsEn: true, tagsId: true, heroImage: true,
      featured: true, isNew: true, visibility: true,
      terms: { select: { axis: true, slugEn: true }, orderBy: { sortOrder: "asc" } },
      // Only stills, and only the first — the fallback when no hero is set.
      gallery: {
        where: { kind: "IMAGE" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { publicId: true },
      },
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const { type, extension } = FORMATS[format];

  const { bytes, photosSkipped } =
    format === "pdf"
      ? await productsToPdf(products, fields, {
          includePhotos,
          title: "Product catalogue",
          subtitle: `${products.length} product${products.length === 1 ? "" : "s"}  ·  ${stamp}${
            visibility ? `  ·  ${visibility.toLowerCase()} only` : ""
          }`,
        })
      : await productsToXlsx(products, fields, { includePhotos });

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="kadokowe-catalogue-${stamp}.${extension}"`,
      // Read by nothing automatically — it is here so that an export that
      // quietly dropped pictures can be explained after the fact rather than
      // argued about.
      "X-Photos-Skipped": String(photosSkipped),
    },
  });
}
