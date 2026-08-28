import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { HOME_SECTIONS, fieldsFor, homeBlocks } from "@/lib/page-content";
import { PageCopyForm } from "@/components/admin/PageCopyForm";
import { savePageCopy } from "@/app/admin/pages/actions";

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

  const values = blocks[section.key] ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">Homepage</h1>
        <Link
          href="/"
          target="_blank"
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          View the homepage ↗
        </Link>
      </div>
      <p className="-mt-3 max-w-[74ch] text-sm text-muted">
        The sections below are in the order they appear on the page. Leave a
        field empty to keep the original wording — clearing a field you have
        changed restores it rather than blanking the page.
      </p>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="flex flex-col gap-px self-start bg-line">
          {HOME_SECTIONS.map((s) => {
            const edited = Object.keys(blocks[s.key] ?? {}).length > 0;
            return (
              <a
                key={s.key}
                href={`/admin/home?key=${s.key}`}
                aria-current={s.key === section.key ? "page" : undefined}
                className={
                  s.key === section.key
                    ? "flex items-center gap-2 bg-ink px-4 py-3 text-xs font-semibold text-paper"
                    : "flex items-center gap-2 bg-paper px-4 py-3 text-xs hover:bg-warm"
                }
              >
                <span className="flex-1">{s.label}</span>
                {/* Which sections have been touched is the first thing anyone
                    coming back to this page wants to know. */}
                {edited && (
                  <span
                    title="Edited"
                    aria-label="Edited"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-red"
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4">
          <p className="border-l-2 border-line bg-paper px-5 py-3 text-xs text-muted">
            {section.note}
          </p>

          <PageCopyForm
            action={savePageCopy}
            pageKey={section.key}
            label={section.label}
            fields={fieldsFor(section.key)}
            values={values}
          />

          {row?.updatedBy && (
            <p className="text-xs text-muted">
              Last edited by {row.updatedBy} on{" "}
              {row.updatedAt.toLocaleDateString("en-GB")}.
            </p>
          )}
        </div>
      </div>

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
    </div>
  );
}
