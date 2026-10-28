import type { Metadata } from "next";
import { ChartCard, RangeSwitch, StatTile } from "@/components/admin/stats";
import Link from "@/components/link";
import { TimeChart } from "@/components/time-chart";
import { getApiStats } from "@/lib/admin-stats";
import { API_ENDPOINTS, type ApiEndpoint } from "@/lib/api-usage";
import { requireAdmin } from "@/lib/auth/session";
import { parseStatRange, STAT_RANGES } from "@/lib/charts";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.adminApi, robots: NOINDEX };
}

export default async function AdminApiPage({ searchParams }: PageProps<"/admin/api">) {
  await requireAdmin();
  const days = parseStatRange((await searchParams).range);
  const [t, locale, stats] = await Promise.all([getDictionary(), getLocale(), getApiStats(days)]);
  const number = new Intl.NumberFormat(INTL_LOCALE[locale]);
  const percent = new Intl.NumberFormat(INTL_LOCALE[locale], { style: "percent", maximumFractionDigits: 1 });
  const endpointNames: Record<ApiEndpoint, string> = {
    servers: t.api.statusTitle,
    votes_check: t.api.checkTitle,
    skins: t.api.headTitle,
  };
  const paths: Record<ApiEndpoint, string> = {
    servers: "/api/v1/servers/<slug>",
    votes_check: "/api/v1/votes/check",
    skins: "/api/skins/<name>",
  };
  const rows = API_ENDPOINTS.map(
    (endpoint) =>
      stats.byEndpoint.find((r) => r.endpoint === endpoint) ?? { endpoint, requests: 0, external: 0, errors: 0 },
  );
  const external = rows.reduce((n, r) => n + r.external, 0);
  const errors = rows.reduce((n, r) => n + r.errors, 0);
  const share = (part: number, whole: number) => (whole > 0 ? percent.format(part / whole) : "–");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.admin.apiTitle}</h1>
          <p className="max-w-2xl text-sm text-muted">
            {t.admin.apiIntro}{" "}
            <Link href="/api-docs" className="link">
              {t.admin.apiDocs}
            </Link>
          </p>
        </div>
        <RangeSwitch path="/admin/api" ranges={STAT_RANGES} current={days} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label={t.admin.apiRequests} value={number.format(stats.total)} />
        <StatTile label={t.admin.apiToday} value={number.format(stats.today)} />
        <StatTile label={t.admin.apiExternal} value={share(external, stats.total)} />
        <StatTile label={t.admin.apiErrorRate} value={share(errors, stats.total)} />
      </div>

      <ChartCard title={t.admin.apiPerDay} total={stats.total} previous={stats.previous} days={days}>
        <TimeChart
          points={stats.points}
          kind="bars"
          unit="requests"
          granularity="day"
          label={t.admin.chartLabel(t.admin.apiPerDay, days)}
        />
      </ChartCard>

      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-base font-bold">{t.admin.apiEndpoints}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="py-2 pr-4 font-medium">{t.admin.colEndpoint}</th>
              <th className="py-2 pr-4 text-right font-medium">{t.admin.colRequests}</th>
              <th className="py-2 pr-4 text-right font-medium">{t.admin.colExternal}</th>
              <th className="py-2 text-right font-medium">{t.admin.colErrors}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.endpoint}>
                <td className="py-2.5 pr-4">
                  <div className="font-medium">{endpointNames[r.endpoint as ApiEndpoint] ?? r.endpoint}</div>
                  <code className="font-mono text-xs text-subtle">{paths[r.endpoint as ApiEndpoint]}</code>
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{number.format(r.requests)}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {number.format(r.external)} <span className="text-xs text-subtle">({share(r.external, r.requests)})</span>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {number.format(r.errors)} <span className="text-xs text-subtle">({share(r.errors, r.requests)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-subtle">{t.admin.apiExternalHint}</p>
      </section>
    </div>
  );
}
