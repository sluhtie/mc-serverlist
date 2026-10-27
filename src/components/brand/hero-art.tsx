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

/** Decorative night landscape behind the homepage hero. */
export function HeroArt({ className, width, height }: { className?: string; width?: number; height?: number }) {
  const stars = Array.from({ length: 70 }, (_, i) => {
    const h = hashString(`star-${i}`);
    return { x: h % WIDTH, y: (h >>> 12) % 200, size: (h >>> 24) % 3 === 0 ? 3 : 2, o: 0.2 + ((h >>> 8) % 50) / 100 };
  });
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
        <radialGradient id="hero-moon-glow">
          <stop offset="0" stopColor="#fef9c3" stopOpacity=".35" />
          <stop offset="1" stopColor="#fef9c3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".55" stopColor="#09090b" stopOpacity="0" />
          <stop offset="1" stopColor="#09090b" stopOpacity=".85" />
        </linearGradient>
      </defs>
      {stars.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.size} height={s.size} fill="#e4e4e7" opacity={s.o} />
      ))}
      <circle cx="844" cy="154" r="44" fill="url(#hero-moon-glow)" />
      <rect x="820" y="130" width="48" height="48" fill="#fef9c3" />
      <rect x="828" y="140" width="10" height="10" fill="#fde68a" />
      <rect x="848" y="158" width="12" height="8" fill="#fde68a" />
      {terrain({
        seed: "far-hills",
        block: 30,
        maxHeight: 7,
        top: ["#14532d", "#166534"],
        body: ["#0f2a1c", "#11301f"],
        opacity: 0.55,
      })}
      {terrain({
        seed: "near-hills",
        block: 24,
        maxHeight: 4,
        top: ["#22c55e", "#16a34a", "#15803d"],
        body: ["#5b3a1e", "#4a2f18", "#3f3f46", "#523420"],
      })}
      <rect width={WIDTH} height={HEIGHT} fill="url(#hero-fade)" />
    </svg>
  );
}
