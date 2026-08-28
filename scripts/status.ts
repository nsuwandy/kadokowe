/**
 * What is actually in the database this DATABASE_URL points at.
 *
 *   npm run db:status                      # whatever .env points at
 *   DATABASE_URL="postgres://…" npm run db:status   # production
 *
 * Written because "the site looks empty" has several causes that look
 * identical from the outside — no rows, rows saved as Draft, or articles
 * scheduled for a future date — and guessing between them wastes more time
 * than counting does.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function cleanConnectionString(raw: string) {
  const url = new URL(raw);
  for (const key of [
    "connection_limit", "pool_timeout", "connect_timeout",
    "socket_timeout", "max_idle_connection_lifetime", "pgbouncer", "schema",
  ]) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const url = new URL(raw);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: cleanConnectionString(raw), max: 1 }),
  });

  console.log(`\nDatabase: ${url.hostname}${url.pathname}\n`);

  const now = new Date();
  const [
    products, publishedProducts, withHero,
    projects, publishedProjects,
    articles, publishedArticles, liveArticles, withBody,
    terms, admins, enquiries, subscribers, images,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { visibility: "PUBLISHED" } }),
    db.product.count({ where: { heroImage: { not: null } } }),
    db.project.count(),
    db.project.count({ where: { visibility: "PUBLISHED" } }),
    db.article.count(),
    db.article.count({ where: { visibility: "PUBLISHED" } }),
    db.article.count({
      where: {
        visibility: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      },
    }),
    db.article.count({ where: { bodyEn: { not: null } } }),
    db.taxonomyTerm.count(),
    db.adminUser.count(),
    db.enquiry.count(),
    db.newsletterSubscriber.count(),
    db.image.count(),
  ]);

  const row = (label: string, value: number, note = "") =>
    console.log(`  ${String(value).padStart(5)}  ${label}${note ? `  — ${note}` : ""}`);

  console.log("Catalogue");
  row("products", products);
  row("…published (shown on /ideas)", publishedProducts);
  row("…with a hero image", withHero, withHero === 0 ? "everything renders as a placeholder" : "");

  console.log("\nOur Work");
  row("projects", projects);
  row("…published (shown on /our-work)", publishedProjects);

  console.log("\nInsights");
  row("articles", articles);
  row("…published", publishedArticles);
  row(
    "…live now (shown on /insights)",
    liveArticles,
    publishedArticles > liveArticles ? "the rest are scheduled for a future date" : "",
  );
  row("…with body text written", withBody);

  console.log("\nOther");
  row("gallery images", images);
  row("taxonomy terms", terms, terms === 0 ? "browse axes fall back to the built-in list" : "");
  row("admin accounts", admins, admins === 0 ? "nobody can sign in — run npm run admin:set" : "");
  row("enquiries", enquiries);
  row("newsletter subscribers", subscribers);

  if (publishedProducts === 0 && publishedProjects === 0 && liveArticles === 0) {
    console.log(
      "\nEverything is empty. The schema exists but no content has been added —" +
        "\n`prisma migrate deploy` creates tables, it does not add rows.",
    );
  }

  console.log("");
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
