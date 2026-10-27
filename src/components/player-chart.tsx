type Point = { online: boolean; players: number; at: Date };

/** Lightweight SVG area chart, rendered on the server. */
export function PlayerChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-zinc-500">Noch nicht genug Daten für einen Verlauf.</p>;
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
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Spielerverlauf, Höchstwert ${peak}`}
      >
        <polygon points={`0,${height} ${coords.join(" ")} ${width},${height}`} className="fill-brand-500/15" />
        <polyline
          points={coords.join(" ")}
          className="fill-none stroke-brand-400"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{points[0].at.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</span>
        <span>
          Ø {avg} · Peak {peak}
        </span>
        <span>Jetzt</span>
      </div>
    </div>
  );
}
