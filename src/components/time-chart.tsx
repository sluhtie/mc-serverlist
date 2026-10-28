"use client";

import { useId, useState } from "react";
import { type ChartPoint, nearestIndex, STATS_TIME_ZONE } from "@/lib/charts";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type ChartUnit = keyof Dictionary["chart"]["units"];

const WIDTH = 600;
const HEIGHT = 160;

/**
 * Time series as an area or bar chart with a hover/keyboard tooltip. Rendered on the
 * server with the first paint already complete; only the tooltip needs JavaScript.
 */
export function TimeChart({
  points,
  unit,
  label,
  kind = "area",
  granularity = "time",
  summary,
  endLabel,
}: {
  points: ChartPoint[];
  unit: ChartUnit;
  /** Accessible name of the chart. */
  label: string;
  kind?: "area" | "bars";
  /** How a point's date is shown: a calendar day, or date and time. */
  granularity?: "day" | "time";
  /** Short text in the middle under the chart, e.g. average and peak. */
  summary?: string;
  /** Text under the right edge instead of the last date, e.g. "Now". */
  endLabel?: string;
}) {
  const t = useT();
  const locale = INTL_LOCALE[useLocale()];
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) {
    return <p className="text-sm text-subtle">{t.chart.empty}</p>;
  }

  const dateFormat = new Intl.DateTimeFormat(locale, {
    timeZone: STATS_TIME_ZONE,
    ...(granularity === "day" ? { weekday: "short", day: "numeric", month: "short" } : { dateStyle: "short", timeStyle: "short" }),
  });
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const max = Math.max(1, ...points.map((p) => p.v));
  const start = points[0].t;
  const span = Math.max(1, points[points.length - 1].t - start);
  const bars = kind === "bars";

  // Horizontal position in percent of the plot width.
  const xOf = (i: number) => (bars ? ((i + 0.5) / points.length) * 100 : ((points[i].t - start) / span) * 100);
  const yOf = (v: number) => 100 - (v / max) * 92;

  const point = active === null ? null : points[active];
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(points, (e.clientX - rect.left) / rect.width, !bars));
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = points.length - 1;
    const keys: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? last + 1) - 1),
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      Home: 0,
      End: last,
    };
    if (e.key in keys) {
      e.preventDefault();
      setActive(keys[e.key]);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const coords = points.map((p, i) => `${((xOf(i) / 100) * WIDTH).toFixed(1)},${((yOf(p.v) / 100) * HEIGHT).toFixed(1)}`);

  return (
    <div>
      <div
        className="relative h-40 touch-pan-y rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        role="group"
        aria-label={label}
        tabIndex={0}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        {/* Horizontal guides at a quarter of the height each. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t border-dashed border-line" />
          ))}
        </div>

        {bars ? (
          <div aria-hidden className={`absolute inset-0 flex items-end ${points.length > 45 ? "gap-px" : "gap-[2px]"}`}>
            {points.map((p, i) => (
              <div key={p.t} className="flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${
                    active === i ? "bg-accent" : "bg-accent/55"
                  }`}
                  style={{ height: `${p.v > 0 ? Math.max(2, 100 - yOf(p.v)) : 0}%` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <svg
            aria-hidden
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#22c55e" stopOpacity=".35" />
                <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`0,${HEIGHT} ${coords.join(" ")} ${WIDTH},${HEIGHT}`} fill={`url(#${gradientId})`} />
            <polyline
              points={coords.join(" ")}
              className="fill-none stroke-brand-500"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {point && active !== null && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 border-l border-line-strong"
              style={{ left: `${xOf(active)}%` }}
            />
            {!bars && (
              <div
                aria-hidden
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand-500"
                style={{ left: `${xOf(active)}%`, top: `${yOf(point.v)}%` }}
              />
            )}
            <div
              role="status"
              className={`pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg ${
                xOf(active) > 60 ? "-translate-x-[calc(100%+8px)]" : "translate-x-2"
              }`}
              style={{ left: `${xOf(active)}%` }}
            >
              <div className="text-subtle">{dateFormat.format(point.t)}</div>
              <div className="font-semibold text-fg">
                {point.offline ? t.common.offline : t.chart.units[unit](numberFormat.format(point.v))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex justify-between gap-3 text-xs text-subtle">
        <span>{dateFormat.format(points[0].t)}</span>
        {summary && <span className="font-pixel text-sm text-muted">{summary}</span>}
        <span>{endLabel ?? dateFormat.format(points[points.length - 1].t)}</span>
      </div>
    </div>
  );
}
