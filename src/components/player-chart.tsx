import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

type Point = { online: boolean; players: number; at: Date };

/** Lightweight SVG area chart, rendered on the server. */
export async function PlayerChart({ points }: { points: Point[] }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  if (points.length < 2) {
    return <p className="text-sm text-subtle">{t.server.chartEmpty}</p>;
  }
  const width = 600;
  const height = 140;
  const max = Math.max(1, ...points.map((p) => p.players));
  const start = points[0].at.getTime();
  const span = Math.max(1, points[points.length - 1].at.getTime() - start);
  const coords = points.map((p) => {
    const x = ((p.at.getTime() - start) / span) * width;
    const y = height - (p.players / max) * (height - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const peak = Math.max(...points.map((p) => p.players));
  const avg = Math.round(points.reduce((sum, p) => sum + p.players, 0) / points.length);

  return (
    <div>
      <div className="relative">
        {/* Horizontal guides at a quarter of the height each. */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t border-dashed border-line" />
          ))}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="relative h-40 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={t.server.chartLabel(peak)}
        >
          <defs>
            <linearGradient id="player-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#22c55e" stopOpacity=".35" />
              <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${height} ${coords.join(" ")} ${width},${height}`} fill="url(#player-chart-fill)" />
          <polyline
            points={coords.join(" ")}
            className="fill-none stroke-brand-500"
            strokeWidth={2.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-xs text-subtle">
        <span>{points[0].at.toLocaleString(INTL_LOCALE[locale], { dateStyle: "short", timeStyle: "short" })}</span>
        <span className="font-pixel text-sm text-muted">{t.server.chartSummary(avg, peak)}</span>
        <span>{t.server.now}</span>
      </div>
    </div>
  );
}
