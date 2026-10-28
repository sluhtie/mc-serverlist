/** Pure helpers for the time series charts (client-safe, no server imports). */

export type ChartPoint = { t: number; v: number; offline?: boolean };

/** Time zone that day buckets are cut in, so "today" matches what German visitors see. */
export const STATS_TIME_ZONE = "Europe/Berlin";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: STATS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` of a moment in STATS_TIME_ZONE. */
export function dayKey(date: Date) {
  return dayKeyFormat.format(date);
}

/**
 * One point per calendar day for the last `days` days (today included), with days that
 * have no row filled with zero. Rows are keyed by `YYYY-MM-DD`.
 */
export function fillDays(rows: { day: string; n: number }[], days: number, now = new Date()) {
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const points: ChartPoint[] = [];
  // Step from noon UTC so DST changes never skip or repeat a calendar day.
  const anchor = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12);
  // Berlin is ahead of UTC, so late in the evening its date is already tomorrow's.
  const todayOffset = dayKey(now) > dayKey(new Date(anchor)) ? 1 : 0;
  for (let i = days - 1; i >= 0; i--) {
    const t = anchor + (todayOffset - i) * 86_400_000;
    points.push({ t, v: byDay.get(dayKey(new Date(t))) ?? 0 });
  }
  return points;
}

/** Index of the point whose x position is closest to `ratio` (0 = left edge, 1 = right edge). */
export function nearestIndex(points: ChartPoint[], ratio: number, byTime: boolean) {
  if (points.length === 0) return -1;
  const clamped = Math.min(1, Math.max(0, ratio));
  if (!byTime || points.length === 1) {
    return Math.min(points.length - 1, Math.floor(clamped * points.length));
  }
  const start = points[0].t;
  const target = start + clamped * (points[points.length - 1].t - start);
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i].t - target) < Math.abs(points[best].t - target)) best = i;
  }
  return best;
}

export function sum(points: ChartPoint[]) {
  return points.reduce((total, p) => total + p.v, 0);
}

/** Time ranges the admin statistics can show, in days. */
export const STAT_RANGES = [7, 30, 90] as const;
export type StatRange = (typeof STAT_RANGES)[number];

export function parseStatRange(value: string | string[] | undefined): StatRange {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return STAT_RANGES.find((r) => r === days) ?? 30;
}

/** Change from `previous` to `current` in percent, or null when there is no base to compare with. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
