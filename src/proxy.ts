import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, delocalizePath, LOCALE_HEADER, localizePath } from "@/lib/i18n/config";

/**
 * Locale routing without moving every route under app/[lang]: English URLs (/en/...) are
 * rewritten to the German file system routes, with the locale passed on as a request header.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The default locale has no prefix; /de/... would duplicate every page.
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  const { locale, path } = delocalizePath(pathname);
  // Always overwrite the header, so a client cannot pick the locale of a German URL.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  if (locale === DEFAULT_LOCALE) return NextResponse.next({ request: { headers } });

  // One public URL per page and locale, e.g. /en/spielmodus -> /en/gamemodes.
  const canonical = localizePath(path, locale);
  if (canonical !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = search;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Pages only: no build output, API routes or files with an extension (icons, sitemap.xml).
  matcher: ["/((?!_next/|api/|.*\\.[^/]+$).*)"],
};
