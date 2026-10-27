import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { OG_SIZE, OgFrame } from "@/components/brand/og-image";
import { formatAddress } from "@/components/server-card";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/server";
import { getServerBySlug } from "@/lib/servers";

export const alt = "Minecraft Server bei der Serverliste";
export const size = OG_SIZE;
export const contentType = "image/png";

function Stat({ label, value, color = "#fafafa" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 22, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 44, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, t] = await Promise.all([getServerBySlug(slug), getDictionary()]);
  if (!result || !result.server.published) notFound();
  const { server, monthlyVotes } = result;
  const name = server.name.length > 32 ? `${server.name.slice(0, 31)}…` : server.name;

  return new ImageResponse(
    (
      <OgFrame siteName={env.siteName}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {server.favicon ? (
            // Satori renders data URLs; the favicon comes from the server's status ping.
            // eslint-disable-next-line jsx-a11y/alt-text
            <img src={server.favicon} width={128} height={128} style={{ borderRadius: 16, imageRendering: "pixelated" }} />
          ) : (
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: 16,
                background: "#27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                fontWeight: 800,
                color: "#a1a1aa",
              }}
            >
              {server.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 64, fontWeight: 800 }}>{name}</span>
            <span style={{ fontSize: 32, color: "#4ade80", fontFamily: "monospace" }}>
              {formatAddress(server.host, server.port)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 56, marginTop: 40 }}>
          <Stat
            label={t.og.status}
            value={server.online ? "Online" : "Offline"}
            color={server.online ? "#4ade80" : "#f87171"}
          />
          <Stat label={t.og.players} value={`${server.playersOnline}/${server.playersMax}`} />
          <Stat label={t.og.votes} value={String(monthlyVotes)} />
        </div>
      </OgFrame>
    ),
    size,
  );
}
