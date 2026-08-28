"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SaveState } from "@/lib/editor-shared";
import { resolveTermOrder } from "@/lib/term-order";

const AXES = ["PRODUCT", "PURPOSE", "INDUSTRY", "BUDGET"] as const;

function slugify(v: string) {
  return v.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

/** Add or rename terms, and set their order — FR-10.4. */
export async function saveTerms(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again." };

  const axis = String(formData.get("axis") ?? "");
  if (!AXES.includes(axis as (typeof AXES)[number])) {
    return { ok: false, message: "Unknown axis." };
  }

  try {
    // Existing terms: rename and reorder. Order comes from the number typed
    // against each row; positions are then renumbered from the sorted result,
    // so duplicates and gaps ("10, 20, 30") both resolve sensibly instead of
    // being rejected.
    const ids = formData.getAll("termId").map(String);
    const ordered = resolveTermOrder(ids, (id) => {
      const raw = formData.get(`order_${id}`);
      return raw === null || raw === "" ? undefined : Number(raw);
    });

    for (const [i, id] of ordered.entries()) {
      const nameEn = String(formData.get(`nameEn_${id}`) ?? "").trim();
      const nameId = String(formData.get(`nameId_${id}`) ?? "").trim();
      if (!nameEn) continue;
      await db.taxonomyTerm.update({
        where: { id },
        data: { nameEn, nameId: nameId || null, sortOrder: i },
      });
    }

    // One new term per save, which is enough and keeps the form legible.
    const newName = String(formData.get("newNameEn") ?? "").trim();
    if (newName) {
      const slug = slugify(String(formData.get("newSlug") ?? "") || newName);
      const clash = await db.taxonomyTerm.findFirst({
        where: { axis: axis as never, slugEn: slug },
      });
      if (clash) {
        return { ok: false, message: `"${slug}" already exists in this axis.` };
      }
      await db.taxonomyTerm.create({
        data: {
          axis: axis as never,
          slugEn: slug,
          nameEn: newName,
          nameId: String(formData.get("newNameId") ?? "").trim() || null,
          sortOrder: ids.length,
        },
      });
    }

    revalidatePath("/admin/taxonomy");
    revalidatePath("/products", "layout");
    return { ok: true, message: "Saved." };
  } catch {
    return { ok: false, message: "Could not save. Try again." };
  }
}

/**
 * Remove a term — FR-10.9.
 *
 * Refused while products still use it. Deleting a term that products depend
 * on would silently drop them out of a browse axis with nothing to indicate
 * why, and the operator would have no way to find them again.
 *
 * The id arrives bound rather than through a form field. React uses the
 * submitting button's `name` to carry its own action id, so a `name="id"` on
 * that button is overwritten and the action ran with nothing to delete — the
 * button appeared to do nothing at all.
 */
export async function deleteTerm(id: string): Promise<void> {
  const admin = await currentAdmin();
  if (!admin) return;

  if (!id) return;

  const term = await db.taxonomyTerm.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!term || term._count.products > 0) return;

  await db.taxonomyTerm.delete({ where: { id } });
  revalidatePath("/admin/taxonomy");
  revalidatePath("/products", "layout");
}
