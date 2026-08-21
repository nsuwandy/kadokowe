"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SaveState } from "@/lib/editor-shared";

/** Create or update an Insights article — FR-8.5, FR-10.3. */
export async function saveArticle(
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
  if (!titleEn) return { ok: false, message: "A title is required." };

  const slug =
    str("slug") ??
    titleEn.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, "-").replace(/-+/g, "-");

  const visibility = String(formData.get("visibility") ?? "DRAFT");
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);
  const projectIds = formData.getAll("projectIds").map(String).filter(Boolean);

  const data = {
    titleEn,
    titleId: str("titleId"),
    excerptEn: str("excerptEn"),
    excerptId: str("excerptId"),
    bodyEn: str("bodyEn"),
    bodyId: str("bodyId"),
    category: String(formData.get("category") ?? "GIFTING_STRATEGY") as never,
    heroImage: str("heroImage"),
    seoTitleEn: str("seoTitleEn"),
    seoTitleId: str("seoTitleId"),
    seoDescEn: str("seoDescEn"),
    seoDescId: str("seoDescId"),
    featured: formData.get("featured") === "on",
    visibility: visibility as never,
    publishedAt: visibility === "PUBLISHED" ? new Date() : null,
  };

  try {
    if (isNew) {
      const created = await db.article.create({
        data: {
          ...data,
          slug,
          products: { connect: productIds.map((i) => ({ id: i })) },
          projects: { connect: projectIds.map((i) => ({ id: i })) },
        },
        select: { id: true },
      });
      revalidatePath("/admin/articles");
      revalidatePath("/insights");
      redirect(`/admin/articles/${created.id}?saved=1`);
    }

    await db.article.update({
      where: { id },
      data: {
        ...data,
        slug,
        products: { set: productIds.map((i) => ({ id: i })) },
        projects: { set: projectIds.map((i) => ({ id: i })) },
      },
    });
    revalidatePath("/admin/articles");
    revalidatePath("/insights");
    revalidatePath(`/insights/${slug}`);
    return { ok: true, message: "Saved." };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? `The web address "${slug}" is already used by another article.`
        : "Could not save. Check the fields and try again.";
    return { ok: false, message };
  }
}
