import "server-only";
import { and, asc, desc, eq, gt, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/constants";

const { servers, votes, serverPings } = schema;

// Written with explicit table names because Drizzle drops qualifiers in single-table selects,
// which would make "id" ambiguous inside the subquery.
export const monthlyVotes = sql<number>`(
  select count(*)::int from "votes" v
  where v."server_id" = "servers"."id"
    and v."created_at" >= date_trunc('month', now())
)`;

export const isFeatured = sql<boolean>`coalesce(${servers.featuredUntil} > now(), false)`;

export type ServerSort = "votes" | "players" | "newest";

export type ListFilters = {
  q?: string;
  tag?: string;
  version?: string;
  country?: string;
  onlineOnly?: boolean;
  sort?: ServerSort;
  page?: number;
};

const listColumns = {
  id: servers.id,
  slug: servers.slug,
  name: servers.name,
  host: servers.host,
  port: servers.port,
  shortDescription: servers.shortDescription,
  bannerUrl: servers.bannerUrl,
  favicon: servers.favicon,
  tags: servers.tags,
  country: servers.country,
  online: servers.online,
  playersOnline: servers.playersOnline,
  playersMax: servers.playersMax,
  version: servers.version,
  motd: servers.motd,
  monthlyVotes,
  featured: isFeatured,
};

export type ServerListItem = Awaited<ReturnType<typeof listServers>>["items"][number];

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listServers(filters: ListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const conditions: SQL[] = [eq(servers.published, true)];

  if (filters.q) {
    const q = `%${escapeLike(filters.q)}%`;
    conditions.push(
      or(ilike(servers.name, q), ilike(servers.host, q), ilike(servers.shortDescription, q))!,
    );
  }
  if (filters.tag) conditions.push(sql`${filters.tag} = any(${servers.tags})`);
  if (filters.version) conditions.push(ilike(servers.version, `%${escapeLike(filters.version)}%`));
  if (filters.country) conditions.push(eq(servers.country, filters.country));
  if (filters.onlineOnly) conditions.push(eq(servers.online, true));

  const order =
    filters.sort === "players"
      ? [desc(servers.online), desc(servers.playersOnline), desc(monthlyVotes)]
      : filters.sort === "newest"
        ? [desc(servers.createdAt)]
        : [desc(monthlyVotes), desc(servers.online), desc(servers.playersOnline), asc(servers.createdAt)];

  const where = and(...conditions);
  const [items, [{ count }]] = await Promise.all([
    db
      .select(listColumns)
      .from(servers)
      .where(where)
      .orderBy(...order)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(servers).where(where),
  ]);

  return { items, total: count, page, pageCount: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}

export async function listFeaturedServers() {
  return db
    .select(listColumns)
    .from(servers)
    .where(and(eq(servers.published, true), gt(servers.featuredUntil, new Date())))
    .orderBy(desc(monthlyVotes))
    .limit(6);
}

export async function listNewestServers(limit = 4) {
  return db
    .select(listColumns)
    .from(servers)
    .where(eq(servers.published, true))
    .orderBy(desc(servers.createdAt))
    .limit(limit);
}

/** Headline numbers for the homepage. */
export async function getSiteStats() {
  const [[serverStats], [voteStats]] = await Promise.all([
    db
      .select({
        servers: sql<number>`count(*)::int`,
        online: sql<number>`count(*) filter (where ${servers.online})::int`,
        players: sql<number>`coalesce(sum(${servers.playersOnline}) filter (where ${servers.online}), 0)::int`,
      })
      .from(servers)
      .where(eq(servers.published, true)),
    db
      .select({ votes: sql<number>`count(*)::int` })
      .from(votes)
      .where(sql`${votes.createdAt} >= date_trunc('month', now())`),
  ]);
  return { ...serverStats, votes: voteStats.votes };
}

/** How many published servers use each tag, most used first. */
export async function getTagCounts(limit = 12) {
  const result = await db.execute<{ tag: string; count: number }>(sql`
    select tag, count(*)::int as count
    from ${servers}, unnest(${servers.tags}) as tag
    where ${servers.published} = true
    group by tag
    order by count desc, tag asc
    limit ${limit}
  `);
  return result.map((r) => ({ tag: r.tag, count: Number(r.count) }));
}

export async function getServerBySlug(slug: string) {
  const rows = await db
    .select({ server: servers, monthlyVotes, featured: isFeatured })
    .from(servers)
    .where(eq(servers.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Position in the monthly ranking (1-based) among published servers. */
export async function getServerRank(serverId: string) {
  const result = await db.execute<{ rank: number }>(sql`
    select rank from (
      select ${servers.id} as id,
             rank() over (order by ${monthlyVotes} desc) as rank
      from ${servers}
      where ${servers.published} = true
    ) ranked where id = ${serverId}
  `);
  return result[0] ? Number(result[0].rank) : null;
}

export async function getPlayerHistory(serverId: string, hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select({ online: serverPings.online, players: serverPings.players, at: serverPings.createdAt })
    .from(serverPings)
    .where(and(eq(serverPings.serverId, serverId), gte(serverPings.createdAt, since)))
    .orderBy(asc(serverPings.createdAt));
}

export async function getUptime(serverId: string, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      up: sql<number>`count(*) filter (where ${serverPings.online})::int`,
    })
    .from(serverPings)
    .where(and(eq(serverPings.serverId, serverId), gte(serverPings.createdAt, since)));
  if (!row || row.total === 0) return null;
  return Math.round((row.up / row.total) * 1000) / 10;
}

export async function getTopVoters(serverId: string, limit = 10) {
  return db
    .select({ username: votes.username, count: sql<number>`count(*)::int` })
    .from(votes)
    .where(
      and(eq(votes.serverId, serverId), sql`${votes.createdAt} >= date_trunc('month', now())`),
    )
    .groupBy(votes.username)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export function slugify(input: string) {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "server";
}

export async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name);
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const existing = await db
      .select({ id: servers.id })
      .from(servers)
      .where(eq(servers.slug, candidate))
      .limit(1);
    if (!existing[0] || existing[0].id === ignoreId) return candidate;
  }
  return `${base}-${Date.now()}`;
}
