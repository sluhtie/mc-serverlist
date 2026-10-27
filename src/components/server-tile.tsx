import Link from "next/link";
import type { ServerListItem } from "@/lib/servers";
import { CopyAddress } from "./copy-address";
import { formatAddress } from "./server-card";
import { ServerBanner } from "./server-banner";
import { ServerIcon } from "./server-icon";
import { StatusBadge } from "./status-badge";

/** Vertical card with banner artwork, used for the featured and newest sections. */
export function ServerTile({ server, highlight = false }: { server: ServerListItem; highlight?: boolean }) {
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 ${
        highlight
          ? "border-amber-500/40 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10"
          : "hover:border-zinc-700"
      }`}
    >
      <Link href={`/server/${server.slug}`} className="relative block h-24 overflow-hidden" tabIndex={-1}>
        <ServerBanner name={server.name} bannerUrl={server.bannerUrl} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        {highlight && (
          <span className="tag absolute left-3 top-3 gap-1 bg-amber-400 font-semibold text-amber-950 shadow">
            ★ Featured
          </span>
        )}
      </Link>
      <div className="relative -mt-7 flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="flex items-end gap-3">
          <div className="rounded-lg bg-zinc-900 p-1 ring-1 ring-zinc-800">
            <ServerIcon favicon={server.favicon} name={server.name} size={52} />
          </div>
          <div className="min-w-0 pb-0.5">
            <Link
              href={`/server/${server.slug}`}
              className="block truncate font-semibold text-zinc-100 hover:text-brand-400"
            >
              {server.name}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <StatusBadge online={server.online} />
              <span>
                <strong className="text-zinc-200">{server.playersOnline}</strong>/{server.playersMax}
              </span>
            </div>
          </div>
        </div>
        <p className="line-clamp-2 flex-1 text-sm text-zinc-400">{server.shortDescription}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CopyAddress address={formatAddress(server.host, server.port)} />
          </div>
          <span className="shrink-0 text-sm text-zinc-400" title="Votes diesen Monat">
            <strong className="text-brand-400">{server.monthlyVotes}</strong> Votes
          </span>
        </div>
      </div>
    </article>
  );
}
