import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await db
    .select({ slug: schema.servers.slug, updatedAt: schema.servers.updatedAt })
    .from(schema.servers)
    .where(eq(schema.servers.published, true));
  return [
    { url: env.appUrl, changeFrequency: "hourly", priority: 1 },
    ...rows.map((s) => ({
      url: `${env.appUrl}/server/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
