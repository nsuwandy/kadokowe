import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * A single Prisma client per process.
 *
 * Prisma 7 requires an explicit driver adapter rather than bundling a query
 * engine, so the Postgres connection is configured here.
 *
 * The global cache guards against Next's dev server hot-reloading modules on
 * every edit: without it each reload would open a fresh pool and exhaust the
 * connection limit, which bites sooner on a serverless Postgres free tier
 * than on a local one.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
