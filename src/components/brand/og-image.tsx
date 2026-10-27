import { HeroArt } from "./hero-art";
import { LogoMark } from "./logo-mark";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Shared frame for generated Open Graph images. Satori only supports a subset of CSS
 * (flexbox, no Tailwind), hence the inline styles.
 */
export function OgFrame({ siteName, children }: { siteName: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "linear-gradient(180deg, #0b1a12 0%, #09090b 70%)",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ position: "absolute", left: 0, bottom: 0, display: "flex" }}>
        <HeroArt width={1200} height={360} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "48px 64px 0" }}>
        <LogoMark width={64} height={64} />
        <div style={{ fontSize: 34, fontWeight: 700, color: "#d4d4d8" }}>{siteName}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 64px 0" }}>
        {children}
      </div>
    </div>
  );
}
