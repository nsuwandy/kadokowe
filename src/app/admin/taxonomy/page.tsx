import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaxonomyForm } from "@/components/admin/TaxonomyForm";
import { saveTerms } from "./actions";

const AXES = [
  { key: "PRODUCT", label: "Product category", note: "What the thing is." },
  { key: "PURPOSE", label: "Purpose", note: "What it is for — how most visitors without a product in mind navigate." },
  { key: "INDUSTRY", label: "Industry", note: "Who it is for." },
  { key: "BUDGET", label: "Budget tier", note: "Set automatically from each product's indicative price. Renaming is safe; changing the ranges needs a developer." },
] as const;

/** Taxonomy management — FR-10.4, FR-3.13. */
export default async function AdminTaxonomy({
  searchParams,
}: PageProps<"/admin/taxonomy">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const axis = AXES.find((a) => a.key === String(params?.axis ?? "")) ?? AXES[0];

  const terms = await db.taxonomyTerm.findMany({
    where: { axis: axis.key as never },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Browse categories</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          The four ways a visitor can browse the Product Library. Renaming a term
          changes it everywhere immediately; the web address stays fixed so
          existing links keep working.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {AXES.map((a) => (
          <a
            key={a.key}
            href={`/admin/taxonomy?axis=${a.key}`}
            aria-current={a.key === axis.key ? "page" : undefined}
            className={
              a.key === axis.key
                ? "bg-ink px-4 py-2.5 text-xs font-semibold text-paper"
                : "border border-line bg-paper px-4 py-2.5 text-xs font-semibold hover:border-ink"
            }
          >
            {a.label}
          </a>
        ))}
      </nav>

      <p className="max-w-[70ch] border-l-2 border-red bg-paper px-5 py-3 text-sm text-muted">
        {axis.note}
      </p>

      <TaxonomyForm
        action={saveTerms}
        axis={axis.key}
        axisLabel={axis.label}
        terms={terms.map((t) => ({
          id: t.id,
          slugEn: t.slugEn,
          nameEn: t.nameEn,
          nameId: t.nameId,
          productCount: t._count.products,
        }))}
      />
    </div>
  );
}
