import { bannerTheme, hashString } from "@/lib/banner";

const WIDTH = 1200;
const HEIGHT = 360;

// Called as a plain function (not <Terrain />): Satori only accepts intrinsic elements inside <svg>.
function terrain({
  seed,
  block,
  maxHeight,
  top,
  body,
  opacity = 1,
}: {
  seed: string;
  block: number;
  maxHeight: number;
  top: string[];
  body: string[];
  opacity?: number;
}) {
  const { columns } = bannerTheme(seed, Math.ceil(WIDTH / block), maxHeight);
  return (
    <g opacity={opacity}>
      {columns.map((h, i) =>
        Array.from({ length: h }, (_, j) => {
          const palette = j === h - 1 ? top : body;
          return (
            <rect
              key={`${i}-${j}`}
              x={i * block}
              y={HEIGHT - (j + 1) * block}
              width={block + 0.5}
              height={block + 0.5}
              fill={palette[(i * 7 + j * 3 + h) % palette.length]}
            />
          );
        }),
      )}
    </g>
  );
}

const CLOUDS = [
  { x: 80, y: 40, w: 7 },
  { x: 420, y: 80, w: 5 },
  { x: 700, y: 28, w: 8 },
  { x: 1010, y: 96, w: 6 },
];

/**
 * Decorative block landscape behind the homepage hero: a starry night or a sunny day. The
 * page renders both and lets the theme pick one; OG images use the night version.
 */
export function HeroArt({
  className,
  width,
  height,
  variant = "night",
  animated = false,
}: {
  className?: string;
  width?: number;
  height?: number;
  variant?: "night" | "day";
  /** Twinkling stars and drifting clouds. Off for Satori, which has no CSS animations. */
  animated?: boolean;
}) {
  const night = variant === "night";
  const stars = night
    ? Array.from({ length: 70 }, (_, i) => {
        const h = hashString(`star-${i}`);
        return { x: h % WIDTH, y: (h >>> 12) % 200, size: (h >>> 24) % 3 === 0 ? 3 : 2, o: 0.2 + ((h >>> 8) % 50) / 100 };
      })
    : [];
  const fade = night ? "#0a0c0f" : "#f3f1ea";
  const orb = night
    ? { glow: "#fef9c3", body: "#fef9c3", spots: "#fde68a" }
    : { glow: "#fde047", body: "#fde047", spots: "#facc15" };
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <radialGradient id={`hero-orb-glow-${variant}`}>
          <stop offset="0" stopColor={orb.glow} stopOpacity={night ? ".35" : ".55"} />
          <stop offset="1" stopColor={orb.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`hero-fade-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".55" stopColor={fade} stopOpacity="0" />
          <stop offset="1" stopColor={fade} stopOpacity=".9" />
        </linearGradient>
      </defs>
      {stars.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={s.size}
          height={s.size}
          fill="#e4e4e7"
          opacity={s.o}
          className={animated && i % 4 === 0 ? "animate-twinkle" : undefined}
          style={animated && i % 4 === 0 ? { animationDelay: `${(i % 7) * 0.4}s` } : undefined}
        />
      ))}
      {!night && (
        <g className={animated ? "animate-drift" : undefined}>
          {/* Drawn twice side by side, so the drift animation can loop seamlessly. */}
          {[0, WIDTH].flatMap((offset) =>
            CLOUDS.map((c) => (
              <g key={`${offset}-${c.x}`} fill="#ffffff" opacity=".9">
                <rect x={offset + c.x} y={c.y} width={c.w * 16} height={16} />
                <rect x={offset + c.x + 16} y={c.y - 12} width={(c.w - 3) * 16} height={12} />
              </g>
            )),
          )}
        </g>
      )}
      <circle cx="844" cy="154" r="56" fill={`url(#hero-orb-glow-${variant})`} />
      <rect x="820" y="130" width="48" height="48" fill={orb.body} />
      <rect x="828" y="140" width="10" height="10" fill={orb.spots} />
      <rect x="848" y="158" width="12" height="8" fill={orb.spots} />
      {terrain({
        seed: "far-hills",
        block: 30,
        maxHeight: 7,
        top: night ? ["#14532d", "#166534"] : ["#4ade80", "#22c55e"],
        body: night ? ["#0f2a1c", "#11301f"] : ["#86c79a", "#7dbf91"],
        opacity: 0.55,
      })}
      {terrain({
        seed: "near-hills",
        block: 24,
        maxHeight: 4,
        top: ["#22c55e", "#16a34a", "#15803d"],
        body: ["#5b3a1e", "#4a2f18", "#3f3f46", "#523420"],
      })}
      <rect width={WIDTH} height={HEIGHT} fill={`url(#hero-fade-${variant})`} />
    </svg>
  );
}
