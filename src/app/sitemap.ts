import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { AXES, AXIS_KEYS } from "@/content/taxonomy";
import { FAMILIES } from "@/content/custom-made";
import { CATEGORIES } from "@/content/insights";
import { publishedConcepts } from "@/content/concepts";

/**
 * Sitemap — NFR-6.2, and hreflang via alternates (FR-11.5).
 *
 * Every entry carries both language variants so search engines can pair them.
 * Without that pairing the Indonesian pages compete with the English ones
 * rather than being understood as translations of them.
 */
/**
 * Generated per request rather than at build time.
 *
 * Build workers run with a constrained connection pool, and the sitemap was
 * consistently the query that lost the race — falling into the catch below
 * and shipping without any product, project or article URLs. A sitemap
 * missing most of the site is worse than one generated a moment later, and
 * crawlers fetch it rarely enough that the cost is irrelevant. It also means
 * newly published content appears without a rebuild.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const entry = (path: string, priority = 0.7): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    priority,
    alternates: {
      languages: {
        en: `${base}${path}`,
        id: `${base}/id${path}`,
      },
    },
  });

  const staticPaths: [string, number][] = [
    ["", 1],
    ["/what-we-do", 0.9],
    ["/ideas", 0.9],
    ["/ideas/concepts", 0.7],
    ["/ideas/ready-stock/all", 0.7],
    ["/custom-made", 0.9],
    ["/our-work", 0.9],
    ["/insights", 0.8],
    ["/about", 0.7],
    ["/start-a-project", 0.9],
    ["/privacy", 0.3],
    ["/terms", 0.3],
  ];

  const entries = staticPaths.map(([p, prio]) => entry(p, prio));

  for (const key of AXIS_KEYS) {
    for (const term of AXES[key].terms) {
      entries.push(entry(`/ideas/${key}/${term.slug}`, 0.6));
    }
  }
  for (const f of FAMILIES) entries.push(entry(`/custom-made/${f.slug}`, 0.8));
  for (const c of CATEGORIES) entries.push(entry(`/insights/category/${c.slug}`, 0.6));
  for (const c of publishedConcepts()) entries.push(entry(`/ideas/concepts/${c.slug}`, 0.6));

  try {
    const [products, projects, articles] = await Promise.all([
      db.product.findMany({ where: { visibility: "PUBLISHED" }, select: { slug: true } }),
      db.project.findMany({ where: { visibility: "PUBLISHED" }, select: { slug: true } }),
      db.article.findMany({ where: { visibility: "PUBLISHED" }, select: { slug: true } }),
    ]);
    for (const p of products) entries.push(entry(`/ideas/${p.slug}`, 0.7));
    for (const p of projects) entries.push(entry(`/our-work/${p.slug}`, 0.8));
    for (const a of articles) entries.push(entry(`/insights/${a.slug}`, 0.7));
  } catch (error) {
    // A sitemap missing its dynamic entries is recoverable; a build that
    // fails because the database was briefly unreachable is not.
    console.error("sitemap: database unavailable, serving static entries", error);
  }

  return entries;
}
