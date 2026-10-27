import { bannerTheme } from "@/lib/banner";

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
  if (bannerUrl) {
    return (
      // Banners are arbitrary external URLs, so next/image would need an open allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={bannerUrl} alt={`${name} Banner`} className={`object-cover ${className}`} loading="lazy" />
    );
  }
  return <BannerPlaceholder seed={name} className={className} />;
}
