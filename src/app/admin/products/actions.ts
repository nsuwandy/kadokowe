"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgetTierFor } from "@/content/taxonomy";
import { galleryFrom } from "@/lib/gallery";
import { type SaveState } from "@/lib/product-form";

/**
 * Create or update a product — FR-10.2.
 *
 * Budget tier is recomputed from indicative price on every save rather than
 * being editable. Letting it drift from the price would put a product in a
 * filter its own price contradicts, and at catalogue scale nobody would
 * notice until a client did.
 */
export async function saveProduct(
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
  const list = (k: string) =>
    String(formData.get(k) ?? "")
      .split(/[|,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  const num = (k: string) => {
    const raw = String(formData.get(k) ?? "").replace(/[^\d]/g, "");
    return raw ? Number(raw) : null;
  };

  const nameEn = str("nameEn");
  const shortEn = str("shortEn");
  if (!nameEn) return { ok: false, message: "An English name is required." };
  if (!shortEn) {
    return {
      ok: false,
      message:
        "The short line is required — it is what makes the card read as an idea rather than a listing.",
    };
  }

  const slug =
    str("slug") ??
    nameEn.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, "-").replace(/-+/g, "-");

  const indicativePrice = num("indicativePrice");

  // Taxonomy terms chosen in the form, plus the derived budget tier.
  const chosen = formData.getAll("termIds").map(String).filter(Boolean);
  const tierSlug = indicativePrice !== null ? budgetTierFor(indicativePrice) : null;
  const budgetTerms = tierSlug
    ? await db.taxonomyTerm.findMany({
        where: { axis: "BUDGET", slugEn: tierSlug },
        select: { id: true },
      })
    : [];

  // Any budget term the operator happened to tick is discarded in favour of
  // the derived one, so price and tier cannot disagree.
  const nonBudget = await db.taxonomyTerm.findMany({
    where: { id: { in: chosen }, axis: { not: "BUDGET" } },
    select: { id: true },
  });
  const termIds = [...nonBudget, ...budgetTerms].map((t) => ({ id: t.id }));

  const data = {
    nameEn,
    nameId: str("nameId"),
    shortEn,
    shortId: str("shortId"),
    whyEn: str("whyEn"),
    whyId: str("whyId"),
    material: str("material"),
    dimensions: str("dimensions"),
    capacity: str("capacity"),
    colours: list("colours"),
    moq: num("moq"),
    leadTime: str("leadTime"),
    customisation: list("customisation"),
    availability: String(formData.get("availability") ?? "LOCAL_PRODUCTION") as never,
    indicativePrice,
    tagsEn: list("tagsEn"),
    tagsId: list("tagsId"),
    heroImage: str("heroImage"),
    seoTitleEn: str("seoTitleEn"),
    seoTitleId: str("seoTitleId"),
    seoDescEn: str("seoDescEn"),
    seoDescId: str("seoDescId"),
    featured: formData.get("featured") === "on",
    isNew: formData.get("isNew") === "on",
    visibility: String(formData.get("visibility") ?? "DRAFT") as never,
  };

  // FR-7.3 — the gallery is replaced wholesale rather than diffed. Rows carry
  // no stable identity through the form, so matching them up would mean
  // inventing one; recreating a handful of rows is cheaper than the bookkeeping.
  const gallery = galleryFrom(formData, "gallery");

  try {
    if (isNew) {
      const created = await db.product.create({
        data: {
          ...data,
          slug,
          terms: { connect: termIds },
          gallery: { create: gallery },
        },
        select: { id: true },
      });
      revalidatePath("/admin/products");
      revalidatePath("/ideas");
      redirect(`/admin/products/${created.id}?saved=1`);
    }

    await db.product.update({
      where: { id },
      data: {
        ...data,
        slug,
        terms: { set: termIds },
        gallery: { deleteMany: {}, create: gallery },
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/ideas");
    revalidatePath(`/ideas/${slug}`);
    return { ok: true, message: "Saved." };
  } catch (error) {
    // redirect() throws by design; let it through rather than reporting it.
    if (error && typeof error === "object" && "digest" in error) throw error;
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? `The slug "${slug}" is already used by another product.`
        : "Could not save. Check the fields and try again.";
    return { ok: false, message };
  }
}

/** FR-10.9 — deletion is confirmed in the UI before it reaches here. */
export async function deleteProduct(formData: FormData) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/products");

  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/ideas");
  redirect("/admin/products");
}
