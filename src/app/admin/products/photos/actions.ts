"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Apply a photography import — the write half of the bulk photo upload.
 *
 * The images themselves never pass through here. The browser unzips the
 * archive and uploads each file straight to Cloudinary, then posts this
 * mapping of slug to public IDs — a few kilobytes of JSON rather than the
 * hundreds of megabytes a catalogue of photographs actually weighs. That is
 * not an optimisation: a serverless request body is capped at 4.5 MB, so a
 * server-side unzip would have failed on any real batch while working
 * perfectly on the developer's two-file test.
 */
export type PhotoApplyResult = {
  ok: boolean;
  message: string;
  updated: number;
  failures: { slug: string; problem: string }[];
};

export type PhotoAssignmentInput = {
  slug: string;
  /** Cloudinary public ID for position 1, if the zip supplied one. */
  hero: string | null;
  /** Public IDs for positions 2 upwards, already in order. */
  gallery: string[];
};

export async function applyPhotoImport(
  assignments: PhotoAssignmentInput[],
): Promise<PhotoApplyResult> {
  const admin = await currentAdmin();
  if (!admin) {
    return { ok: false, message: "Your session expired. Sign in again.", updated: 0, failures: [] };
  }

  if (assignments.length === 0) {
    return { ok: false, message: "Nothing to apply.", updated: 0, failures: [] };
  }

  const failures: PhotoApplyResult["failures"] = [];
  let updated = 0;

  for (const assignment of assignments) {
    try {
      const product = await db.product.findUnique({
        where: { slug: assignment.slug },
        select: { id: true },
      });
      if (!product) {
        failures.push({ slug: assignment.slug, problem: "Product no longer exists." });
        continue;
      }

      await db.product.update({
        where: { id: product.id },
        data: {
          // Only overwrite the hero when the zip actually carried a position
          // 1. A batch of extra angles should not wipe an existing hero.
          ...(assignment.hero ? { heroImage: assignment.hero } : {}),
          // The gallery is replaced rather than appended, matching the product
          // editor. Appending would double every image on a re-run, and a
          // re-run is the normal way to fix a mistake.
          ...(assignment.gallery.length > 0
            ? {
                gallery: {
                  deleteMany: {},
                  create: assignment.gallery.map((publicId, i) => ({
                    publicId,
                    sortOrder: i,
                  })),
                },
              }
            : {}),
        },
      });

      revalidatePath(`/products/${assignment.slug}`);
      updated += 1;
    } catch (error) {
      failures.push({
        slug: assignment.slug,
        problem: error instanceof Error ? error.message : "Could not save.",
      });
    }
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");

  return {
    ok: failures.length === 0,
    message:
      failures.length === 0
        ? `${updated} ${updated === 1 ? "product" : "products"} updated.`
        : `${updated} updated, ${failures.length} failed.`,
    updated,
    failures,
  };
}
