/**
 * Create an administrator, or reset one's password.
 *
 *   npm run admin:set -- someone@kadokowe.com "Their Name"
 *
 * The password is asked for on stdin rather than taken as an argument,
 * because arguments land in shell history and are visible to anyone running
 * `ps` on the machine. It is read twice and compared, since a typo in a
 * credential with no reset flow means recreating the account.
 *
 * There is no public registration and no password reset by design (decision
 * I9, one operator). This script is the whole account lifecycle, so it also
 * serves as the reset: running it against an existing address replaces the
 * password rather than failing.
 */
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const MIN_LENGTH = 12;

const ENTER = ["\r", "\n", "\u0004"];
const CTRL_C = "\u0003";
const BACKSPACE = ["\u007f", "\b"];

function cleanConnectionString(raw: string) {
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
}

let piped: AsyncIterableIterator<string> | null = null;
function pipedLines() {
  piped ??= createInterface({ input: process.stdin })[Symbol.asyncIterator]();
  return piped;
}

/** Read without echoing, so the password never appears on screen. */
async function readSecret(prompt: string): Promise<string> {
  const input = process.stdin;
  const output = process.stdout;
  output.write(prompt);

  // Piped input (CI, or `printf ... | npm run admin:set`). One reader for the
  // whole run: opening a fresh interface per prompt and closing it discards
  // whatever else was buffered, so the second prompt read nothing and every
  // piped run failed as a mismatch.
  if (!input.isTTY) {
    const line = await pipedLines().next();
    output.write("\n");
    return line.done ? "" : line.value;
  }

  input.setRawMode(true);
  input.resume();
  let value = "";

  return new Promise((resolve) => {
    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8");

      if (ENTER.includes(char)) {
        input.setRawMode(false);
        input.pause();
        input.off("data", onData);
        output.write("\n");
        resolve(value);
        return;
      }
      if (char === CTRL_C) {
        input.setRawMode(false);
        output.write("\n");
        process.exit(130);
      }
      if (BACKSPACE.includes(char)) {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };
    input.on("data", onData);
  });
}

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !email.includes("@")) {
    console.error('Usage: npm run admin:set -- <email> ["Display name"]');
    process.exit(1);
  }

  const password = await readSecret(`Password for ${email}: `);
  if (password.length < MIN_LENGTH) {
    console.error(`Too short — use at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const again = await readSecret("Again: ");
  if (password !== again) {
    console.error("Those did not match. Nothing was changed.");
    process.exit(1);
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: cleanConnectionString(process.env.DATABASE_URL!),
      max: 1,
    }),
  });

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.adminUser.findUnique({ where: { email } });

  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash, ...(name ? { name } : {}) },
    create: { email, passwordHash, name: name ?? email.split("@")[0]! },
  });

  console.log(
    existing
      ? `Password reset for ${email}.`
      : `Created ${email}. Sign in at /admin/login.`,
  );

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
