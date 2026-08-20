import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-7.7, FR-10.3 — Our Work project list. */
export default async function AdminProjects() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const projects = await db.project.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true, slug: true, titleEn: true, titleId: true, client: true,
      industry: true, visibility: true, featured: true, sortOrder: true,
      briefEn: true, challengeEn: true, thinkingEn: true,
      createdWorkEn: true, makingEn: true, impactEn: true,
    },
  });

  // FR-7.2 sections are optional; showing how many are filled tells the
  // operator at a glance which stories are thin without opening each one.
  const filled = (p: (typeof projects)[number]) =>
    [p.briefEn, p.challengeEn, p.thinkingEn, p.createdWorkEn, p.makingEn, p.impactEn]
      .filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Our Work</h1>
        <span className="text-sm text-muted">{projects.length} projects</span>
        <Link href="/admin/projects/new" className="ml-auto bg-red px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink">
          Add project
        </Link>
      </div>

      <div className="overflow-x-auto bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["#", "Project", "Client", "Story sections", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-warm">
                <td className="px-5 py-3 text-xs tabular-nums text-muted">{p.sortOrder}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/projects/${p.id}`} className="font-semibold hover:text-red">
                    {p.titleEn}
                  </Link>
                  {!p.titleId && (
                    <span className="ml-2 text-[0.625rem] font-semibold text-muted" title="No Indonesian translation — English will be shown">
                      EN only
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-muted">
                  {p.client}{p.industry ? ` · ${p.industry}` : ""}
                </td>
                <td className="px-5 py-3">
                  <span className={filled(p) < 4 ? "text-xs text-muted" : "text-xs font-semibold"}>
                    {filled(p)} of 6
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={p.visibility === "PUBLISHED" ? "text-xs font-semibold text-red" : "text-xs text-muted"}>
                    {p.visibility.toLowerCase()}
                  </span>
                  {p.featured && <span className="ml-2 text-[0.625rem] uppercase text-muted">featured</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="max-w-[70ch] text-xs text-muted">
        &ldquo;Story sections&rdquo; counts how many of the six narrative
        sections are filled. All six are optional — a project with four reads
        as complete on the site.
      </p>
    </div>
  );
}
