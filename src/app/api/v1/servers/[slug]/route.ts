import { motdToPlainText } from "@/lib/minecraft/motd";
import { getServerBySlug } from "@/lib/servers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/servers/[slug]">) {
  const { slug } = await ctx.params;
  const result = await getServerBySlug(slug);
  if (!result || !result.server.published) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const { server, monthlyVotes } = result;
  return Response.json(
    {
      slug: server.slug,
      name: server.name,
      address: { host: server.host, port: server.port },
      online: server.online,
      players: { online: server.playersOnline, max: server.playersMax },
      version: server.version,
      motd: server.motd ? motdToPlainText(server.motd) : null,
      tags: server.tags,
      votes: { month: monthlyVotes },
      lastPingedAt: server.lastPingedAt,
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } },
  );
}
