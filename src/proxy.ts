import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

/**
 * Wraps next-intl's request handler to also expose the resolved locale as a request
 * header.
 *
 * The root layout owns <html> and so owns the `lang` attribute, but it sits
 * above the [locale] segment and cannot read route params. Passing the locale
 * down as a header is the supported way to get it there, and getting `lang`
 * right matters: it drives screen-reader pronunciation and hreflang
 * correctness (FR-11.5).
 */
/**
 * Holding-page curtain — set COMING_SOON to any non-empty value.
 *
 * The domain goes live before the catalogue does. Without this, pointing DNS
 * means anyone who types the address sees twelve products, grey placeholders
 * where the photography belongs and unwritten articles — which is worse than
 * seeing nothing, because it is the first impression and it is wrong.
 *
 * Deliberately a curtain, not access control. The bypass is a shared token,
 * so anyone holding the link gets through; that is the right trade for
 * letting the client review the real site without accounts. What it protects
 * is the impression, not the data. The admin behind it stays properly
 * authenticated, and Concept Collections stay Draft by default (FR-13.4).
 */
const COMING_SOON = Boolean(process.env.COMING_SOON);
const BYPASS_TOKEN = process.env.COMING_SOON_BYPASS;
const BYPASS_COOKIE = "kdw_preview";

function holdingPage(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // The holding page itself, or anything that is not a public page.
  if (pathname === "/coming-soon") return null;

  // A valid token in the query grants a cookie, so the link only has to be
  // used once and every later navigation works normally.
  if (BYPASS_TOKEN && searchParams.get("preview") === BYPASS_TOKEN) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("preview");
    const response = NextResponse.redirect(url);
    response.cookies.set(BYPASS_COOKIE, BYPASS_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  if (BYPASS_TOKEN && request.cookies.get(BYPASS_COOKIE)?.value === BYPASS_TOKEN) {
    return null;
  }

  // Whoever is signed in to the admin is working on the site and should see
  // it. Presence of the session cookie is enough here — this is a curtain,
  // and the admin routes themselves still verify the session properly.
  if (request.cookies.has("kdw_admin")) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  url.search = "";
  // Rewritten rather than redirected, so the address bar keeps the domain and
  // the holding page does not become a URL people bookmark and return to.
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  if (COMING_SOON) {
    const held = holdingPage(request);
    if (held) return held;
  }

  const response = intl(request);

  const { pathname } = request.nextUrl;
  const locale = pathname === "/id" || pathname.startsWith("/id/") ? "id" : "en";
  response.headers.set("x-kdw-locale", locale);

  return response;
}

export const config = {
  /**
   * Skip API routes, the admin area, Next internals, and anything with a file
   * extension.
   *
   * `coming-soon` is excluded so the holding page can be opened directly to
   * check how it looks, with or without the curtain switched on. Left in,
   * next-intl rewrites it to /en/coming-soon — a route that does not exist —
   * and previewing it returns 404.
   *
   * `admin` must be excluded explicitly. Without it next-intl treats the
   * first path segment as a locale, fails to match "admin", and rewrites to a
   * locale route that does not exist — which returned 404 for the entire
   * admin area rather than the login redirect. The admin is deliberately
   * English-only (FR-10 says nothing about translating it, and it has one
   * operator), so it has no business in locale routing at all.
   */
  matcher: ["/((?!api|admin|coming-soon|_next|_vercel|.*\\..*).*)"],
};
