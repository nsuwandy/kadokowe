import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";
import { db } from "./db";

/**
 * Admin authentication — FR-10.1, NFR-3.2, NFR-3.4.
 *
 * A single administrator at launch with no permission tiers (decision I9),
 * but the session carries a role and the model has an AdminUser table, so
 * adding staff accounts later needs no restructuring. That costs nothing now
 * and avoids a rebuild if the team grows.
 *
 * iron-session rather than a full auth framework: this is one credentials
 * login with no OAuth, no account linking and no public registration.
 * Auth.js would bring machinery none of which is used. The cookie is
 * encrypted and signed by iron-session, httpOnly, and sameSite lax.
 */

export type AdminSession = {
  userId?: string;
  email?: string;
  role?: string;
};

function sessionOptions(): SessionOptions {
  const password = process.env.AUTH_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to at least 32 characters. Generate one with: openssl rand -base64 32",
    );
  }
  return {
    password,
    cookieName: "kdw_admin",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // NFR-3.9 — expires after inactivity window
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<AdminSession>(await cookies(), sessionOptions());
}

/**
 * Resolve the signed-in administrator, or null.
 *
 * Re-reads the user on every call rather than trusting the cookie payload, so
 * deactivating an account takes effect immediately instead of at the next
 * session expiry. A stale cookie should not outlive the account it names.
 */
export async function currentAdmin() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await db.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user || !user.active) return null;
  return user;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await db.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Hash even when the user is absent, so a missing account and a wrong
  // password take comparable time and the response cannot be used to
  // enumerate valid addresses.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(password, hash);

  if (!ok || !user || !user.active) return null;

  await db.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
