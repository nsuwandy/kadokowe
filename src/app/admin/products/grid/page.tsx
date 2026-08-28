import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductGrid, type TermsByAxis } from "@/components/admin/ProductGrid";

/**
 * Bulk entry as a table — FR-10.11.
 *
 * The sibling Import page takes a CSV, which assumes the catalogue already
 * exists in a spreadsheet somewhere. This page is for the case where it does
 * not: the operator is writing rows from a supplier list or a photo folder,
 * and needs the closed-value fields offered rather than remembered.
 */
export default async function ProductGridPage() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  // FR-3.13 makes the taxonomies administrator-managed, so the dropdowns read
  // the live terms. A term added on the Categories page is selectable here on
  // the next load, with no code change — which is the whole point of the
  // taxonomies being data.
  const terms = await db.taxonomyTerm.findMany({
    where: { axis: { in: ["PRODUCT", "PURPOSE", "INDUSTRY"] } },
    orderBy: [{ axis: "asc" }, { sortOrder: "asc" }, { nameEn: "asc" }],
    select: { axis: true, nameEn: true, slugEn: true },
  });

  const termsByAxis = terms.reduce<TermsByAxis>((acc, t) => {
    (acc[t.axis] ??= []).push({ slug: t.slugEn, name: t.nameEn });
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Add products in a table</h1>
        <p className="mt-2 max-w-[74ch] text-sm text-muted">
          Type straight into the table, or paste a block copied out of Excel.
          The fields that have to be exact — category, purpose, industry,
          availability and visibility — are chosen from a list rather than
          typed, so they cannot be spelled wrong. Put the cursor in any cell to
          see what it expects.
        </p>
        <p className="mt-3 text-xs text-muted">
          Working from a spreadsheet you already have?{" "}
          <Link href="/admin/products/import" className="font-semibold text-red hover:underline">
            Import it as a CSV instead
          </Link>
          .
        </p>
      </div>

      <ProductGrid termsByAxis={termsByAxis} />

      <section className="max-w-[74ch] bg-paper p-6 text-sm text-muted">
        <h2 className="mb-3 text-sm font-semibold text-ink">Worth knowing</h2>
        <ul className="flex flex-col gap-2">
          <li>
            Everything arrives as a <strong className="font-semibold text-ink">draft</strong> unless
            you set Visibility yourself. Nothing reaches the public site by accident.
          </li>
          <li>
            The <strong className="font-semibold text-ink">budget tier</strong> is worked out from
            the indicative price, so there is no column to fill for it.
          </li>
          <li>
            Leave <strong className="font-semibold text-ink">Main photo</strong> empty. Photographs
            are matched to products by filename on the{" "}
            <Link href="/admin/products/photos" className="font-semibold text-red hover:underline">
              Photos
            </Link>{" "}
            page after the import.
          </li>
          <li>
            The table is saved in this browser as you type and survives a
            reload. It is only sent to the site when you press Import.
          </li>
        </ul>
      </section>
    </div>
  );
}
