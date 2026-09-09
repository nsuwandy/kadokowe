/**
 * Stand-in for the real `server-only` package under the test runner.
 *
 * That package exists to break the build if a server module is pulled into a
 * client bundle, and it does it by throwing on import outside React's
 * server condition — which a plain Node test run also is. Without this shim
 * the modules most worth testing, the ones that talk to the database or build
 * a file, are the only ones that cannot be imported by a test.
 *
 * Wired up in tsconfig.test.json, so it applies to the test run and nothing
 * else. The real guard still protects the application build.
 */
export {};
