"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { retireAssets, removedFrom } from "@/lib/asset-cleanup";
import {
  STALE_MESSAGE, isStaleWrite, stampGuard,
  type SaveState,
} from "@/lib/editor-shared";

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
  const stamps = indexed(formData, "stamp");
  const removed = new Set(formData.getAll("remove").map(String));

  // Only the rows this submission is actually responsible for.
  //
  // This read used to be every partner's logo, which made the cleanup below a
  // statement about the whole table rather than about this edit. A partner
  // added by someone else after this page loaded was absent from the submitted
  // list, so it counted as removed and had its logo moved into the removed
  // folder — while the row itself, which this form never touches, stayed put
  // and pointed at a file that was no longer there.
  const known = ids.map((v) => (v ?? "").trim()).filter(Boolean);
  const previous = known.length
    ? await db.partner
        .findMany({ where: { id: { in: known } }, select: { logo: true } })
        .then((rows) => rows.map((r) => r.logo))
    : [];

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
      if (id) {
        const stamp = (stamps[i] ?? "").trim();
        const expected = stamp ? new Date(stamp) : undefined;
        await db.partner.update({
          where: {
            id,
            ...stampGuard(
              expected && !Number.isNaN(expected.getTime()) ? expected : undefined,
            ),
          },
          data,
        });
      } else {
        await db.partner.create({ data });
      }
    }

    await retireAssets(removedFrom(previous, logos));

    revalidatePath("/admin/partners");
    revalidatePath("/[locale]/about", "page");
    return { ok: true, message: "Saved." };
  } catch (error) {
    if (isStaleWrite(error)) return { ok: false, message: STALE_MESSAGE };
    console.error("[partners] save failed:", error);
    return { ok: false, message: "Could not save. Check the fields and try again." };
  }
}
