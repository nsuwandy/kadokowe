/**
 * Move Custom Made copy out of Page Copy and into the Custom Made records.
 *
 * The family pages read their headline, introduction and hero from two places
 * at once: a `custom-made.<slug>` Page Copy row, and the CraftFamily record
 * the Custom Made tab edits. Page Copy won for the text and — whenever the
 * family was not published — for the image too, so anything typed into the
 * Custom Made tab quietly did nothing.
 *
 * This copies whatever Page Copy holds into the record, but only where the
 * record has nothing of its own, so a value already set in the Custom Made tab
 * is never overwritten. Run once per environment. Running twice is harmless.
 *
 * The Page Copy rows are left in place rather than deleted: they stop being
 * read, and keeping them means this can be reversed by hand if a value turns
 * out to have been wanted after all.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error("DATABASE_URL is not set.");
const url = new URL(raw);
for (const k of [
  "connection_limit", "pool_timeout", "connect_timeout", "socket_timeout",
  "max_idle_connection_lifetime", "pgbouncer", "schema",
]) url.searchParams.delete(k);

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });

type Blocks = Record<string, { en?: string; id?: string } | undefined>;

async function main() {
  const families = await db.craftFamily.findMany({
    select: {
      id: true, slug: true, leadEn: true, leadId: true,
      introEn: true, introId: true, heroImage: true,
    },
  });

  let moved = 0;
  for (const family of families) {
    const row = await db.pageContent.findUnique({
      where: { key: `custom-made.${family.slug}` },
    });
    const blocks = (row?.blocks as Blocks | null) ?? {};

    const take = (value: string | null | undefined, incoming?: string) =>
      value && value.trim() !== "" ? undefined : incoming?.trim() || undefined;

    const data = {
      leadEn: take(family.leadEn, blocks.heading?.en),
      leadId: take(family.leadId, blocks.heading?.id),
      introEn: take(family.introEn, blocks.intro?.en),
      introId: take(family.introId, blocks.intro?.id),
      heroImage: take(family.heroImage, blocks.hero?.en),
    };

    const changes = Object.entries(data).filter(([, v]) => v !== undefined);
    if (changes.length === 0) continue;

    await db.craftFamily.update({ where: { id: family.id }, data });
    moved += 1;
    console.log(`  ${family.slug}: adopted ${changes.map(([k]) => k).join(", ")}`);
  }

  console.log(
    moved === 0
      ? "Nothing to move — every family already holds its own copy."
      : `Moved copy into ${moved} ${moved === 1 ? "family" : "families"}.`,
  );
  await db.$disconnect();
}

main();
