import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

/**
 * Explicit language switch — FR-11.2, FR-11.9.
 *
 * The switcher cannot just link to the other language's URL. With locale
 * detection on and English served unprefixed, a visitor holding
 * NEXT_LOCALE=id who follows a link to /about is redirected straight back to
 * /id/about by the middleware — the switch is silently undone and English
 * becomes unreachable. Detection makes the switcher one-way unless the switch
 * also rewrites the stored preference, which is what this route is for.
 *
 * FR-11.9 puts it plainly: the manual switcher always overrides the browser
 * preference. That override has to be recorded somewhere, and the cookie is
 * the only thing the middleware consults ahead of Accept-Language.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") ?? "";
  const next = url.searchParams.get("next") ?? "/";

  if (!routing.locales.includes(to as (typeof routing.locales)[number])) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  // `next` comes from the page's own URL, but it arrives as a query parameter
  // and is therefore attacker-supplied. Anything not a single-slash relative
  // path is discarded, which rules out "//evil.example" and absolute URLs —
  // an open redirect on a language switcher is still an open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // Strip any existing locale prefix before applying the new one, or
  // switching from /id/about would produce /id/id/about.
  const bare = safeNext.replace(/^\/(en|id)(?=\/|$)/, "") || "/";
  const target =
    to === routing.defaultLocale ? bare : `/${to}${bare === "/" ? "" : bare}`;

  const response = NextResponse.redirect(new URL(target, url.origin));
  response.cookies.set("NEXT_LOCALE", to, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
