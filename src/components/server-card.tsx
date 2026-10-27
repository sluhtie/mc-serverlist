import Link from "next/link";
import type { ServerListItem } from "@/lib/servers";
import { CopyAddress } from "./copy-address";
import { ServerIcon } from "./server-icon";
import { StatusBadge } from "./status-badge";

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-300",
  2: "text-zinc-300",
  3: "text-orange-400",
};

export function formatAddress(host: string, port: number) {
  return port === 25565 ? host : `${host}:${port}`;
}

export function ServerCard({ server, rank }: { server: ServerListItem; rank?: number }) {
  return (
    <article
      className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
        server.featured ? "border-amber-500/50 bg-amber-500/5" : ""
      }`}
    >
      <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
        {rank !== undefined && (
          <span className={`w-8 text-center text-xl font-bold ${RANK_COLORS[rank] ?? "text-zinc-500"}`}>
            #{rank}
          </span>
        )}
        <ServerIcon favicon={server.favicon} name={server.name} />
        <div className="min-w-0">
          <Link
            href={`/server/${server.slug}`}
            className="block truncate font-semibold text-zinc-100 hover:text-brand-400"
          >
            {server.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge online={server.online} />
            {server.featured && (
              <span className="tag bg-amber-500/20 text-amber-300">Featured</span>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {server.bannerUrl ? (
          <Link href={`/server/${server.slug}`}>
            {/* Banners are arbitrary external URLs, so next/image would need an open allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={server.bannerUrl}
              alt={`${server.name} Banner`}
              className="h-[60px] w-full max-w-[468px] rounded-md object-cover"
              loading="lazy"
            />
          </Link>
        ) : (
          <p className="line-clamp-2 text-sm text-zinc-400">{server.shortDescription}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {server.tags.slice(0, 4).map((tag) => (
            <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="tag hover:bg-zinc-700">
              {tag}
            </Link>
          ))}
          {server.version && (
            <span className="tag max-w-48 truncate bg-sky-500/10 text-sky-300">
              {server.version}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:w-56 sm:shrink-0 sm:flex-col sm:items-end">
        <CopyAddress address={formatAddress(server.host, server.port)} />
        <div className="flex gap-4 text-sm text-zinc-400">
          <span title="Spieler online">
            <strong className="text-zinc-100">{server.playersOnline}</strong>/{server.playersMax}
          </span>
          <span title="Votes diesen Monat">
            <strong className="text-brand-400">{server.monthlyVotes}</strong> Votes
          </span>
        </div>
      </div>
    </article>
  );
}
