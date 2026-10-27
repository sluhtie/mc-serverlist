import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame } from "@/components/brand/og-image";
import { env } from "@/lib/env";

// SITE_NAME is read at runtime, so the image must not be prerendered at build time.
export const dynamic = "force-dynamic";
export const alt = "Minecraft Serverliste mit Live-Status und Votes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <OgFrame siteName={env.siteName}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          <span>Finde deinen nächsten</span>
          <span style={{ color: "#4ade80" }}>Minecraft Server</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#a1a1aa" }}>
          Live-Status · Spielerzahlen · Vote-Ranking
        </div>
      </OgFrame>
    ),
    size,
  );
}
