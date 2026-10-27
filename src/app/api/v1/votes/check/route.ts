import { and, eq, gt, sql } from "drizzle-orm";
import { VOTE_COOLDOWN_HOURS } from "@/lib/constants";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Lets server plugins check whether a player voted in the last cooldown window:
 * GET /api/v1/votes/check?server=<slug>&username=<name>
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("server") ?? "";
  const username = url.searchParams.get("username") ?? "";
  if (!slug || !/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    return Response.json({ error: "invalid_parameters" }, { status: 400 });
  }
  const { servers, votes } = schema;
  const since = new Date(Date.now() - VOTE_COOLDOWN_HOURS * 60 * 60 * 1000);
  const [row] = await db
    .select({ votedAt: votes.createdAt })
    .from(votes)
    .innerJoin(servers, eq(servers.id, votes.serverId))
    .where(
      and(
        eq(servers.slug, slug),
        sql`lower(${votes.username}) = ${username.toLowerCase()}`,
        gt(votes.createdAt, since),
      ),
    )
    .orderBy(sql`${votes.createdAt} desc`)
    .limit(1);
  return Response.json(
    { voted: Boolean(row), votedAt: row?.votedAt ?? null },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
