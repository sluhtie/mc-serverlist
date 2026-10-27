import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame } from "@/components/brand/og-image";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/server";

// SITE_NAME is read at runtime, so the image must not be prerendered at build time.
export const dynamic = "force-dynamic";
export const alt = "Minecraft Serverliste mit Live-Status und Votes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const t = await getDictionary();
  return new ImageResponse(
    (
      <OgFrame siteName={env.siteName}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          <span>{t.og.heroTitle}</span>
          <span style={{ color: "#4ade80" }}>{t.og.heroHighlight}</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#a1a1aa" }}>
          {t.og.heroSubtitle}
        </div>
      </OgFrame>
    ),
    size,
  );
}
