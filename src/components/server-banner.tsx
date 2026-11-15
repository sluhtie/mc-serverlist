import { bannerTheme } from "@/lib/banner";
import { BannerImage } from "./banner-image";

const BLOCK = 10;

/** Generated artwork for servers that have no banner of their own. */
export function BannerPlaceholder({ seed, className = "" }: { seed: string; className?: string }) {
  const { hue, columns, maxHeight } = bannerTheme(seed);
  const width = columns.length * BLOCK;
  const height = 80;
  const id = `banner-${hue}-${columns.join("")}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 45% 22%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 50) % 360} 50% 9%)`} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${id})`} />
      {columns.map((h, i) =>
        // A few "stars" in the sky, derived from the terrain so they stay deterministic.
        h % 2 === 0 ? (
          <rect
            key={`s${i}`}
            x={i * BLOCK + ((h * 7) % BLOCK)}
            y={6 + ((i * 13 + h * 5) % 26)}
            width={1.5}
            height={1.5}
            fill="white"
            opacity={0.35}
          />
        ) : null,
      )}
      {columns.map((h, i) =>
        Array.from({ length: h }, (_, j) => {
          const top = j === h - 1;
          return (
            <rect
              key={`${i}-${j}`}
              x={i * BLOCK}
              y={height - (j + 1) * BLOCK}
              width={BLOCK}
              height={BLOCK}
              fill={
                top
                  ? `hsl(${hue} 55% ${42 + ((i + h) % 3) * 4}%)`
                  : `hsl(${(hue + 20) % 360} 30% ${16 + ((i * 3 + j) % 3) * 3}%)`
              }
              opacity={0.55 + (j / maxHeight) * 0.45}
            />
          );
        }),
      )}
    </svg>
  );
}

/** A server's own banner, or the generated placeholder when it has none. */
export function ServerBanner({
  name,
  bannerUrl,
  className = "",
}: {
  name: string;
  bannerUrl: string | null;
  className?: string;
}) {
  const placeholder = <BannerPlaceholder seed={name} className={className} />;
  if (bannerUrl) {
    return (
      <BannerImage
        src={bannerUrl}
        alt={`${name} Banner`}
        className={`object-cover ${className}`}
        loading="lazy"
        fallback={placeholder}
      />
    );
  }
  return placeholder;
}

/**
 * Backdrop for servers without a banner, built from their own favicon: blown up and blurred into
 * a soft color field in the server's colors. Without a favicon either, a gradient in the hue the
 * letter icon uses, with a faint block grid.
 */
export function IconBackdrop({
  favicon,
  name,
  className = "",
}: {
  favicon: string | null;
  name: string;
  className?: string;
}) {
  if (favicon) {
    return (
      <div className={`relative overflow-hidden ${className}`} aria-hidden>
        {/* Favicons are base64 data URLs from the status ping. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={favicon} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover blur-xl saturate-150" />
        {/* A faint block grid keeps the color field from looking like a rendering glitch. */}
        <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/.08)_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>
    );
  }
  const { hue } = bannerTheme(name);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundSize: "16px 16px, 16px 16px, auto",
        backgroundImage: `linear-gradient(rgb(255 255 255 / .08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .08) 1px, transparent 1px), linear-gradient(135deg, hsl(${hue} 50% 42%), hsl(${(hue + 40) % 360} 50% 20%))`,
      }}
    />
  );
}
