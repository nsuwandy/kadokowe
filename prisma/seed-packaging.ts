/**
 * The packaging and decoration add-ons — FR-4.x.
 *
 * Seeded rather than hard-coded so the administrator can rename, reprice and
 * extend them; run once per environment. Re-running is safe, since each row is
 * upserted on its slug — an option whose price has been edited in the admin
 * keeps that price, because only the naming and structure are written back.
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

type Seed = {
  slug: string;
  nameEn: string;
  nameId: string;
  pricing: "FIXED" | "QUOTE";
  /** Starting figure only — the client sets the real ones in the admin. */
  priceDelta?: number;
  children?: Seed[];
};

const OPTIONS: Seed[] = [
  // Decoration, priced per unit. These are the four offered on every product.
  { slug: "laser-engrave", nameEn: "Laser engrave", nameId: "Gravir laser", pricing: "FIXED", priceDelta: 0 },
  { slug: "uv-printing-logo", nameEn: "UV printing — logo", nameId: "Cetak UV — logo", pricing: "FIXED", priceDelta: 0 },
  { slug: "uv-printing-1-side", nameEn: "UV printing — one side", nameId: "Cetak UV — satu sisi", pricing: "FIXED", priceDelta: 0 },
  { slug: "uv-printing-full", nameEn: "UV printing — full print", nameId: "Cetak UV — cetak penuh", pricing: "FIXED", priceDelta: 0 },

  // Packaging. No list price: quantity, material and artwork decide it.
  { slug: "factory-packaging", nameEn: "Factory packaging", nameId: "Kemasan pabrik", pricing: "QUOTE" },
  { slug: "plastic-packaging", nameEn: "Plastic", nameId: "Plastik", pricing: "QUOTE" },
  { slug: "custom-tote-bag", nameEn: "Custom tote bag", nameId: "Tas tote kustom", pricing: "QUOTE" },
  {
    slug: "custom-paper-packaging",
    nameEn: "Custom paper packaging",
    nameId: "Kemasan kertas kustom",
    pricing: "QUOTE",
    children: [
      { slug: "paper-packaging", nameEn: "Paper packaging", nameId: "Kemasan kertas", pricing: "QUOTE" },
      { slug: "softbox-packaging", nameEn: "Softbox packaging", nameId: "Kemasan softbox", pricing: "QUOTE" },
      { slug: "hardbox-packaging", nameEn: "Hardbox packaging", nameId: "Kemasan hardbox", pricing: "QUOTE" },
    ],
  },
];

async function upsert(seed: Seed, sortOrder: number, parentId: string | null) {
  const row = await db.packagingOption.upsert({
    where: { slug: seed.slug },
    // Only structure and naming are written back, so an edited price survives.
    update: { nameEn: seed.nameEn, nameId: seed.nameId, pricing: seed.pricing, sortOrder, parentId },
    create: {
      slug: seed.slug, nameEn: seed.nameEn, nameId: seed.nameId,
      pricing: seed.pricing, priceDelta: seed.priceDelta ?? null,
      sortOrder, parentId, appliesToAll: true,
    },
    select: { id: true },
  });
  let n = 0;
  for (const child of seed.children ?? []) await upsert(child, n++, row.id);
}

async function main() {
  let n = 0;
  for (const option of OPTIONS) await upsert(option, n++, null);
  const total = await db.packagingOption.count();
  console.log(`Packaging options seeded. ${total} in the database.`);
  await db.$disconnect();
}

main();
