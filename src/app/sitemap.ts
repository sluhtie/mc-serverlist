import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { TAGS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { LOCALES, localizePath } from "@/lib/i18n/config";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { getTagCounts } from "@/lib/servers";
import { tagHref } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rows, tagCounts] = await Promise.all([
    db
      .select({ slug: schema.servers.slug, updatedAt: schema.servers.updatedAt })
      .from(schema.servers)
      .where(eq(schema.servers.published, true)),
    getTagCounts(TAGS.length),
  ]);
  const now = new Date();
  // Internal paths, turned into one absolute URL per language below.
  const pages: MetadataRoute.Sitemap = [
    { url: "/", lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: "/spielmodus", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    // Empty game mode pages are thin content, so they are only listed once a server uses the tag.
    ...TAGS.filter((tag) => tagCounts.some((t) => t.tag === tag && t.count > 0)).map((tag) => ({
      url: tagHref(tag),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...rows.map((s) => ({
      url: `/server/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: "/api-docs", changeFrequency: "monthly", priority: 0.3 },
    { url: "/impressum", changeFrequency: "yearly", priority: 0.1 },
    { url: "/datenschutz", changeFrequency: "yearly", priority: 0.1 },
  ];
  // One entry per page and language, each listing all language versions (hreflang).
  return pages.flatMap((page) => {
    const alternates = Object.fromEntries(
      Object.entries(languageAlternates(page.url))
        .filter(([lang]) => lang !== "x-default")
        .map(([lang, path]) => [lang, absoluteUrl(path)]),
    );
    return LOCALES.map((locale) => ({
      ...page,
      url: absoluteUrl(localizePath(page.url, locale)),
      alternates: { languages: alternates },
    }));
  });
}
