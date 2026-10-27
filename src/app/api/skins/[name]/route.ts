import {
  defaultFace,
  getCachedHead,
  lookupHead,
  renderHeadPng,
  type HeadLookup,
} from "@/lib/minecraft/skin";
import { normalizeHeadSize } from "@/lib/minecraft/player";
import { getClientIp, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const CACHE_CONTROL: Record<HeadLookup["status"], string> = {
  found: "public, max-age=21600, stale-while-revalidate=86400",
  unknown: "public, max-age=3600",
  error: "public, max-age=300",
};

/**
 * Player head as PNG: GET /api/skins/<name>?size=64
 * Unknown names and failed lookups get a placeholder head instead of an error, so an
 * <img> never breaks.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/skins/[name]">) {
  const { name } = await ctx.params;
  const size = normalizeHeadSize(new URL(req.url).searchParams.get("size"));

  let lookup = getCachedHead(name);
  if (!lookup) {
    // Only cache misses reach Mojang, which rate-limits us per server IP.
    const ip = await getClientIp();
    lookup =
      rateLimit(`skin:${ip}`, 60, 60 * 1000) && rateLimit("skin:global", 500, 10 * 60 * 1000)
        ? await lookupHead(name)
        : { face: defaultFace(), status: "error" };
  }

  return new Response(new Uint8Array(renderHeadPng(lookup.face, size)), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": CACHE_CONTROL[lookup.status],
      "Access-Control-Allow-Origin": "*",
      "X-Skin-Status": lookup.status,
    },
  });
}
