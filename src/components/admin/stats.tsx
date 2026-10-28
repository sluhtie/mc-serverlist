import Link from "@/components/link";
import { percentChange } from "@/lib/charts";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

/** Range switch (7/30/90 days) for the admin statistics, kept in the `range` query parameter. */
export async function RangeSwitch({ path, ranges, current }: { path: string; ranges: readonly number[]; current: number }) {
  const t = await getDictionary();
  return (
    <nav aria-label={t.admin.range} className="flex gap-1 rounded-2xl border border-line bg-surface p-1 text-sm">
      {ranges.map((days) => (
        <Link
          key={days}
          href={`${path}?range=${days}`}
          aria-current={days === current ? "page" : undefined}
          className={`rounded-xl px-3 py-1.5 font-medium transition ${
            days === current ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
          }`}
        >
          {t.admin.days(days)}
        </Link>
      ))}
    </nav>
  );
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium tracking-wide text-subtle uppercase">{label}</div>
      <div className="mt-1.5 font-pixel text-3xl">{value}</div>
    </div>
  );
}

function formatChange(change: number, locale: Locale) {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { style: "percent", signDisplay: "exceptZero" }).format(change / 100);
}

/** Card with a title, the range total as headline number, its change and a chart. */
export async function ChartCard({
  title,
  hint,
  total,
  previous,
  days,
  className = "",
  children,
}: {
  title: string;
  hint?: string;
  total?: number;
  /** Total of the range before, for the change in percent. */
  previous?: number;
  days: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const change = total === undefined || previous === undefined ? null : percentChange(total, previous);
  return (
    <section className={`card space-y-4 p-5 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {hint && <p className="text-xs text-subtle">{hint}</p>}
        </div>
        {total !== undefined && (
          <div className="text-right">
            <div className="font-pixel text-2xl">{total.toLocaleString(INTL_LOCALE[locale])}</div>
            {previous !== undefined && (
              <div className={`text-xs ${!change ? "text-subtle" : change < 0 ? "text-danger" : "text-ok"}`}>
                {change === null ? t.admin.noPrevious : t.admin.vsPrevious(formatChange(change, locale), days)}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

/** Ranked list with a proportional bar behind each value. */
export async function BarList({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: React.ReactNode; value: number }[];
}) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-subtle">{t.admin.noData}</p>
      ) : (
        <ol className="space-y-1.5 text-sm">
          {rows.map((row) => (
            <li key={row.key} className="relative flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5">
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-lg bg-accent/15"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
              <span className="relative min-w-0 truncate">{row.label}</span>
              <span className="relative font-medium text-fg-soft tabular-nums">
                {row.value.toLocaleString(INTL_LOCALE[locale])}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Key figures as label/value rows, values optionally with their share of a total. */
export async function FigureList({
  title,
  total,
  rows,
}: {
  title: string;
  total?: number;
  rows: { label: string; value: number }[];
}) {
  const locale = await getLocale();
  const percent = new Intl.NumberFormat(INTL_LOCALE[locale], { style: "percent" });
  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <dl className="divide-y divide-line text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 py-2">
            <dt className="text-muted">{row.label}</dt>
            <dd className="font-medium tabular-nums">
              {row.value.toLocaleString(INTL_LOCALE[locale])}
              {total ? <span className="ml-1.5 text-xs text-subtle">({percent.format(row.value / total)})</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
