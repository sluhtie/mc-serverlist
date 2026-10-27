// Locale routing shared by the proxy, server code and Client Components, so no server imports.
// German is the default and lives at the root; English pages are served under /en.

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

/** Request header the proxy sets so Server Components know the locale of a rewritten URL. */
export const LOCALE_HEADER = "x-mcsl-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

/** BCP 47 tags for Intl formatting, `hreflang` and Open Graph. */
export const INTL_LOCALE: Record<Locale, string> = { de: "de-DE", en: "en-US" };
export const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_US" };

// First path segments that have an English name. Keys are the German (file system) names.
const SEGMENTS_EN: Record<string, string> = { spielmodus: "gamemodes" };
const SEGMENTS_DE = Object.fromEntries(Object.entries(SEGMENTS_EN).map(([de, en]) => [en, de]));

function splitPath(href: string) {
  const index = href.search(/[?#]/);
  return index === -1 ? [href, ""] : [href.slice(0, index), href.slice(index)];
}

function mapFirstSegment(pathname: string, table: Record<string, string>) {
  const [, first = "", ...rest] = pathname.split("/");
  const mapped = table[first];
  return mapped ? ["", mapped, ...rest].join("/") : pathname;
}

/**
 * Turns an internal path ("/spielmodus/survival?page=2") into the public URL for a locale
 * ("/en/gamemodes/survival?page=2"). External URLs and protocol-relative ones pass through.
 */
export function localizePath(href: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE || !href.startsWith("/") || href.startsWith("//")) return href;
  const [pathname, rest] = splitPath(href);
  const mapped = mapFirstSegment(pathname, SEGMENTS_EN);
  return `/${locale}${mapped === "/" ? "" : mapped}${rest}`;
}

/** Reverse of `localizePath` for a pathname: the locale and the internal path it maps to. */
export function delocalizePath(pathname: string): { locale: Locale; path: string } {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const path = pathname.slice(locale.length + 1) || "/";
      return { locale, path: mapFirstSegment(path, SEGMENTS_DE) };
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}
