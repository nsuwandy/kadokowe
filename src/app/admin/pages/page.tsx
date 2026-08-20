import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { EDITABLE_PAGES, fieldsFor, type PageBlocks } from "@/lib/page-content";
import { PageCopyForm } from "@/components/admin/PageCopyForm";
import { savePageCopy } from "./actions";

/**
 * Page copy — FR-10.5, and FR-12.11 for the seven Custom Made families.
 *
 * Everything here is an override. A page with no row falls back to the
 * wording written into the code, so the list always works and clearing a
 * field restores the original rather than blanking the page. That is said in
 * the UI, because "clear it to reset" is not a guess anyone should have to
 * make about live copy.
 */
export default async function AdminPages({
  searchParams,
}: PageProps<"/admin/pages">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const key = String(params?.key ?? EDITABLE_PAGES[0].key);
  const page = EDITABLE_PAGES.find((p) => p.key === key) ?? EDITABLE_PAGES[0];

  const row = await db.pageContent.findUnique({ where: { key: page.key } });
  const values = (row?.blocks as PageBlocks | null) ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Page copy</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          Override the wording on a page. Leave a field empty to keep the
          original — clearing a field you have changed restores it rather than
          blanking the page.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-px bg-line">
          {EDITABLE_PAGES.map((p) => (
            <a
              key={p.key}
              href={`/admin/pages?key=${p.key}`}
              aria-current={p.key === page.key ? "page" : undefined}
              className={
                p.key === page.key
                  ? "bg-ink px-4 py-3 text-xs font-semibold text-paper"
                  : "bg-paper px-4 py-3 text-xs hover:bg-warm"
              }
            >
              {p.label}
            </a>
          ))}
        </nav>

        <PageCopyForm
          action={savePageCopy}
          pageKey={page.key}
          label={page.label}
          fields={fieldsFor(page.key)}
          values={values}
        />
      </div>

      {row?.updatedBy && (
        <p className="text-xs text-muted">
          Last edited by {row.updatedBy} on{" "}
          {row.updatedAt.toLocaleDateString("en-GB")}.
        </p>
      )}
    </div>
  );
}
