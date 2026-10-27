import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// SITE_NAME is read at runtime, so the manifest must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${env.siteName} – Minecraft Serverliste`,
    short_name: env.siteName,
    description: "Minecraft Server mit Live-Status, Spielerzahlen und Votes.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "de",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
