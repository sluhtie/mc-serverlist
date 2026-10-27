import { StarIcon, VoteIcon } from "@/components/icons";
import Link from "@/components/link";
import { getDictionary } from "@/lib/i18n/server";
import type { ServerListItem } from "@/lib/servers";
import { knownTag, tagHref } from "@/lib/tags";
import { CopyAddress } from "./copy-address";
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

/** Row in the ranking. The name is a stretched link, so the whole card is clickable. */
export async function ServerCard({ server, rank }: { server: ServerListItem; rank?: number }) {
  const t = await getDictionary();
  return (
    <article
      className={`card card-hover group relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5 ${
        server.featured ? "border-amber-400/50 bg-gradient-to-r from-amber-400/[.07] to-transparent" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-4 sm:w-72 sm:shrink-0">
        {rank !== undefined && <RankBadge rank={rank} />}
        <ServerIcon
          favicon={server.favicon}
          name={server.name}
          size={56}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="min-w-0">
          <Link
            href={`/server/${server.slug}`}
            className="block truncate font-display text-lg font-bold text-fg transition after:absolute after:inset-0 after:rounded-2xl group-hover:text-accent"
          >
            {server.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge online={server.online} />
            {server.featured && (
              <span className="tag gap-1 border-amber-400/40 bg-amber-400/15 text-warn">
                <StarIcon className="h-3 w-3" /> {t.common.featured}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {server.bannerUrl ? (
          // Banners are arbitrary external URLs, so next/image would need an open allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={server.bannerUrl}
            alt={t.common.bannerAlt(server.name)}
            width={468}
            height={60}
            className="h-[60px] w-full max-w-[468px] rounded-lg object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <p className="line-clamp-2 text-sm text-muted">{server.shortDescription}</p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <ServerTags tags={server.tags} />
          {server.version && (
            <span className="tag max-w-48 truncate border-sky-500/30 bg-sky-500/10 text-info">{server.version}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:w-56 sm:shrink-0">
        <div className="relative z-10 sm:self-end">
          <CopyAddress address={formatAddress(server.host, server.port)} />
        </div>
        <div className="flex items-end gap-4">
          <PlayerBar online={server.playersOnline} max={server.playersMax} label={t.common.players} className="flex-1" />
          <span className="flex shrink-0 items-center gap-1 text-sm text-muted" title={t.common.votesThisMonth}>
            <VoteIcon className="h-4 w-4 text-accent" />
            <strong className="font-pixel text-base text-fg">{server.monthlyVotes}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}
