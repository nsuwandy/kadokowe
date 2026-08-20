"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { STORY_SECTIONS, type SaveState } from "@/lib/editor-shared";

/** Create or update an Our Work project — FR-7.7, FR-10.3. */
export async function saveProject(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again." };

  const id = String(formData.get("id") ?? "");
  const isNew = !id || id === "new";

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };

  const titleEn = str("titleEn");
  const client = str("client");
  if (!titleEn) return { ok: false, message: "A title is required." };
  if (!client) return { ok: false, message: "A client name is required." };

  const slug =
    str("slug") ??
    titleEn.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, "-").replace(/-+/g, "-");

  // Each of the six sections is stored in both languages, all nullable.
  const sections: Record<string, string | null> = {};
  for (const s of STORY_SECTIONS) {
    sections[`${s.key}En`] = str(`${s.key}En`);
    sections[`${s.key}Id`] = str(`${s.key}Id`);
  }

  const visibility = String(formData.get("visibility") ?? "DRAFT");
  const sortRaw = String(formData.get("sortOrder") ?? "").replace(/[^\d]/g, "");
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);

  const data = {
    titleEn,
    titleId: str("titleId"),
    client,
    industry: str("industry"),
    summaryEn: str("summaryEn"),
    summaryId: str("summaryId"),
    ...sections,
    heroImage: str("heroImage"),
    sortOrder: sortRaw ? Number(sortRaw) : 0,
    featured: formData.get("featured") === "on",
    visibility: visibility as never,
    publishedAt: visibility === "PUBLISHED" ? new Date() : null,
  };

  try {
    if (isNew) {
      const created = await db.project.create({
        data: { ...data, slug, products: { connect: productIds.map((i) => ({ id: i })) } },
        select: { id: true },
      });
      revalidatePath("/admin/projects");
      revalidatePath("/our-work");
      redirect(`/admin/projects/${created.id}?saved=1`);
    }

    await db.project.update({
      where: { id },
      data: { ...data, slug, products: { set: productIds.map((i) => ({ id: i })) } },
    });
    revalidatePath("/admin/projects");
    revalidatePath("/our-work");
    revalidatePath(`/our-work/${slug}`);
    return { ok: true, message: "Saved." };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? `The web address "${slug}" is already used by another project.`
        : "Could not save. Check the fields and try again.";
    return { ok: false, message };
  }
}
