"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SaveState } from "@/lib/editor-shared";

/**
 * Packaging and decoration add-ons — FR-4.x.
 *
 * Rows are saved wholesale rather than diffed, matching the Custom Made
 * editor: the form is the truth, and "what you see is what is saved" is worth
 * more here than the bookkeeping a diff would need.
 */

function indexed(formData: FormData, prefix: string): string[] {
  const out: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(`${prefix}_`)) continue;
    const n = Number(key.slice(prefix.length + 1));
    if (Number.isInteger(n)) out[n] = String(value);
  }
  return out;
}

export async function savePackaging(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again." };

  const ids = indexed(formData, "id");
  const names = indexed(formData, "nameEn");
  const namesId = indexed(formData, "nameId");
  const pricings = indexed(formData, "pricing");
  const prices = indexed(formData, "priceDelta");
  const parents = indexed(formData, "parentId");
  const removed = new Set(formData.getAll("remove").map(String));

  try {
    for (let i = 0; i < names.length; i += 1) {
      const id = (ids[i] ?? "").trim();
      const nameEn = (names[i] ?? "").trim();

      if (id && removed.has(id)) {
        // Children are orphaned to the top level rather than deleted with the
        // parent: a sub-construction the client still offers should not vanish
        // because the grouping above it was tidied away.
        await db.packagingOption.updateMany({
          where: { parentId: id },
          data: { parentId: null },
        });
        await db.packagingOption.delete({ where: { id } });
        continue;
      }
      if (!nameEn) continue;

      const quote = pricings[i] === "QUOTE";
      const priceDelta = quote
        ? null
        : Number((prices[i] ?? "").replace(/[^\d]/g, "")) || 0;
      const parentId = (parents[i] ?? "").trim() || null;

      const data = {
        nameEn,
        nameId: (namesId[i] ?? "").trim() || null,
        pricing: (quote ? "QUOTE" : "FIXED") as never,
        priceDelta,
        parentId,
        sortOrder: i,
      };

      if (id) {
        await db.packagingOption.update({ where: { id }, data });
      } else {
        await db.packagingOption.create({
          data: { ...data, slug: slugify(nameEn, { lower: true, strict: true }) },
        });
      }
    }

    revalidatePath("/admin/packaging");
    revalidatePath("/products", "layout");
    return { ok: true, message: "Saved." };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Two add-ons cannot share a name — the web address made from it would clash."
        : "Could not save. Check the fields and try again.";
    return { ok: false, message };
  }
}
