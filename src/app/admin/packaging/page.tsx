import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PackagingForm, type PackagingRow } from "@/components/admin/PackagingForm";
import { savePackaging } from "./actions";

/**
 * Packaging and decoration add-ons — FR-4.x.
 *
 * These are what a buyer adds to a product before asking for a quotation, and
 * what the cart prices against. Kept on their own page rather than inside the
 * product editor: they are shared across the whole catalogue, and repeating
 * them per product is how four hundred products end up with four hundred
 * slightly different laser engraving prices.
 */
export default async function AdminPackaging() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const options = await db.packagingOption.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    select: {
      id: true, nameEn: true, nameId: true,
      pricing: true, priceDelta: true, parentId: true,
    },
  });

  const shape = (o: (typeof options)[number]): PackagingRow => ({
    id: o.id,
    nameEn: o.nameEn,
    nameId: o.nameId ?? "",
    pricing: o.pricing === "QUOTE" ? "QUOTE" : "FIXED",
    priceDelta: o.priceDelta === null ? "" : String(o.priceDelta),
    parentId: o.parentId ?? "",
  });

  // Each group followed by what is inside it. Sorting the flat list by
  // sortOrder alone interleaved the levels — the three paper constructions
  // rendered above the group they belong to, which reads as though they are
  // unrelated top-level options.
  const childrenOf = new Map<string, typeof options>();
  for (const o of options) {
    if (!o.parentId) continue;
    const list = childrenOf.get(o.parentId) ?? [];
    list.push(o);
    childrenOf.set(o.parentId, list);
  }
  const rows: PackagingRow[] = options
    .filter((o) => !o.parentId)
    .flatMap((o) => [shape(o), ...(childrenOf.get(o.id) ?? []).map(shape)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Packaging &amp; add-ons</h1>
        <p className="mt-2 max-w-[74ch] text-sm text-muted">
          Offered on every product. The price here is a{" "}
          <strong className="font-semibold text-ink">fallback</strong>: each
          product sets its own uplift in its editor, because engraving a steel
          tumbler and engraving a pen are not the same job. This figure is what
          a product uses until it has been given one of its own — leave it at
          nothing if you would rather price everything individually.
          An add-on set to <strong className="font-semibold text-ink">Ask for a
          quotation</strong> has no list price at all, and a cart containing one
          is sent as a request rather than an estimate.
        </p>
      </div>

      <PackagingForm action={savePackaging} rows={rows} />

      <section className="max-w-[74ch] bg-paper p-6 text-sm text-muted">
        <h2 className="mb-3 text-sm font-semibold text-ink">Worth knowing</h2>
        <ul className="flex flex-col gap-2">
          <li>
            <strong className="font-semibold text-ink">Grouped under</strong> makes
            an option a sub-choice, the way paper, softbox and hardbox sit under
            custom paper packaging.
          </li>
          <li>
            Removing a group does not remove what was inside it — those options
            move up to the top level rather than disappearing with it.
          </li>
          <li>
            The order here is the order a buyer sees. Drag is not available yet;
            the rows save in the order they appear.
          </li>
        </ul>
      </section>
    </div>
  );
}
