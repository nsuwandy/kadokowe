import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { importTemplateCsv } from "@/lib/product-import";
import { ImportForm } from "@/components/admin/ImportForm";

/**
 * Bulk product import — FR-10.11.
 *
 * Rated Must rather than Should because the launch plan depends on it: the
 * client grows the catalogue from the curated launch set to the full one
 * themselves, and a one-at-a-time form does not work at that scale.
 */
export default async function ImportPage() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Import products</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          Upload a CSV exported from a spreadsheet, or paste the rows directly.
          Products are matched on <code className="bg-warm px-1">slug</code> — an
          existing product is updated, a new one is created. Everything imports as
          a draft unless you set <code className="bg-warm px-1">visibility</code> to
          PUBLISHED.
        </p>
      </div>

      <ImportForm />

      <section className="bg-paper p-6">
        <h2 className="mb-3 text-sm font-semibold">Column guide</h2>
        <p className="mb-4 max-w-[70ch] text-sm text-muted">
          Only <code className="bg-warm px-1">name_en</code> and{" "}
          <code className="bg-warm px-1">short_en</code> are required — a
          partially written catalogue still imports. Multi-value fields (tags,
          colours, purposes, industries, customisation) separate entries with{" "}
          <code className="bg-warm px-1">|</code>. Budget tier is worked out from{" "}
          <code className="bg-warm px-1">indicative_price</code>, so there is no
          need to tag it.
        </p>
        <a
          href="/api/admin/import-template"
          download="kadokowe-products-template.csv"
          className="text-xs font-semibold text-red hover:underline"
        >
          Download template CSV ↓
        </a>
        <pre className="mt-4 overflow-x-auto border border-line bg-warm p-4 font-mono text-[0.6875rem] leading-relaxed">
          {importTemplateCsv()}
        </pre>
      </section>
    </div>
  );
}
