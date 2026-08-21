import type { Prisma } from "@/generated/prisma/client";

/**
 * The condition for an article being publicly visible — FR-8.5.
 *
 * Visibility alone is not enough once articles can be scheduled: a piece
 * marked Published with a future date must stay off the site until that date
 * arrives. Defined once because the check appears in five places, and a
 * scheduling rule that holds on the index but not on the article's own URL
 * is not a scheduling rule at all — the link would simply be shareable early.
 *
 * A null publishedAt counts as visible. It means an article published before
 * scheduling existed, and hiding the back catalogue to add a feature would be
 * a poor trade.
 */
export function livePublished(now: Date = new Date()): Prisma.ArticleWhereInput {
  return {
    visibility: "PUBLISHED",
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

/** Whether an article is visible to the public right now. */
export function isLive(
  article: { visibility: string; publishedAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (article.visibility !== "PUBLISHED") return false;
  return article.publishedAt === null || article.publishedAt <= now;
}
