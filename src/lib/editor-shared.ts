/**
 * Shared types for the admin editors.
 *
 * Kept out of the "use server" action modules, which may only export async
 * functions — a plain export from one resolves to undefined at the import site.
 */

export type SaveState = { ok: boolean; message?: string };
export const emptySaveState: SaveState = { ok: false };

/**
 * Optimistic concurrency for the editors that replace a whole record.
 *
 * These forms are a wholesale replace: the save deletes every child row and
 * recreates them from what that browser holds in memory. With two people in
 * the admin — and Kadokowe has two — the second save silently reverts the
 * first, because the second browser's idea of the gallery is whatever it
 * loaded before the first person touched it.
 *
 * That alone would only cost an edit. What made it expensive is the cleanup
 * that follows: rows the save "removed" have their Cloudinary assets renamed
 * into the removed folder. So a stale save did not merely revert someone's
 * photographs, it moved the files out from under them. Recoverable, since
 * nothing is deleted, but not obviously so at the time.
 *
 * The guard is the record's own `updatedAt`, carried out to the form and back,
 * and applied as part of the update's where clause rather than as a check
 * before it — a read-then-write check has a window between the two, and this
 * has none. A stale save matches no row, writes nothing, and says so.
 *
 * It also protects the cleanup step for free: the "what did this point at
 * before" read happens before the update, so if anything had landed in
 * between, the update would fail rather than diff against a stale picture.
 */
export const STALE_MESSAGE =
  "Someone else saved this while you had it open, so nothing was changed — your copy would have replaced theirs. Reload the page and make your change again.";

/** The token a form carries so the save can tell whether the record moved. */
export function editStamp(updatedAt: Date | null | undefined): string {
  return updatedAt ? updatedAt.toISOString() : "";
}

/**
 * Read it back off the submission.
 *
 * Undefined means no guard, which is correct in two cases: a record being
 * created, and a page that was open before this shipped. Neither should be
 * refused — the first has nothing to conflict with, and the second is no worse
 * off than it was yesterday.
 */
export function expectedStamp(formData: FormData): Date | undefined {
  const raw = String(formData.get("updatedAt") ?? "").trim();
  if (!raw) return undefined;
  const at = new Date(raw);
  return Number.isNaN(at.getTime()) ? undefined : at;
}

/** Applied to an update's where clause, alongside the id. */
export function stampGuard(expected: Date | undefined) {
  return expected ? { updatedAt: expected } : {};
}

/**
 * Prisma's "no row matched what you asked for".
 *
 * With the guard in the where clause this means the record moved on — or was
 * deleted, which the message has to allow for too.
 */
export function isStaleWrite(error: unknown): boolean {
  return (error as { code?: string })?.code === "P2025";
}

export const VISIBILITY_OPTIONS = [
  { value: "DRAFT", label: "Draft — not on the site" },
  { value: "PUBLISHED", label: "Published — live on the site" },
  { value: "HIDDEN", label: "Hidden — reachable by link only" },
] as const;

/**
 * FR-7.2 — the six narrative sections, every one optional.
 *
 * Order matters: it is the order they render in, and the order the story is
 * meant to be read in. The public page numbers whatever is filled, so gaps
 * never show as skipped numbers.
 */
export const STORY_SECTIONS = [
  {
    key: "brief",
    label: "The Brief",
    hint: "What the client originally asked for — in their words, before we reframed it.",
  },
  {
    key: "challenge",
    label: "The Challenge",
    hint: "The constraint: budget, deadline, audience, or the thing that made the obvious answer wrong.",
  },
  {
    key: "thinking",
    label: "Our Thinking",
    hint: "How we read the situation. This is the section that shows Kadokowe as a consultant rather than a supplier.",
  },
  {
    key: "createdWork",
    label: "What We Created",
    hint: "The solution itself — product, packaging, design.",
  },
  {
    key: "making",
    label: "Making It Happen",
    hint: "How it got produced: sourcing, in-house work, the timeline that made it possible.",
  },
  {
    key: "impact",
    label: "The Impact",
    hint: "What it achieved for the client. Concrete beats adjectives.",
  },
] as const;
