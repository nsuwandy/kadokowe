/**
 * Shared types for the admin editors.
 *
 * Kept out of the "use server" action modules, which may only export async
 * functions — a plain export from one resolves to undefined at the import site.
 */

export type SaveState = { ok: boolean; message?: string };
export const emptySaveState: SaveState = { ok: false };

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
