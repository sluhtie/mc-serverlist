import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { OG_SIZE, OgFrame } from "@/components/brand/og-image";
import { GamemodeIcon } from "@/components/gamemode-icon";
import { bannerTheme } from "@/lib/banner";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/server";
import { tagFromSlug } from "@/lib/tags";

export const alt = "Minecraft Server nach Spielmodus";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ tag: string }> }) {
  const tag = tagFromSlug((await params).tag);
  if (!tag) notFound();
  const { hue } = bannerTheme(tag);
  const t = await getDictionary();

  return new ImageResponse(
    (
      <OgFrame siteName={env.siteName}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 168,
              height: 168,
              borderRadius: 24,
              background: `linear-gradient(135deg, hsl(${hue} 35% 22%), hsl(${hue} 40% 11%))`,
            }}
          >
            <GamemodeIcon tag={tag} size={120} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
            <span>Minecraft</span>
            <span style={{ color: "#4ade80" }}>{t.gamemodes.tagServers(tag)}</span>
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#a1a1aa" }}>
          {t.og.heroSubtitle}
        </div>
      </OgFrame>
    ),
    size,
  );
}
