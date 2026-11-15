import { StarIcon, VoteIcon } from "@/components/icons";
import Link from "@/components/link";
import { getDictionary } from "@/lib/i18n/server";
import type { ServerListItem } from "@/lib/servers";
import { CopyAddress } from "./copy-address";
import { PlayerBar } from "./player-bar";
import { formatAddress } from "./server-card";
import { BannerImage } from "./banner-image";
import { ServerIcon } from "./server-icon";
import { StatusBadge } from "./status-badge";

/** Vertical card with the server banner (plain without one), used for the featured and newest sections. */
export async function ServerTile({ server, highlight = false }: { server: ServerListItem; highlight?: boolean }) {
  const t = await getDictionary();
  return (
    <article
      className={`card card-hover group relative flex flex-col overflow-hidden ${
        highlight ? "border-amber-400/50 ring-1 ring-amber-400/20" : ""
      }`}
    >
      {/* Only servers with a working banner get the artwork strip: it stays collapsed until the
          image has loaded (BannerImage sets [data-banner]), so broken URLs never leave a gap. */}
      {server.bannerUrl && (
        <div className="relative hidden h-28 overflow-hidden group-has-[[data-banner]]:block">
          <BannerImage
            src={server.bannerUrl}
            alt={t.common.bannerAlt(server.name)}
            className="h-full w-full object-cover group-hover:scale-105 [transition:opacity_.3s,transform_.5s]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
          {highlight && (
            <span className="tag absolute top-3 left-3 gap-1 border-amber-300 bg-amber-400 font-semibold text-amber-950 shadow">
              <StarIcon className="h-3 w-3" /> {t.common.featured}
            </span>
          )}
        </div>
      )}
      <div className="relative flex flex-1 flex-col gap-3 px-4 pt-4 pb-4 group-has-[[data-banner]]:-mt-8 group-has-[[data-banner]]:pt-0">
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
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge online={server.online} />
              {highlight && (
                // Shown on the banner strip instead when there is one.
                <span className="tag gap-1 border-amber-400/40 bg-amber-400/15 text-warn group-has-[[data-banner]]:hidden">
                  <StarIcon className="h-3 w-3" /> {t.common.featured}
                </span>
              )}
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
