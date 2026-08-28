import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { HOME_SECTIONS, homeBlocks } from "@/lib/page-content";
import { SectionEditor } from "@/components/admin/SectionEditor";

/**
 * Homepage editor — FR-10.5, FR-10.6.
 *
 * The homepage was previously edited through the generic Page copy list,
 * where two of its ten sections appeared among a dozen unrelated keys. It is
 * the page the client will change most often and the one whose sections only
 * make sense in order, so it gets its own tab, laid out the way the page is
 * read: section by section, top to bottom, numbered as the page numbers them.
 *
 * Every field is an override. An empty field falls back to the wording in the
 * code, which means clearing a field restores the original rather than
 * leaving a hole — said plainly here, because that is not something anyone
 * should have to guess about live copy.
 */
export default async function AdminHome({
  searchParams,
}: PageProps<"/admin/home">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const key = String(params?.key ?? HOME_SECTIONS[0].key);
  const section = HOME_SECTIONS.find((s) => s.key === key) ?? HOME_SECTIONS[0];

  const [blocks, row, featured] = await Promise.all([
    homeBlocks(),
    db.pageContent.findUnique({ where: { key: section.key } }),
    // Section 04 is not copy — it renders whichever project is ticked as
    // featured. Naming it here is the difference between an operator finding
    // that switch and hunting for wording that does not exist.
    db.project.findFirst({
      where: { visibility: "PUBLISHED", featured: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, titleEn: true, client: true },
    }),
  ]);

  return (
    <SectionEditor
      title="Homepage"
      viewHref="/"
      sections={HOME_SECTIONS}
      current={section}
      blocks={blocks}
      hrefFor={(k) => `/admin/home?key=${k}`}
      updatedBy={row?.updatedBy}
      updatedAt={row?.updatedAt}
    >
      {/* The two sections driven by records rather than copy. Pointing at them
          from here saves the search for wording that is not in this editor. */}
      <section className="max-w-[74ch] bg-paper p-6 text-sm text-muted">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Sections that come from your records
        </h2>
        <ul className="flex flex-col gap-2">
          <li>
            <strong className="font-semibold text-ink">04 · Featured project</strong>{" "}
            — the dark band with the statistics shows{" "}
            {featured ? (
              <>
                <strong className="font-semibold text-ink">
                  {featured.client} — {featured.titleEn}
                </strong>
                , because it is ticked as featured.{" "}
                <Link
                  href={`/admin/projects/${featured.id}`}
                  className="font-semibold text-red hover:underline"
                >
                  Edit it
                </Link>
                , or tick a different project under{" "}
                <Link href="/admin/projects" className="font-semibold text-red hover:underline">
                  Our Work
                </Link>
                .
              </>
            ) : (
              <>
                the most recently published project, since none is ticked as
                featured. Tick one under{" "}
                <Link href="/admin/projects" className="font-semibold text-red hover:underline">
                  Our Work
                </Link>
                .
              </>
            )}
          </li>
          <li>
            <strong className="font-semibold text-ink">07 · New discoveries</strong>{" "}
            — the products with the New tick, newest first. Set on each product.
          </li>
          <li>
            <strong className="font-semibold text-ink">09 · Ideas & Insights</strong>{" "}
            — the three most recently published articles, from{" "}
            <Link href="/admin/articles" className="font-semibold text-red hover:underline">
              Insights
            </Link>
            .
          </li>
          <li>
            The client strip is drawn from published projects, so it can never
            name a client whose work is not on the site.
          </li>
        </ul>
      </section>
    </SectionEditor>
  );
}
