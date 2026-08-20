"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldsFor, type PageBlocks } from "@/lib/page-content";
import type { SaveState } from "@/lib/editor-shared";

/** Save page copy overrides — FR-10.5. */
export async function savePageCopy(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again." };

  const key = String(formData.get("key") ?? "");
  if (!key) return { ok: false, message: "No page selected." };

  const blocks: PageBlocks = {};
  for (const f of fieldsFor(key)) {
    const en = String(formData.get(`${f.name}_en`) ?? "").trim();
    const id = String(formData.get(`${f.name}_id`) ?? "").trim();
    // Store only what was actually filled, so a cleared field reverts to the
    // code default rather than blanking the page.
    if (en || id) blocks[f.name] = { ...(en && { en }), ...(id && { id }) };
  }

  try {
    await db.pageContent.upsert({
      where: { key },
      update: { blocks, updatedBy: admin.email },
      create: { key, blocks, updatedBy: admin.email },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "Saved. Clearing a field restores the original wording." };
  } catch {
    return { ok: false, message: "Could not save. Try again." };
  }
}
