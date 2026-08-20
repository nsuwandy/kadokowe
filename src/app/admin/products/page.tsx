import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** FR-10.2 — product list with search and visibility filtering. */
export default async function AdminProducts({
  searchParams,
}: PageProps<"/admin/products">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const q = String(params?.q ?? "").trim();
  const visibility = String(params?.visibility ?? "");

  const where: Prisma.ProductWhereInput = {
    ...(visibility ? { visibility: visibility as never } : {}),
    ...(q
      ? {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameId: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true, slug: true, nameEn: true, nameId: true, visibility: true,
        availability: true, featured: true, indicativePrice: true, updatedAt: true,
      },
    }),
    db.product.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <span className="text-sm text-muted">{total} total</span>
        <div className="ml-auto flex gap-2">
          <Link href="/admin/products/import" className="border border-line bg-paper px-4 py-2.5 text-xs font-semibold hover:border-ink">
            Import CSV
          </Link>
          <Link href="/admin/products/new" className="bg-red px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink">
            Add product
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2 bg-paper p-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or slug"
          className="min-w-[220px] flex-1 border border-line px-4 py-2.5 text-sm outline-none focus:border-red"
        />
        <select name="visibility" defaultValue={visibility} className="border border-line px-4 py-2.5 text-sm">
          <option value="">All visibility</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        <button className="border border-ink bg-ink px-5 py-2.5 text-xs font-semibold text-paper">
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <p className="bg-paper px-6 py-12 text-center text-sm text-muted">
          {q || visibility ? "Nothing matches that filter." : "No products yet. Import a CSV to get started."}
        </p>
      ) : (
        <div className="overflow-x-auto bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">Name</th>
                <th className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">Availability</th>
                <th className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">Price</th>
                <th className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-warm">
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-red">
                      {p.nameEn}
                    </Link>
                    <span className="ml-2 text-xs text-muted">/{p.slug}</span>
                    {!p.nameId && (
                      <span className="ml-2 text-[0.625rem] font-semibold text-muted" title="No Indonesian translation — English will be shown">
                        EN only
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{p.availability.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-muted">
                    {p.indicativePrice ? `Rp ${p.indicativePrice.toLocaleString("id-ID")}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={
                      p.visibility === "PUBLISHED"
                        ? "text-xs font-semibold text-red"
                        : "text-xs text-muted"
                    }>
                      {p.visibility.toLowerCase()}
                    </span>
                    {p.featured && <span className="ml-2 text-[0.625rem] uppercase text-muted">featured</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 100 && (
        <p className="text-xs text-muted">Showing the 100 most recently updated. Use search to narrow down.</p>
      )}
    </div>
  );
}
