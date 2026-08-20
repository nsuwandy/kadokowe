import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categoryByKey } from "@/content/insights";

/** FR-8.5, FR-10.3 — Insights article list. */
export default async function AdminArticles() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const articles = await db.article.findMany({
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true, slug: true, titleEn: true, titleId: true, category: true,
      visibility: true, featured: true, publishedAt: true, bodyEn: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Insights</h1>
        <span className="text-sm text-muted">{articles.length} articles</span>
        <Link href="/admin/articles/new" className="ml-auto bg-red px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink">
          Add article
        </Link>
      </div>

      <div className="overflow-x-auto bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Article", "Category", "Body", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-warm">
                <td className="px-5 py-3">
                  <Link href={`/admin/articles/${a.id}`} className="font-semibold hover:text-red">
                    {a.titleEn}
                  </Link>
                  {!a.titleId && (
                    <span className="ml-2 text-[0.625rem] font-semibold text-muted" title="No Indonesian translation">EN only</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-muted">
                  {categoryByKey(a.category)?.en ?? a.category}
                </td>
                <td className="px-5 py-3">
                  <span className={a.bodyEn ? "text-xs text-muted" : "text-xs font-semibold text-red"}>
                    {a.bodyEn ? "written" : "not written"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={a.visibility === "PUBLISHED" ? "text-xs font-semibold text-red" : "text-xs text-muted"}>
                    {a.visibility.toLowerCase()}
                  </span>
                  {a.featured && <span className="ml-2 text-[0.625rem] uppercase text-muted">featured</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="max-w-[70ch] text-xs text-muted">
        An article marked &ldquo;not written&rdquo; has a title and standfirst
        but no body. It still renders on the site, showing the related work
        instead — but it reads as a placeholder until the body is filled.
      </p>
    </div>
  );
}
