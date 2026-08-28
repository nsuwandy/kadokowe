"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SaveState } from "@/lib/editor-shared";

/** Partner and supplier marks shown on About — saved wholesale, as elsewhere. */
function indexed(formData: FormData, prefix: string): string[] {
  const out: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(`${prefix}_`)) continue;
    const n = Number(key.slice(prefix.length + 1));
    if (Number.isInteger(n)) out[n] = String(value);
  }
  return out;
}

export async function savePartners(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again." };

  const ids = indexed(formData, "id");
  const names = indexed(formData, "name");
  const logos = indexed(formData, "logo");
  const urls = indexed(formData, "url");
  const removed = new Set(formData.getAll("remove").map(String));

  try {
    for (let i = 0; i < names.length; i += 1) {
      const id = (ids[i] ?? "").trim();
      const name = (names[i] ?? "").trim();

      if (id && removed.has(id)) {
        await db.partner.delete({ where: { id } });
        continue;
      }
      if (!name) continue;

      const data = {
        name,
        logo: (logos[i] ?? "").trim() || null,
        url: (urls[i] ?? "").trim() || null,
        sortOrder: i,
      };
      if (id) await db.partner.update({ where: { id }, data });
      else await db.partner.create({ data });
    }

    revalidatePath("/admin/partners");
    revalidatePath("/about", "layout");
    return { ok: true, message: "Saved." };
  } catch {
    return { ok: false, message: "Could not save. Check the fields and try again." };
  }
}
