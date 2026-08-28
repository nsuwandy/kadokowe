import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Custom Made categories — FR-12.x.
 *
 * These were code constants until now, so this list is the first place an
 * operator can add a category without a developer.
 */
export default async function AdminCraft() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const families = await db.craftFamily.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, nameEn: true, visibility: true, sortOrder: true,
      heroImage: true,
      _count: { select: { items: true, machines: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Custom Made</h1>
          <p className="mt-2 max-w-[70ch] text-sm text-muted">
            The categories on Custom Made, the examples inside each one, and the
            processes behind them. Adding a category here creates its page.
          </p>
        </div>
        <Link
          href="/admin/craft/new"
          className="ml-auto bg-red px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink"
        >
          Add category
        </Link>
      </div>

      {families.length === 0 ? (
        <p className="bg-paper px-6 py-12 text-center text-sm text-muted">
          No categories yet. The site is falling back to the seven built-in ones
          until you add or import them.
        </p>
      ) : (
        <div className="overflow-x-auto bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["#", "Category", "Examples", "Processes", "Hero", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {families.map((f) => (
                <tr key={f.id}>
                  <td className="px-5 py-3 text-xs tabular-nums text-muted">{f.sortOrder}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/craft/${f.id}`} className="font-semibold hover:text-red">
                      {f.nameEn}
                    </Link>
                    <span className="block font-mono text-[0.6875rem] text-muted">{f.slug}</span>
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-muted">{f._count.items}</td>
                  <td className="px-5 py-3 text-xs tabular-nums text-muted">{f._count.machines}</td>
                  <td className="px-5 py-3 text-xs text-muted">{f.heroImage ? "set" : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={f.visibility === "PUBLISHED" ? "text-xs font-semibold text-red" : "text-xs text-muted"}>
                      {f.visibility.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
