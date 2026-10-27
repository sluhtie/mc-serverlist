import type { Metadata } from "next";
import { env } from "./env";
import { LOCALES, OG_LOCALE, localizePath, type Locale } from "./i18n/config";
import { dictionaries } from "./i18n/dictionaries";

/** Google cuts descriptions at roughly 155–160 characters. */
export const DESCRIPTION_MAX = 160;

/** Shortens text on a word boundary and appends an ellipsis. */
export function truncate(text: string, max = DESCRIPTION_MAX) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export function absoluteUrl(path: string) {
  return path === "/" ? env.appUrl : `${env.appUrl}${path}`;
}

const IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * hreflang alternates for an internal path: every locale plus x-default, which points to the
 * German root URL because the site has no language picker page.
 */
export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localizePath(path, l)])),
    "x-default": path,
  };
}

type PageMetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  /**
   * Internal path, e.g. "/server/foo"; the canonical URL is its localized version. Leave out
   * for pages without a canonical URL.
   */
  path?: string;
  /** false renders `noindex, follow`, e.g. for filtered lists or private pages. */
  index?: boolean;
  /** Use the root layout title as is, without the "| Site" template. */
  absoluteTitle?: boolean;
  /** The route has its own opengraph-image file, which an explicit image would override. */
  ownImage?: boolean;
  /** Share image to use instead of the site default, e.g. a parent route's opengraph-image. */
  image?: string;
};

/**
 * Metadata for a public page. Child segments replace `openGraph` and `twitter` as a whole,
 * so every page builds the full objects here instead of relying on the root layout.
 */
export function pageMetadata({
  locale,
  title,
  description,
  path,
  index = true,
  absoluteTitle,
  ownImage,
  image,
}: PageMetadataInput): Metadata {
  const text = truncate(description);
  const url = path && localizePath(path, locale);
  // Replacing `openGraph` drops the inherited root opengraph-image, so link it again. The key
  // must be absent for routes with their own image file, or Next drops that file too.
  const images = ownImage
    ? {}
    : {
        images: [
          image
            ? { ...IMAGE_SIZE, url: localizePath(image, locale), alt: title }
            : {
                ...IMAGE_SIZE,
                url: localizePath("/opengraph-image", locale),
                alt: dictionaries[locale].meta.defaultImageAlt,
              },
        ],
      };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: text,
    // Spread instead of `key: undefined`, which would wipe what the root layout sets.
    ...(path && { alternates: { canonical: url, languages: languageAlternates(path) } }),
    ...(!index && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      siteName: env.siteName,
      url,
      title,
      description: text,
      ...images,
    },
    twitter: { card: "summary_large_image", title, description: text, ...images },
  };
}

/** Pages that should never show up in search results (forms, accounts, admin). */
export const NOINDEX: Metadata["robots"] = { index: false, follow: false };

/**
 * Serializes structured data for a <script type="application/ld+json"> tag. Escaping "<"
 * keeps user-supplied strings (server names, descriptions) from closing the script tag.
 */
export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
