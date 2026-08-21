import { draftMode } from "next/headers";

/**
 * Preview unpublished content — FR-10.12.
 *
 * Built on Next's Draft Mode rather than an ad-hoc cookie check. The first
 * attempt read the admin session directly in each page, which worked and
 * quietly turned every product, project and article page from prerendered
 * into on-demand — the whole catalogue rendered per request to give one
 * operator a preview. Draft Mode exists precisely for this: the page stays
 * prerendered for the public and is bypassed only for the request carrying
 * the draft cookie.
 *
 * Access is gated on the admin session in the route that enables it, not on
 * a shared secret. The site already has authentication, and a secret in a URL
 * is a link that forwards — which is how an unpublished client proposal
 * escapes (FR-13.5).
 */
export async function isPreview(): Promise<boolean> {
  return (await draftMode()).isEnabled;
}

/**
 * The visibility filter for a public detail page: published only, unless the
 * request is a preview.
 */
export function visibilityFilter(preview: boolean) {
  return preview ? {} : { visibility: "PUBLISHED" as const };
}

/**
 * Says plainly that what is on screen is not what the public sees, and offers
 * the way out. Without an exit an operator stays in preview across the whole
 * site and starts believing drafts are live.
 */
export function PreviewBanner({ status }: { status: string }) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-ink px-gutter py-2.5 text-center text-xs font-semibold text-warm">
      <span>
        Preview — this is {status.toLowerCase()} and is not visible to the
        public.
      </span>
      {/* A form rather than a link: leaving preview is an action that clears
          a cookie server-side, and a client-side <Link> navigation would not
          run the route handler that does it. */}
      <form action="/api/draft/disable">
        <button className="underline underline-offset-2 hover:text-paper">
          Leave preview
        </button>
      </form>
    </div>
  );
}
