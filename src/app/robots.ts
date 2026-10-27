import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Login, register and submit stay crawlable so bots can read their noindex tag.
      disallow: [
        "/admin",
        "/account",
        "/settings",
        "/api/",
        "/server/*/edit",
        "/en/admin",
        "/en/account",
        "/en/settings",
        "/en/server/*/edit",
      ],
    },
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
