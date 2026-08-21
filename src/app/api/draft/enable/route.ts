import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { currentAdmin } from "@/lib/auth";

/**
 * Enter preview — FR-10.12.
 *
 * Gated on the admin session rather than the shared secret the Next guide
 * uses for headless CMSes: this site has real authentication, and a secret in
 * a URL is a link that can be forwarded to someone who should not see an
 * unpublished client proposal (FR-13.5).
 */
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const next = new URL(request.url).searchParams.get("next") ?? "/";
  // Attacker-controlled in principle, so only a single-slash relative path is
  // honoured — the same rule as the language switcher.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(safeNext, request.url));
}
