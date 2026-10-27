import { StarIcon, VoteIcon } from "@/components/icons";
import Link from "@/components/link";
import { getDictionary } from "@/lib/i18n/server";
import type { ServerListItem } from "@/lib/servers";
import { CopyAddress } from "./copy-address";
import { PlayerBar } from "./player-bar";
import { formatAddress } from "./server-card";
import { ServerBanner } from "./server-banner";
import { ServerIcon } from "./server-icon";
import { StatusBadge } from "./status-badge";

/** Vertical card with banner artwork, used for the featured and newest sections. */
export async function ServerTile({ server, highlight = false }: { server: ServerListItem; highlight?: boolean }) {
  const t = await getDictionary();
  return (
    <article
      className={`card card-hover group relative flex flex-col overflow-hidden ${
        highlight ? "border-amber-400/50 ring-1 ring-amber-400/20" : ""
      }`}
    >
      <div className="relative h-28 overflow-hidden">
        <ServerBanner
          name={server.name}
          bannerUrl={server.bannerUrl}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
        {highlight && (
          <span className="tag absolute top-3 left-3 gap-1 border-amber-300 bg-amber-400 font-semibold text-amber-950 shadow">
            <StarIcon className="h-3 w-3" /> {t.common.featured}
          </span>
        )}
      </div>
      <div className="relative -mt-8 flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="flex items-end gap-3">
          <div className="rounded-2xl bg-surface p-1 shadow-md ring-1 ring-line">
            <ServerIcon favicon={server.favicon} name={server.name} size={52} />
          </div>
          <div className="min-w-0 pb-0.5">
            <Link
              href={`/server/${server.slug}`}
              className="block truncate font-display text-base font-bold text-fg transition after:absolute after:inset-0 group-hover:text-accent"
            >
              {server.name}
            </Link>
            <div className="mt-1">
              <StatusBadge online={server.online} />
            </div>
          </div>
        </div>
        <p className="line-clamp-2 flex-1 text-sm text-muted">{server.shortDescription}</p>
        <PlayerBar online={server.playersOnline} max={server.playersMax} label={t.common.players} />
        <div className="flex items-center justify-between gap-3">
          <div className="relative z-10 min-w-0">
            <CopyAddress address={formatAddress(server.host, server.port)} compact />
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm" title={t.common.votesThisMonth}>
            <VoteIcon className="h-4 w-4 text-accent" />
            <strong className="font-pixel text-base">{server.monthlyVotes}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}
