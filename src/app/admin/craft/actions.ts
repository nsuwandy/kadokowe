"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SaveState } from "@/lib/editor-shared";

/**
 * Custom Made families — FR-12.x.
 *
 * The nested collections (examples with their media, machines, options,
 * branding) are replaced wholesale on save rather than diffed. Rows carry no
 * stable identity through the form, so matching them up would mean inventing
 * one; recreating a few dozen rows costs less than that bookkeeping and makes
 * "what you see is what is saved" literally true.
 */

/** Pull `name_0`, `name_1`, … back into an ordered list. */
function indexed(formData: FormData, prefix: string): string[] {
  const out: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(`${prefix}_`)) continue;
    const n = Number(key.slice(prefix.length + 1));
    if (Number.isInteger(n)) out[n] = String(value);
  }
  return out;
}

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function saveFamily(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again." };

  const id = String(formData.get("id") ?? "");
  const isNew = id === "new";

  const nameEn = String(formData.get("nameEn") ?? "").trim();
  if (!nameEn) return { ok: false, message: "A category needs an English name." };

  const slug =
    str(formData.get("slug")) ??
    slugify(nameEn, { lower: true, strict: true });

  // Examples come in as parallel arrays: one row per index, each with its own
  // media list serialised by the client.
  const itemNames = indexed(formData, "itemName");
  const itemNamesId = indexed(formData, "itemNameId");
  const itemMedia = indexed(formData, "itemMedia");

  const items = itemNames
    .map((name, i) => ({
      nameEn: (name ?? "").trim(),
      nameId: (itemNamesId[i] ?? "").trim() || null,
      sortOrder: i,
      media: parseMedia(itemMedia[i] ?? ""),
    }))
    .filter((it) => it.nameEn !== "");

  const machineNames = indexed(formData, "machineName");
  const machineDescs = indexed(formData, "machineDesc");
  const machineImages = indexed(formData, "machineImage");
  const machines = machineNames
    .map((name, i) => ({
      nameEn: (name ?? "").trim(),
      descEn: (machineDescs[i] ?? "").trim() || null,
      image: (machineImages[i] ?? "").trim() || null,
      sortOrder: i,
    }))
    .filter((m) => m.nameEn !== "");

  const optionNames = indexed(formData, "optionName");
  const optionDescs = indexed(formData, "optionDesc");
  const options = optionNames
    .map((name, i) => ({
      nameEn: (name ?? "").trim(),
      descEn: (optionDescs[i] ?? "").trim() || null,
    }))
    .filter((o) => o.nameEn !== "");

  const branding = indexed(formData, "branding")
    .map((b) => ({ nameEn: (b ?? "").trim() }))
    .filter((b) => b.nameEn !== "");

  const data = {
    nameEn,
    nameId: str(formData.get("nameId")),
    leadEn: str(formData.get("leadEn")),
    leadId: str(formData.get("leadId")),
    introEn: str(formData.get("introEn")),
    introId: str(formData.get("introId")),
    heroImage: str(formData.get("heroImage")),
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
    visibility: String(formData.get("visibility") ?? "DRAFT") as never,
    options,
    branding,
  };

  const nested = {
    items: {
      create: items.map((it) => ({
        nameEn: it.nameEn,
        nameId: it.nameId,
        sortOrder: it.sortOrder,
        media: { create: it.media },
      })),
    },
    machines: { create: machines },
  };

  try {
    if (isNew) {
      const created = await db.craftFamily.create({
        data: { ...data, slug, ...nested },
        select: { id: true },
      });
      revalidatePath("/admin/craft");
      revalidatePath("/custom-made");
      redirect(`/admin/craft/${created.id}?saved=1`);
    }

    await db.craftFamily.update({
      where: { id },
      data: {
        ...data,
        slug,
        items: { deleteMany: {}, ...nested.items },
        machines: { deleteMany: {}, ...nested.machines },
      },
    });

    revalidatePath("/admin/craft");
    revalidatePath("/custom-made");
    revalidatePath(`/custom-made/${slug}`);
    return { ok: true, message: "Saved." };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? `The web address "${slug}" is already used by another category.`
        : "Could not save. Check the fields and try again.";
    return { ok: false, message };
  }
}

/**
 * Media arrives as one line per slide: `kind|publicId|alt`. A compact encoding
 * because the alternative is a third level of indexed form fields, and the
 * client already owns the ordering.
 */
function parseMedia(serialised: string) {
  return serialised
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [kind, publicId, alt] = line.split("|");
      return {
        kind: (kind === "VIDEO" ? "VIDEO" : "IMAGE") as never,
        publicId: (publicId ?? "").trim(),
        altEn: (alt ?? "").trim() || null,
        sortOrder: i,
      };
    })
    .filter((m) => m.publicId !== "");
}

export async function deleteFamily(id: string): Promise<void> {
  const admin = await currentAdmin();
  if (!admin) return;
  if (!id) return;

  await db.craftFamily.delete({ where: { id } });
  revalidatePath("/admin/craft");
  revalidatePath("/custom-made");
  redirect("/admin/craft");
}
