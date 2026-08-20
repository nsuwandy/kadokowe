import type { NextRequest } from "next/server";
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
export function proxy(request: NextRequest) {
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
   * `admin` must be excluded explicitly. Without it next-intl treats the
   * first path segment as a locale, fails to match "admin", and rewrites to a
   * locale route that does not exist — which returned 404 for the entire
   * admin area rather than the login redirect. The admin is deliberately
   * English-only (FR-10 says nothing about translating it, and it has one
   * operator), so it has no business in locale routing at all.
   */
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
