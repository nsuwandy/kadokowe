/**
 * Move the seven Custom Made families out of code and into the database.
 *
 * Run once against any database that predates the admin-managed Custom Made
 * tables. It upserts on slug, so running it twice is safe, and it never
 * overwrites a family an operator has since edited — an existing row is left
 * exactly as it is.
 *
 * The families arrive PUBLISHED because they were already live as code; the
 * point of this script is that the pages keep working, not that they need
 * re-approving.
 *
 *   npm run db:seed:craft
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { FAMILIES } from "../src/content/custom-made";

function clean(raw: string) {
  const url = new URL(raw);
  for (const k of ["connection_limit","pool_timeout","connect_timeout","socket_timeout","max_idle_connection_lifetime","pgbouncer","schema"]) {
    url.searchParams.delete(k);
  }
  return url.toString();
}

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: clean(process.env.DATABASE_URL!), max: 1 }),
  });

  let created = 0;
  let skipped = 0;

  for (const [i, f] of FAMILIES.entries()) {
    const existing = await db.craftFamily.findUnique({ where: { slug: f.slug } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await db.craftFamily.create({
      data: {
        slug: f.slug,
        nameEn: f.nameEn,
        nameId: f.nameId,
        leadEn: f.leadEn,
        leadId: f.leadId,
        introEn: f.introEn,
        introId: f.introId,
        sortOrder: i,
        visibility: "PUBLISHED",
        options: (f.options ?? []).map((o) => ({
          nameEn: o.en, nameId: o.id, descEn: o.descEn, descId: o.descId,
        })),
        branding: f.branding.map((b) => ({ nameEn: b, nameId: null })),
        items: {
          create: f.examplesEn.map((name, n) => ({
            nameEn: name,
            nameId: f.examplesId[n] ?? null,
            sortOrder: n,
          })),
        },
      },
    });
    created += 1;
  }

  const counts = {
    families: await db.craftFamily.count(),
    items: await db.craftItem.count(),
    machines: await db.craftMachine.count(),
  };
  console.log(`Created ${created}, left alone ${skipped}.`, counts);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
