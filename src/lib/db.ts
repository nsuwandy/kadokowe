import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * A single Prisma client per process.
 *
 * Prisma 7 requires an explicit driver adapter rather than a bundled query
 * engine, so the Postgres pool is configured here.
 *
 * Two things this has to get right, both learned the hard way:
 *
 * 1. Prisma's own connection-string parameters — connection_limit,
 *    pool_timeout, max_idle_connection_lifetime and friends — mean nothing to
 *    node-postgres. They are stripped, and the pool is configured through
 *    PoolConfig instead. Leaving them in place looks like tuning while
 *    actually configuring nothing, which is how a build ended up failing with
 *    P1017 "Server has closed the connection" on pages that were fine in dev.
 *
 * 2. Prerendering fans out across build workers, each with its own pool. A
 *    small per-process ceiling keeps the total inside the limits of a
 *    connection-limited Postgres — Neon's free tier, or the local dev server.
 *
 * The global cache guards against Next's dev server hot-reloading modules on
 * every edit, which would otherwise open a fresh pool per reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Remove Prisma-engine-only params that node-postgres does not understand. */
function cleanConnectionString(raw: string) {
  try {
    const url = new URL(raw);
    for (const key of [
      "connection_limit",
      "pool_timeout",
      "connect_timeout",
      "socket_timeout",
      "max_idle_connection_lifetime",
      "pgbouncer",
      "schema",
    ]) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function createClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  /**
   * Pool size is per process, and prerendering runs one process per core, so
   * the number that matters is max x workers. The local `prisma dev` proxy
   * budgets about ten connections in total and wants idle ones released
   * quickly; a pooled production endpoint tolerates far more. Hence an env
   * override with a conservative default — guessing high here fails the build
   * with P1017 on a machine with more cores than the developer's.
   */
  const max = Number(process.env.DATABASE_POOL_MAX ?? 1);

  const adapter = new PrismaPg({
    connectionString: cleanConnectionString(raw),
    max: Number.isFinite(max) && max > 0 ? max : 1,
    // Release idle connections promptly rather than holding the budget.
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: true,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
