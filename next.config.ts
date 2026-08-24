import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Keep the source-asset shelf out of the build trace.
   *
   * assets/ holds client-supplied originals — logo masters, brand files —
   * that nothing imports. The tracer walks them anyway, and one of them broke
   * the build outright: a JPEG carrying macOS quarantine attributes returned
   * EPERM on read and took the whole compile down with a Turbopack panic. The
   * folder has no business in the trace regardless, and excluding it means a
   * file dropped there can never break a deploy again.
   */
  outputFileTracingExcludes: {
    "*": ["./assets/**"],
  },

  experimental: {
    /**
     * Build-time database concurrency.
     *
     * Prerendering fans out across one worker per core, and each worker opens
     * its own Prisma pool. Against a connection-limited Postgres — Neon's free
     * tier, or the local dev server — that exhausts connections and every
     * affected page logs "Server has closed the connection" before falling
     * back to dynamic rendering. The build still succeeds, which is the
     * dangerous part: a hundred error lines in the log train everyone to
     * ignore them, and a real failure hides in the noise.
     *
     * Raising pages-per-worker collapses the fan-out for a catalogue of this
     * size. Revisit once the catalogue is large enough that build time
     * matters more than connection headroom.
     */
    staticGenerationMinPagesPerWorker: 200,
    staticGenerationMaxConcurrency: 4,
  },
};

export default nextConfig;
