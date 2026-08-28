import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CraftFamilyForm, type PairValue } from "@/components/admin/CraftFamilyForm";
import { saveFamily } from "../actions";

export default async function CraftFamilyEditor({
  params,
}: PageProps<"/admin/craft/[id]">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const isNew = id === "new";

  const family = isNew
    ? null
    : await db.craftFamily.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { media: { orderBy: { sortOrder: "asc" } } },
          },
          machines: { orderBy: { sortOrder: "asc" } },
        },
      });

  if (!isNew && !family) notFound();

  const pairs = (value: unknown): PairValue[] =>
    Array.isArray(value)
      ? value.map((raw) => {
          const p = raw as { nameEn?: string; descEn?: string };
          return { nameEn: p?.nameEn ?? "", descEn: p?.descEn ?? "" };
        })
      : [];

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <Link href="/admin/craft" className="text-xs font-semibold text-red hover:underline">
        ← All categories
      </Link>

      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">{isNew ? "Add category" : family!.nameEn}</h1>
        {family && (
          <Link
            href={
              family.visibility === "PUBLISHED"
                ? `/custom-made/${family.slug}`
                : `/api/draft/enable?next=${encodeURIComponent(`/custom-made/${family.slug}`)}`
            }
            target="_blank"
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            {family.visibility === "PUBLISHED" ? "View on site ↗" : "Preview ↗"}
          </Link>
        )}
      </div>

      <CraftFamilyForm
        action={saveFamily}
        family={
          family
            ? {
                id: family.id,
                slug: family.slug,
                nameEn: family.nameEn,
                nameId: family.nameId ?? "",
                leadEn: family.leadEn ?? "",
                leadId: family.leadId ?? "",
                introEn: family.introEn ?? "",
                introId: family.introId ?? "",
                heroImage: family.heroImage,
                sortOrder: family.sortOrder,
                visibility: family.visibility,
                items: family.items.map((i) => ({
                  nameEn: i.nameEn,
                  nameId: i.nameId ?? "",
                  media: i.media.map((m) => ({
                    kind: m.kind,
                    publicId: m.publicId,
                    alt: m.altEn ?? "",
                  })),
                })),
                machines: family.machines.map((m) => ({
                  nameEn: m.nameEn,
                  descEn: m.descEn ?? "",
                  image: m.image ?? "",
                })),
                options: pairs(family.options),
                branding: pairs(family.branding).map((b) => b.nameEn),
              }
            : null
        }
      />
    </div>
  );
}
