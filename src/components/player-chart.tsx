import { TimeChart } from "@/components/time-chart";
import { getDictionary } from "@/lib/i18n/server";

type Point = { online: boolean; players: number; at: Date };

/** Player history of one server; hovering shows the count at each ping. */
export async function PlayerChart({ points }: { points: Point[] }) {
  const t = await getDictionary();
  const peak = Math.max(0, ...points.map((p) => p.players));
  const avg = points.length ? Math.round(points.reduce((sum, p) => sum + p.players, 0) / points.length) : 0;

  return (
    <TimeChart
      points={points.map((p) => ({ t: p.at.getTime(), v: p.players, offline: !p.online }))}
      unit="players"
      label={t.server.chartLabel(peak)}
      summary={t.server.chartSummary(avg, peak)}
      endLabel={t.server.now}
    />
  );
}
