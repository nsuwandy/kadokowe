"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parsePrice } from "@/lib/price";
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
  const slug =
    str("slug") ??
    nameEn.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, "-").replace(/-+/g, "-");

  // Either "45000" or "30000-45000". The tier is taken from the lower figure:
  // it is the number a buyer plans against, and using the upper one would file
  // a product one band above what it can actually be had for.
  const price = parsePrice(str("indicativePrice"));
  const indicativePrice = price?.min ?? null;
  const indicativePriceMax = price?.max ?? null;

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
    indicativePriceMax,
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

  /**
   * Per-product packaging prices.
   *
   * A blank box means "use the catalogue default", not "free", so it writes no
   * row rather than a zero. Storing zero would make an add-on free the moment
   * someone cleared a field to reset it — the opposite of what clearing a
   * field means everywhere else in this admin.
   */
  const packagingPrices: { optionId: string; priceDelta: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("packaging_")) continue;
    const raw = String(value).replace(/[^\d]/g, "");
    if (raw === "") continue;
    packagingPrices.push({
      optionId: key.slice("packaging_".length),
      priceDelta: Number(raw),
    });
  }

  try {
    if (isNew) {
      const created = await db.product.create({
        data: {
          ...data,
          slug,
          terms: { connect: termIds },
          gallery: { create: gallery },
          packaging: { create: packagingPrices },
        },
        select: { id: true },
      });
      revalidatePath("/admin/products");
      revalidatePath("/products");
      redirect(`/admin/products/${created.id}?saved=1`);
    }

    await db.product.update({
      where: { id },
      data: {
        ...data,
        slug,
        terms: { set: termIds },
        gallery: { deleteMany: {}, create: gallery },
        // Replaced wholesale, like the gallery: the form is the truth, and a
        // price removed in the form has to disappear rather than linger.
        packaging: { deleteMany: {}, create: packagingPrices },
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${slug}`);
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
  revalidatePath("/products");
  redirect("/admin/products");
}
