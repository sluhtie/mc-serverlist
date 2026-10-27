import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { TAGS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
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
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/spielmodus"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    // Empty game mode pages are thin content, so they are only listed once a server uses the tag.
    ...TAGS.filter((tag) => tagCounts.some((t) => t.tag === tag && t.count > 0)).map((tag) => ({
      url: absoluteUrl(tagHref(tag)),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...rows.map((s) => ({
      url: absoluteUrl(`/server/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/api-docs"), changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/impressum"), changeFrequency: "yearly", priority: 0.1 },
    { url: absoluteUrl("/datenschutz"), changeFrequency: "yearly", priority: 0.1 },
  ];
}
