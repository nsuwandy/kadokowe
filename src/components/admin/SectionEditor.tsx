import Link from "next/link";
import { fieldsFor, type PageBlocks } from "@/lib/page-content";
import { PageCopyForm } from "@/components/admin/PageCopyForm";
import { savePageCopy } from "@/app/admin/pages/actions";

/**
 * One page's sections, laid out the way the page is read.
 *
 * Shared by the Homepage and About tabs. They were the same screen twice, and
 * two copies of a screen is how one of them quietly stops matching the other
 * the first time either is touched.
 *
 * Every field is an override: an empty one falls back to the wording in the
 * code, so clearing a field restores the original rather than leaving a hole.
 * Said in the UI, because that is not something anyone should have to guess
 * about live copy.
 */
export type Section = { key: string; label: string; note: string };

export function SectionEditor({
  title,
  viewHref,
  sections,
  current,
  blocks,
  hrefFor,
  updatedBy,
  updatedAt,
  children,
}: {
  title: string;
  viewHref: string;
  sections: readonly Section[];
  current: Section;
  blocks: Record<string, PageBlocks>;
  /** Builds the link to a section, so each tab keeps its own route. */
  hrefFor: (key: string) => string;
  updatedBy?: string | null;
  updatedAt?: Date | null;
  /** Anything the page wants below the editor — the Homepage tab uses it to
   *  name the sections that come from records rather than copy. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link
          href={viewHref}
          target="_blank"
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          View the page ↗
        </Link>
      </div>
      <p className="-mt-3 max-w-[74ch] text-sm text-muted">
        The sections below are in the order they appear on the page. Leave a
        field empty to keep the original wording — clearing a field you have
        changed restores it rather than blanking the page.
      </p>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="flex flex-col gap-px self-start bg-line">
          {sections.map((s) => {
            const edited = Object.keys(blocks[s.key] ?? {}).length > 0;
            return (
              <a
                key={s.key}
                href={hrefFor(s.key)}
                aria-current={s.key === current.key ? "page" : undefined}
                className={
                  s.key === current.key
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
            {current.note}
          </p>

          <PageCopyForm
            action={savePageCopy}
            pageKey={current.key}
            label={current.label}
            fields={fieldsFor(current.key)}
            values={blocks[current.key] ?? {}}
          />

          {updatedBy && (
            <p className="text-xs text-muted">
              Last edited by {updatedBy}
              {updatedAt && ` on ${updatedAt.toLocaleDateString("en-GB")}`}.
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
