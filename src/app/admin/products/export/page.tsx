import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  EXPORT_FIELDS,
  FIELD_GROUPS,
  PHOTO_FIELD,
  CODE_PREFIX,
} from "@/lib/product-export-fields";
import { PHOTO_LIMIT } from "@/lib/product-export-media";

/**
 * Build a catalogue sheet — the presentation half of the export.
 *
 * Separate from the CSV button on the product list, and the separation is the
 * point. The CSV is machine-shaped and goes back into the importer; this makes
 * a document to send someone. Merging them would mean one file trying to be
 * both, and the round trip is the half that breaks silently when it loses.
 *
 * A plain GET form, no client JavaScript: the ticks become query parameters
 * and the route reads them. That also makes any particular sheet a URL the
 * operator can bookmark — "the price list I send retail clients" is a link
 * rather than nine checkboxes to re-tick each quarter.
 */
export default async function ExportPage({
  searchParams,
}: PageProps<"/admin/products/export">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const q = String(params?.q ?? "").trim();
  const visibility = String(params?.visibility ?? "");

  // Shown so the operator knows the size of what they are about to build
  // before they build it, rather than after a thirty-second wait.
  const matching = await db.product.count({
    where: {
      ...(["PUBLISHED", "DRAFT", "HIDDEN"].includes(visibility.toUpperCase())
        ? { visibility: visibility.toUpperCase() as never }
        : {}),
      ...(q
        ? {
            OR: [
              { nameEn: { contains: q, mode: "insensitive" as const } },
              { nameId: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
  });

  const box = "size-4 shrink-0 accent-red";
  const field = "border border-line px-4 py-2.5 text-sm outline-none focus:border-red";

  return (
    <div className="flex max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Export a catalogue sheet</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          Pick the columns you want and download them as an Excel workbook or a
          PDF, with the product photographs in place. This is the file to send a
          client.{" "}
          <Link href="/admin/products" className="font-semibold text-red hover:underline">
            The CSV on the product list
          </Link>{" "}
          is the other kind of export — every column, machine-readable, made to
          be edited and imported back.
        </p>
      </div>

      <form method="get" action="/api/admin/products/export" className="flex flex-col gap-8">
        {/* ------------------------------------------------------- format */}
        <section className="bg-paper p-6">
          <h2 className="text-sm font-semibold">1. Format</h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-start gap-3">
              <input type="radio" name="format" value="xlsx" defaultChecked className={`${box} mt-0.5`} />
              <span>
                <span className="block text-sm font-semibold">Excel workbook</span>
                <span className="block max-w-[36ch] text-xs text-muted">
                  Every column you tick, photographs sitting in their cells,
                  with a filter row. Filtering keeps the pictures with their
                  rows; re-sorting the sheet in Excel does not move them.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="radio" name="format" value="pdf" className={`${box} mt-0.5`} />
              <span>
                <span className="block text-sm font-semibold">PDF sheet</span>
                <span className="block max-w-[36ch] text-xs text-muted">
                  One product per row, photograph on the left and the fields
                  beside it. Made to be printed or emailed, not edited.
                </span>
              </span>
            </label>
          </div>
          <label className="mt-5 flex items-start gap-3 border-t border-line pt-5">
            <input type="checkbox" name="photos" value="1" defaultChecked className={`${box} mt-0.5`} />
            <span>
              <span className="block text-sm font-semibold">Include photographs</span>
              <span className="block max-w-[60ch] text-xs text-muted">
                Each product&rsquo;s main photo, or the first gallery image if no
                main photo is set. Adds time and file size: the first{" "}
                {PHOTO_LIMIT} products get a picture, and any beyond that
                export without one. Turn this off for a fast, text-only sheet.
              </span>
            </span>
          </label>
        </section>

        {/* ------------------------------------------------------ columns */}
        <section className="bg-paper p-6">
          <h2 className="text-sm font-semibold">2. Columns</h2>
          <p className="mt-1 max-w-[70ch] text-xs text-muted">
            Ticked below is a sensible client-facing sheet. Empty fields are
            left out of the PDF row by row, so a product with no capacity does
            not print an empty label.
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FIELD_GROUPS.map((group) => (
              <div key={group}>
                <h3 className="mb-2 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">
                  {group}
                </h3>
                <div className="flex flex-col gap-2">
                  {EXPORT_FIELDS.filter((f) => f.group === group).map((f) => (
                    <label key={f.key} className="flex items-center gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        name="fields"
                        value={f.key}
                        defaultChecked={f.standard}
                        className={box}
                      />
                      <span>
                        {f.label}
                        {f.key === "code" && (
                          <span className="ml-1.5 text-xs text-muted">{CODE_PREFIX}-001</span>
                        )}
                        {f.key === PHOTO_FIELD && (
                          <span className="ml-1.5 text-xs text-muted">the picture itself</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-[70ch] border-t border-line pt-4 text-xs text-muted">
            <strong className="font-semibold text-ink">About the {CODE_PREFIX} code.</strong>{" "}
            It numbers the rows of this sheet, in name order, starting at{" "}
            {CODE_PREFIX}-001. It is not stored on the product, so a sheet you
            export next month will number things differently once the catalogue
            has changed. Good for pointing at a row while someone has the file
            open; not a part number to quote back.
          </p>
        </section>

        {/* ------------------------------------------------------- filter */}
        <section className="bg-paper p-6">
          <h2 className="text-sm font-semibold">3. Which products</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or slug — leave blank for all"
              className={`min-w-[240px] flex-1 ${field}`}
            />
            <select name="visibility" defaultValue={visibility} className={field}>
              <option value="">Any status</option>
              <option value="PUBLISHED">Published only</option>
              <option value="DRAFT">Draft only</option>
              <option value="HIDDEN">Hidden only</option>
            </select>
          </div>
          <p className="mt-3 text-xs text-muted">
            {q || visibility ? (
              <>
                <strong className="font-semibold text-ink">{matching}</strong>{" "}
                product{matching === 1 ? "" : "s"} match this filter right now.
                Change it above and the count updates when you re-open this
                page.
              </>
            ) : (
              <>
                <strong className="font-semibold text-ink">{matching}</strong>{" "}
                product{matching === 1 ? "" : "s"} in the catalogue. Drafts and
                hidden products are included unless you narrow it.
              </>
            )}
          </p>
        </section>

        <div className="flex items-center gap-4">
          <button className="bg-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink">
            Download
          </button>
          <span className="text-xs text-muted">
            Large catalogues with photographs can take up to a minute.
          </span>
        </div>
      </form>
    </div>
  );
}
