import type { Metadata } from "next";
import { BarList, ChartCard, FigureList, RangeSwitch, StatTile } from "@/components/admin/stats";
import Link from "@/components/link";
import { TimeChart } from "@/components/time-chart";
import { getOverviewStats } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth/session";
import { type ChartPoint, parseStatRange, STAT_RANGES } from "@/lib/charts";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.admin, robots: NOINDEX };
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const days = parseStatRange((await searchParams).range);
  const [t, locale, stats] = await Promise.all([getDictionary(), getLocale(), getOverviewStats(days)]);
  const number = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const peakSummary = (points: ChartPoint[]) => {
    if (points.length === 0) return undefined;
    const avg = points.reduce((total, p) => total + p.v, 0) / points.length;
    return t.admin.peakSummary(number.format(avg), number.format(Math.max(...points.map((p) => p.v))));
  };
  const { accounts, listings, network } = stats;
  const granularity = network.hourly ? "time" : "day";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.admin.overviewTitle}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label={t.admin.statServers} value={listings.total} />
        <StatTile label={t.admin.statOnline} value={listings.online} />
        <StatTile label={t.admin.playersNow} value={listings.players} />
        <StatTile label={t.admin.statUsers} value={accounts.total} />
        <StatTile label={t.admin.statReports} value={stats.openReports} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="font-display text-xl font-bold">{t.admin.statsTitle(days)}</h2>
        <RangeSwitch path="/admin" ranges={STAT_RANGES} current={days} />
      </div>

      <ChartCard title={t.admin.chartPlayers} hint={t.admin.chartPlayersHint} days={days}>
        <TimeChart
          points={network.players}
          unit="players"
          granularity={granularity}
          label={t.admin.chartLabel(t.admin.chartPlayers, Math.min(days, 30))}
          summary={peakSummary(network.players)}
        />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t.admin.chartVotes} total={stats.votes.total} previous={stats.votes.previous} days={days}>
          <TimeChart
            points={stats.votes.points}
            kind="bars"
            unit="votes"
            granularity="day"
            label={t.admin.chartLabel(t.admin.chartVotes, days)}
          />
        </ChartCard>
        <ChartCard title={t.admin.chartOnlineServers} days={days}>
          <TimeChart
            points={network.online}
            unit="servers"
            granularity={granularity}
            label={t.admin.chartLabel(t.admin.chartOnlineServers, Math.min(days, 30))}
            summary={peakSummary(network.online)}
          />
        </ChartCard>
        <ChartCard
          title={t.admin.chartNewUsers}
          total={stats.newUsers.total}
          previous={stats.newUsers.previous}
          days={days}
        >
          <TimeChart
            points={stats.newUsers.points}
            kind="bars"
            unit="users"
            granularity="day"
            label={t.admin.chartLabel(t.admin.chartNewUsers, days)}
          />
        </ChartCard>
        <ChartCard
          title={t.admin.chartNewServers}
          total={stats.newServers.total}
          previous={stats.newServers.previous}
          days={days}
        >
          <TimeChart
            points={stats.newServers.points}
            kind="bars"
            unit="newServers"
            granularity="day"
            label={t.admin.chartLabel(t.admin.chartNewServers, days)}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <BarList
          title={t.admin.topServers}
          rows={stats.topServers.map((s) => ({
            key: s.slug,
            value: s.n,
            label: (
              <Link href={`/server/${s.slug}`} className="transition hover:text-accent">
                {s.name}
              </Link>
            ),
          }))}
        />
        <BarList title={t.admin.topTags} rows={stats.tags.map((r) => ({ key: r.tag, label: r.tag, value: r.n }))} />
        <FigureList
          title={t.admin.accountsTitle}
          total={accounts.total}
          rows={[
            { label: t.admin.verified, value: accounts.verified },
            { label: t.admin.twoFactor, value: accounts.twoFactor },
            { label: t.admin.admins, value: accounts.admins },
            { label: t.admin.banned, value: accounts.banned },
          ]}
        />
        <FigureList
          title={t.admin.listingsTitle}
          total={listings.total}
          rows={[
            { label: t.admin.statOnline, value: listings.online },
            { label: t.admin.votifier, value: listings.votifier },
            { label: t.admin.featuredNow, value: listings.featured },
            { label: t.admin.hidden, value: listings.hidden },
          ]}
        />
      </div>
    </div>
  );
}
