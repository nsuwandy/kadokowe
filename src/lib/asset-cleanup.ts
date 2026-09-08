import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { db } from "./db";
import { CONCEPTS } from "@/content/concepts";

/**
 * Retire a Cloudinary asset when nothing points at it any more.
 *
 * Assets are moved into a `removed/` folder rather than destroyed. The client
 * gets what they asked for — an image dropped in the admin stops cluttering
 * the working media library — without the one property that makes automatic
 * deletion frightening: this is reversible. Emptying that folder is a
 * deliberate act, taken in Cloudinary, by someone who can see what is in it.
 *
 * Nothing is retired without checking every other place a public ID can be
 * referenced. One asset legitimately appears in several: a photograph can be a
 * product hero and a gallery image, or a project's hero and one of its six
 * chapter backgrounds. Retiring on the first removal would pull it out from
 * under the others.
 */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

/** Where retired assets go. Anything already here is left alone. */
const RETIRED_PREFIX = "removed/";

function configured(): boolean {
  return Boolean(CLOUD && KEY && SECRET);
}

/**
 * Which of these are still referenced somewhere.
 *
 * Queried per source rather than per asset, so replacing a ten-image gallery
 * costs a dozen queries rather than a hundred and twenty.
 */
export async function stillReferenced(ids: string[]): Promise<Set<string>> {
  const used = new Set<string>();
  const mark = (rows: { v: string | null }[]) => {
    for (const row of rows) if (row.v) used.add(row.v);
  };

  // Concept Collections are code-managed (FR-13.7), so their heroes are in a
  // source file and no database query would ever see them. Left out, every
  // concept hero would look like an orphan the moment anything else changed.
  for (const concept of CONCEPTS) {
    if (concept.heroImage && ids.includes(concept.heroImage)) used.add(concept.heroImage);
  }

  const [
    products, terms, partners, images, projects, articles,
    collections, issues, families, media, machines,
  ] = await Promise.all([
    db.product.findMany({ where: { heroImage: { in: ids } }, select: { heroImage: true } }),
    db.taxonomyTerm.findMany({ where: { image: { in: ids } }, select: { image: true } }),
    db.partner.findMany({ where: { logo: { in: ids } }, select: { logo: true } }),
    db.image.findMany({ where: { publicId: { in: ids } }, select: { publicId: true } }),
    db.project.findMany({
      where: {
        OR: [
          { heroImage: { in: ids } }, { clientLogo: { in: ids } },
          { briefImage: { in: ids } }, { challengeImage: { in: ids } },
          { thinkingImage: { in: ids } }, { createdWorkImage: { in: ids } },
          { makingImage: { in: ids } }, { impactImage: { in: ids } },
        ],
      },
      select: {
        heroImage: true, clientLogo: true, briefImage: true, challengeImage: true,
        thinkingImage: true, createdWorkImage: true, makingImage: true, impactImage: true,
      },
    }),
    db.article.findMany({
      where: { OR: [{ heroImage: { in: ids } }, { shareImage: { in: ids } }] },
      select: { heroImage: true, shareImage: true },
    }),
    db.conceptCollection.findMany({ where: { heroImage: { in: ids } }, select: { heroImage: true } }),
    db.quarterlyIssue.findMany({ where: { coverImage: { in: ids } }, select: { coverImage: true } }),
    db.craftFamily.findMany({ where: { heroImage: { in: ids } }, select: { heroImage: true } }),
    db.craftMedia.findMany({ where: { publicId: { in: ids } }, select: { publicId: true } }),
    db.craftMachine.findMany({ where: { image: { in: ids } }, select: { image: true } }),
  ]);

  mark(products.map((r) => ({ v: r.heroImage })));
  mark(terms.map((r) => ({ v: r.image })));
  mark(partners.map((r) => ({ v: r.logo })));
  mark(images.map((r) => ({ v: r.publicId })));
  mark(articles.flatMap((r) => [{ v: r.heroImage }, { v: r.shareImage }]));
  mark(collections.map((r) => ({ v: r.heroImage })));
  mark(issues.map((r) => ({ v: r.coverImage })));
  mark(families.map((r) => ({ v: r.heroImage })));
  mark(media.map((r) => ({ v: r.publicId })));
  mark(machines.map((r) => ({ v: r.image })));
  for (const p of projects) {
    mark([
      { v: p.heroImage }, { v: p.clientLogo }, { v: p.briefImage },
      { v: p.challengeImage }, { v: p.thinkingImage }, { v: p.createdWorkImage },
      { v: p.makingImage }, { v: p.impactImage },
    ]);
  }

  // Page copy stores its images inside a JSON column, so there is no column to
  // match on. A substring test over the serialised blocks is crude, but the
  // failure it can produce is the safe one: a false match keeps an asset that
  // could have been retired.
  const pages = await db.pageContent.findMany({ select: { blocks: true } });
  const serialised = JSON.stringify(pages);
  for (const id of ids) {
    if (serialised.includes(`"${id}"`)) used.add(id);
  }

  return used;
}

/**
 * Move any of these that nothing references into the removed folder.
 *
 * Never throws. This runs after a save has already succeeded, and a failure to
 * tidy up must not report the save as failed — the operator would try again
 * and wonder why their perfectly good edit kept erroring.
 */
export async function retireAssets(candidates: (string | null | undefined)[]) {
  if (!configured()) return;

  const ids = [...new Set(candidates.map((c) => c?.trim()).filter(Boolean) as string[])]
    .filter((id) => !id.startsWith(RETIRED_PREFIX));
  if (ids.length === 0) return;

  try {
    const used = await stillReferenced(ids);
    const orphans = ids.filter((id) => !used.has(id));
    if (orphans.length === 0) return;

    cloudinary.config({ cloud_name: CLOUD, api_key: KEY, api_secret: SECRET });

    for (const id of orphans) {
      try {
        await cloudinary.uploader.rename(id, `${RETIRED_PREFIX}${id}`, { overwrite: true });
      } catch (error) {
        // Most often the asset is already gone, or was never ours to move.
        console.info(`[asset-cleanup] could not retire ${id}:`, error);
      }
    }
  } catch (error) {
    console.error("[asset-cleanup] failed:", error);
  }
}

/** The ones that were there before and are not there now. */
export function removedFrom(
  before: (string | null | undefined)[],
  after: (string | null | undefined)[],
): string[] {
  const kept = new Set(after.map((a) => a?.trim()).filter(Boolean) as string[]);
  return [...new Set(before.map((b) => b?.trim()).filter(Boolean) as string[])]
    .filter((id) => !kept.has(id));
}
