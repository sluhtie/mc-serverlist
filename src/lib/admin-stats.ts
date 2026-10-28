import "server-only";
import { and, count, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { flushApiUsage } from "@/lib/api-usage";
import { type ChartPoint, dayKey, fillDays, STATS_TIME_ZONE, sum } from "@/lib/charts";
import { db, schema } from "@/lib/db";

const { users, servers, votes, serverPings, reports, apiUsage } = schema;

/** Start of the calendar day `days - 1` days ago in STATS_TIME_ZONE, as timestamptz. */
function startOfRange(days: number) {
  return sql`(date_trunc('day', now() at time zone ${STATS_TIME_ZONE}) - make_interval(days => ${days - 1})) at time zone ${STATS_TIME_ZONE}`;
}

/**
 * Rows per calendar day for the last `days * 2` days, split into the current range and the
 * one before it, so the page can show the change against the previous period.
 */
async function dailySeries(column: PgColumn, days: number, where?: SQL) {
  const day = sql<string>`to_char(${column} at time zone ${STATS_TIME_ZONE}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day, n: count() })
    .from(column.table)
    .where(and(gte(column, startOfRange(days * 2)), where))
    // Group by position: the day expression carries parameters, which Postgres would
    // otherwise see as a different expression in GROUP BY.
    .groupBy(sql`1`);
  const points = fillDays(rows, days * 2);
  const current = points.slice(days);
  return { points: current, total: sum(current), previous: sum(points.slice(0, days)) };
}

/** Players online across all servers (sum of each server's average) and online servers over time. */
async function networkSeries(days: number) {
  // Pings are kept for 30 days (see server/status.ts), so longer ranges are cut there.
  const hourly = days <= 7;
  const bucket = hourly
    ? sql`date_trunc('hour', ${serverPings.createdAt})`
    : sql`date_trunc('day', ${serverPings.createdAt} at time zone ${STATS_TIME_ZONE}) at time zone ${STATS_TIME_ZONE}`;
  const rows = await db.execute<{ t: number; players: number; online: number }>(sql`
    select (extract(epoch from b) * 1000)::float8 as t, sum(p)::float8 as players, sum(o)::float8 as online
    from (
      select ${bucket} as b, ${serverPings.serverId} as s,
        avg(${serverPings.players}) as p, avg(case when ${serverPings.online} then 1 else 0 end) as o
      from ${serverPings}
      where ${serverPings.createdAt} >= ${startOfRange(Math.min(days, 30))}
      group by 1, 2
    ) as buckets
    group by b
    order by b`);
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    hourly,
    players: rows.map((r): ChartPoint => ({ t: Number(r.t), v: round(Number(r.players)) })),
    online: rows.map((r): ChartPoint => ({ t: Number(r.t), v: round(Number(r.online)) })),
  };
}

async function single<T>(query: Promise<T[]>) {
  const [row] = await query;
  return row;
}

export async function getOverviewStats(days: number) {
  const since = startOfRange(days);
  const n = count();
  const [newUsers, newServers, dailyVotes, network, topServers, tags, accounts, listings, openReports] =
    await Promise.all([
      dailySeries(users.createdAt, days),
      dailySeries(servers.createdAt, days),
      dailySeries(votes.createdAt, days),
      networkSeries(days),
      db
        .select({ name: servers.name, slug: servers.slug, n })
        .from(votes)
        .innerJoin(servers, eq(servers.id, votes.serverId))
        .where(gte(votes.createdAt, since))
        .groupBy(servers.id)
        .orderBy(desc(n))
        .limit(8),
      db.execute<{ tag: string; n: number }>(sql`
        select tag, count(*)::int as n
        from ${servers}, unnest(${servers.tags}) as tag
        where ${servers.published}
        group by tag
        order by n desc, tag
        limit 8`),
      single(
        db
          .select({
            total: n,
            verified: sql<number>`count(*) filter (where ${users.emailVerifiedAt} is not null)::int`,
            twoFactor: sql<number>`count(*) filter (where ${users.totpEnabledAt} is not null)::int`,
            admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
            banned: sql<number>`count(*) filter (where ${users.banned})::int`,
          })
          .from(users),
      ),
      single(
        db
          .select({
            total: n,
            online: sql<number>`count(*) filter (where ${servers.online})::int`,
            hidden: sql<number>`count(*) filter (where not ${servers.published})::int`,
            votifier: sql<number>`count(*) filter (where ${servers.votifierEnabled})::int`,
            featured: sql<number>`count(*) filter (where ${servers.featuredUntil} > now())::int`,
            players: sql<number>`coalesce(sum(${servers.playersOnline}), 0)::int`,
          })
          .from(servers),
      ),
      single(db.select({ n }).from(reports).where(eq(reports.status, "open"))),
    ]);

  return {
    newUsers,
    newServers,
    votes: dailyVotes,
    network,
    topServers,
    tags: [...tags],
    accounts: accounts ?? { total: 0, verified: 0, twoFactor: 0, admins: 0, banned: 0 },
    listings: listings ?? { total: 0, online: 0, hidden: 0, votifier: 0, featured: 0, players: 0 },
    openReports: openReports?.n ?? 0,
  };
}

export async function getApiStats(days: number) {
  // Counts are buffered for up to a minute; write them first so the page is current.
  await flushApiUsage();
  const range = fillDays([], days * 2);
  const firstDay = dayKey(new Date(range[0].t));
  const [daily, byEndpoint] = await Promise.all([
    db
      .select({ day: apiUsage.day, n: sql<number>`sum(${apiUsage.requests})::int` })
      .from(apiUsage)
      .where(gte(apiUsage.day, firstDay))
      .groupBy(apiUsage.day),
    db
      .select({
        endpoint: apiUsage.endpoint,
        requests: sql<number>`sum(${apiUsage.requests})::int`,
        external: sql<number>`coalesce(sum(${apiUsage.requests}) filter (where ${apiUsage.external}), 0)::int`,
        errors: sql<number>`sum(${apiUsage.errors})::int`,
      })
      .from(apiUsage)
      .where(gte(apiUsage.day, dayKey(new Date(range[days].t))))
      .groupBy(apiUsage.endpoint),
  ]);
  const points = fillDays(daily, days * 2);
  const current = points.slice(days);
  return {
    points: current,
    total: sum(current),
    previous: sum(points.slice(0, days)),
    today: current[current.length - 1]?.v ?? 0,
    byEndpoint,
  };
}
