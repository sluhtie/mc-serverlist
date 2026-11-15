import { StarIcon, VoteIcon } from "@/components/icons";
import Link from "@/components/link";
import { getDictionary } from "@/lib/i18n/server";
import type { ServerListItem } from "@/lib/servers";
import { knownTag, tagHref } from "@/lib/tags";
import { CopyAddress } from "./copy-address";
import { BannerPlaceholder } from "./server-banner";
import { PlayerBar } from "./player-bar";
import { ServerIcon } from "./server-icon";
import { StatusBadge } from "./status-badge";

// Gold, iron and copper blocks for the podium.
const PODIUM: Record<number, string> = {
  1: "from-yellow-300 to-amber-500 text-amber-950 shadow-amber-500/40",
  2: "from-zinc-200 to-zinc-400 text-zinc-800 shadow-zinc-400/40",
  3: "from-orange-300 to-orange-600 text-orange-950 shadow-orange-500/40",
};

export function formatAddress(host: string, port: number) {
  return port === 25565 ? host : `${host}:${port}`;
}

export function RankBadge({ rank }: { rank: number }) {
  const podium = PODIUM[rank];
  if (podium) {
    return (
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br font-pixel text-lg font-bold shadow-md ring-1 ring-black/10 ${podium}`}
        style={{ boxShadow: "inset 0 2px 0 rgb(255 255 255 / .5), inset 0 -3px 0 rgb(0 0 0 / .2)" }}
      >
        {rank}
      </span>
    );
  }
  return <span className="w-10 shrink-0 text-center font-pixel text-lg text-subtle">#{rank}</span>;
}

export function ServerTags({ tags, limit = 4 }: { tags: string[]; limit?: number }) {
  return tags.slice(0, limit).map((tag) => {
    const known = knownTag(tag);
    return known ? (
      <Link key={tag} href={tagHref(known)} className="tag relative z-10 transition hover:border-brand-500/50 hover:text-accent">
        {tag}
      </Link>
    ) : (
      <span key={tag} className="tag">
        {tag}
      </span>
    );
  });
}

// Frosted panels keep text readable on any banner, light or dark.
const PANEL = "rounded-xl border border-line/70 bg-surface/80 shadow-sm backdrop-blur-md";
// The panels sit above the card-wide link but let clicks through, except on their own controls.
const PASS_THROUGH = "pointer-events-none relative z-10 [&_:is(a,button)]:pointer-events-auto";

/**
 * Row in the ranking. The server's banner (or its generated artwork) fills the whole card behind
 * a scrim, and the content sits on frosted panels. The panels' backdrop-filter makes them the
 * containing block of anything absolutely positioned inside, so the card-wide click target is a
 * separate link instead of a stretched ::after on the name.
 */
export async function ServerCard({ server, rank }: { server: ServerListItem; rank?: number }) {
  const t = await getDictionary();
  const href = `/server/${server.slug}`;
  return (
    <article
      className={`card card-hover group relative isolate flex flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${
        server.featured ? "border-amber-400/60" : ""
      }`}
    >
      <div className="absolute inset-0 -z-10 transition-transform duration-500 group-hover:scale-[1.03]" aria-hidden>
        {server.bannerUrl ? (
          // Banners are arbitrary external URLs, so next/image would need an open allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={server.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <BannerPlaceholder seed={server.name} className="h-full w-full" />
        )}
      </div>
      {/* Strong on the left where rank and icon sit on the scrim directly, lighter towards the right. */}
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-b from-surface/85 via-surface/50 to-surface/30 sm:bg-gradient-to-r sm:from-surface/90 sm:via-surface/45 sm:to-surface/5 ${
          server.featured ? "ring-1 ring-amber-400/40 ring-inset" : ""
        }`}
        aria-hidden
      />
      <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 z-0 rounded-2xl" />

      <div className={`flex min-w-0 flex-1 items-center gap-3 sm:gap-4 ${PASS_THROUGH}`}>
        {/* Stacked on phones so the info panel keeps most of the width. */}
        <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:gap-4">
          {rank !== undefined && <RankBadge rank={rank} />}
          <div className="hidden transition-transform duration-300 group-hover:scale-105 sm:block">
            <ServerIcon favicon={server.favicon} name={server.name} size={56} className="shadow-md" />
          </div>
          <div className="sm:hidden">
            <ServerIcon favicon={server.favicon} name={server.name} size={44} className="shadow-md" />
          </div>
        </div>
        <div className={`min-w-0 flex-1 px-3 py-2.5 sm:max-w-xl sm:px-4 sm:py-3 ${PANEL}`}>
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={href}
              className="truncate font-display text-lg leading-tight font-bold text-fg transition group-hover:text-accent"
            >
              {server.name}
            </Link>
            {server.version && (
              <span className="tag hidden max-w-40 shrink-0 truncate border-sky-500/30 bg-sky-500/10 text-info sm:inline-flex">
                {server.version}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted sm:line-clamp-1">{server.shortDescription}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge online={server.online} />
            {server.featured && (
              <span className="tag gap-1 border-amber-400/40 bg-amber-400/15 text-warn">
                <StarIcon className="h-3 w-3" /> {t.common.featured}
              </span>
            )}
            <ServerTags tags={server.tags} limit={3} />
          </div>
        </div>
      </div>

      <div className={`flex flex-col gap-2 sm:w-56 sm:shrink-0 ${PASS_THROUGH}`}>
        <div className={`flex items-end gap-4 px-3 py-2 ${PANEL}`}>
          <PlayerBar
            online={server.playersOnline}
            max={server.playersMax}
            label={t.common.players}
            className="flex-1"
          />
          <span className="flex shrink-0 items-center gap-1 text-sm text-muted" title={t.common.votesThisMonth}>
            <VoteIcon className="h-4 w-4 text-accent" />
            <strong className="font-pixel text-base text-fg">{server.monthlyVotes}</strong>
          </span>
        </div>
        <div className="[&>button]:w-full [&>button]:justify-between [&>button]:bg-surface/80 [&>button]:shadow-sm [&>button]:backdrop-blur-md">
          <CopyAddress address={formatAddress(server.host, server.port)} compact />
        </div>
      </div>
    </article>
  );
}
