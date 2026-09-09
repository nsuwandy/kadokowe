import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { productExportFilename, productsToCsv } from "@/lib/product-export";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The catalogue as an import-shaped CSV — FR-10.11.
 *
 * Editing in bulk is the reason this exists: what comes out here goes back in
 * through the importer, which matches on slug and updates rather than
 * duplicates. See `product-export.ts` for the column contract.
 */
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  // The same two filters the product list carries, so the button exports what
  // the operator is looking at. Handing back the whole catalogue to someone
  // who had narrowed it to drafts is how the wrong file gets edited.
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const visibility = (url.searchParams.get("visibility") ?? "").trim().toUpperCase();

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
    // By name, not by the list's "recently updated" — a file that is about to
    // be scrolled through and edited wants a stable order, and two exports a
    // week apart should be comparable line for line.
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
    },
  });

  return new NextResponse(productsToCsv(products), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${productExportFilename()}"`,
    },
  });
}
