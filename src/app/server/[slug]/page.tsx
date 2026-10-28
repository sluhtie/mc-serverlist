import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CopyAddress } from "@/components/copy-address";
import { ReportForm } from "@/components/forms/report-form";
import {
  ClockIcon,
  ExternalIcon,
  RefreshIcon,
  SignalIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
  VoteIcon,
} from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import Link from "@/components/link";
import { Markdown } from "@/components/markdown";
import { Motd } from "@/components/motd";
import { PlayerBar } from "@/components/player-bar";
import { PlayerChart } from "@/components/player-chart";
import { PlayerHead } from "@/components/player-head";
import { ServerBanner } from "@/components/server-banner";
import { formatAddress, ServerTags } from "@/components/server-card";
import { ServerIcon } from "@/components/server-icon";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { INTL_LOCALE, localizePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { absoluteUrl, pageMetadata, truncate } from "@/lib/seo";
import {
  getPlayerHistory,
  getServerBySlug,
  getServerRank,
  getTopVoters,
  getUptime,
} from "@/lib/servers";
import { knownTag, tagHref } from "@/lib/tags";
import { refreshStatusNow } from "@/server/actions/servers";

export async function generateMetadata({
  params,
}: PageProps<"/server/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [result, t, locale] = await Promise.all([getServerBySlug(slug), getDictionary(), getLocale()]);
  if (!result) return { title: t.meta.serverNotFound };
  const { server, monthlyVotes } = result;
  const address = formatAddress(server.host, server.port);
  const status = server.online
    ? t.meta.playersOnline(server.playersOnline, server.playersMax)
    : t.meta.currentlyOffline;
  return pageMetadata({
    locale,
    title: t.meta.serverTitle(server.name, address),
    // Lead with the server's own pitch, then the facts people search for (IP, players).
    description: t.meta.serverDescription(truncate(server.shortDescription, 90), address, status, monthlyVotes),
    path: `/server/${server.slug}`,
    index: server.published,
    ownImage: true,
  });
}

function Stat({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-subtle uppercase">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <div className="mt-1.5 font-pixel text-2xl text-fg">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-medium">{children}</dd>
    </div>
  );
}

export default async function ServerPage({ params, searchParams }: PageProps<"/server/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const [result, user, t, locale] = await Promise.all([
    getServerBySlug(slug),
    getCurrentUser(),
    getDictionary(),
    getLocale(),
  ]);
  if (!result) notFound();
  const { server, monthlyVotes } = result;
  const canEdit = user && (user.id === server.ownerId || user.role === "admin");
  if (!server.published && !canEdit) notFound();

  const [rank, history, uptime, topVoters] = await Promise.all([
    getServerRank(server.id),
    getPlayerHistory(server.id, 24),
    getUptime(server.id, 7),
    getTopVoters(server.id),
  ]);
  const address = formatAddress(server.host, server.port);
  const mainTag = knownTag(server.tags[0]);
  const url = absoluteUrl(localizePath(`/server/${server.slug}`, locale));
  const intl = INTL_LOCALE[locale];

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "GameServer",
          "@id": `${absoluteUrl(`/server/${server.slug}`)}#server`,
          name: server.name,
          url,
          description: server.shortDescription,
          // The server address is what players search for, so expose it as an identifier.
          identifier: address,
          ...(server.bannerUrl ? { image: server.bannerUrl } : {}),
          serverStatus: server.online ? "https://schema.org/Online" : "https://schema.org/OfflineTemporarily",
          playersOnline: server.online ? server.playersOnline : 0,
          game: { "@type": "VideoGame", name: "Minecraft", url: "https://www.minecraft.net" },
          dateCreated: server.createdAt.toISOString(),
          dateModified: server.updatedAt.toISOString(),
        }}
      />
      <Breadcrumbs
        items={[
          { name: t.common.home, path: "/" },
          ...(mainTag ? [{ name: t.gamemodes.tagServers(mainTag), path: tagHref(mainTag) }] : []),
          { name: server.name, path: `/server/${server.slug}` },
        ]}
      />
      {sp.created && (
        <p className="rounded-2xl border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-sm text-ok">
          {t.server.created}{" "}
          <code className="font-mono">{localizePath(`/server/${server.slug}/vote`, locale)}</code>
        </p>
      )}
      {!server.published && (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-warn">
          {t.server.hiddenNotice}
        </p>
      )}

      <header className="card relative overflow-hidden">
        <div className="relative h-36 overflow-hidden sm:h-44">
          {/* A custom banner is a small 468×60 strip; a light blur hides the upscaling but keeps it recognizable. */}
          {server.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={server.bannerUrl}
              alt={t.common.bannerAlt(server.name)}
              className="h-full w-full scale-105 object-cover blur-[2px]"
              decoding="async"
            />
          ) : (
            <ServerBanner name={server.name} bannerUrl={null} className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent to-70%" />
        </div>
        <div className="relative -mt-16 flex flex-col gap-6 px-6 pb-6 md:flex-row md:items-end">
          <div className="w-fit rounded-3xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
            <ServerIcon favicon={server.favicon} name={server.name} size={96} className="rounded-2xl" />
          </div>
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{server.name}</h1>
              <StatusBadge online={server.online} />
              {result.featured && (
                <span className="tag gap-1 border-amber-400/40 bg-amber-400/15 text-warn">
                  <StarIcon className="h-3 w-3" /> {t.common.featured}
                </span>
              )}
            </div>
            <p className="max-w-2xl text-fg-soft">{server.shortDescription}</p>
            <div className="flex flex-wrap gap-1.5">
              <ServerTags tags={server.tags} limit={server.tags.length} />
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <CopyAddress address={address} large />
            {server.bedrockEnabled && (
              <div className="flex items-center gap-2 text-xs text-subtle md:justify-end">
                <span className="font-semibold tracking-wide uppercase">{t.server.bedrock}</span>
                {/* Bedrock clients ask for address and port separately, so only the host is copied. */}
                <CopyAddress address={server.bedrockHost ?? server.host} compact />
                <span className="font-mono">{t.server.bedrockPort(server.bedrockPort ?? 19132)}</span>
              </div>
            )}
            <Link href={`/server/${server.slug}/vote`} className="btn-primary px-6 py-3 text-base">
              <VoteIcon className="h-5 w-5" /> {t.server.voteCta}
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="card col-span-2 p-4 md:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-subtle uppercase">
            <UsersIcon className="h-3.5 w-3.5 text-accent" />
            {t.server.statPlayers}
          </div>
          <div className="mt-1.5 font-pixel text-2xl">
            {server.playersOnline}
            <span className="text-subtle">/{server.playersMax}</span>
          </div>
          <PlayerBar online={server.playersOnline} max={server.playersMax} className="mt-1" />
        </div>
        <Stat label={t.server.statVotes} icon={VoteIcon}>
          {monthlyVotes}
        </Stat>
        <Stat label={t.server.statRank} icon={TrophyIcon}>
          {rank ? `#${rank}` : "–"}
        </Stat>
        <Stat label={t.server.statUptime} icon={ClockIcon}>
          {uptime !== null ? `${uptime}%` : "–"}
        </Stat>
        <Stat label={t.server.statPing} icon={SignalIcon}>
          {server.latencyMs !== null ? `${server.latencyMs} ms` : "–"}
        </Stat>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {server.motd && (
            <section className="card space-y-3 p-6">
              <h2 className="font-display text-lg font-bold">{t.server.motd}</h2>
              <Motd value={server.motd} />
            </section>
          )}
          <section className="card space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">{t.server.about}</h2>
            {server.description ? (
              <Markdown>{server.description}</Markdown>
            ) : (
              <p className="text-fg-soft">{server.shortDescription}</p>
            )}
          </section>
          <section className="card space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">{t.server.history}</h2>
            <PlayerChart points={history} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6 text-sm">
            <h2 className="font-display text-lg font-bold">{t.server.info}</h2>
            <dl className="mt-2 divide-y divide-line">
              <InfoRow label={t.server.version}>{server.version ?? "–"}</InfoRow>
              <InfoRow label={t.server.country}>
                {server.country ? (t.countries[server.country] ?? server.country) : "–"}
              </InfoRow>
              <InfoRow label={t.server.votifier}>
                {server.votifierEnabled ? <span className="text-ok">{t.server.active}</span> : t.server.no}
              </InfoRow>
              <InfoRow label={t.server.bedrock}>
                {server.bedrockEnabled ? <span className="text-ok">{t.server.active}</span> : t.server.no}
              </InfoRow>
              <InfoRow label={t.server.lastChecked}>
                {server.lastPingedAt ? server.lastPingedAt.toLocaleTimeString(intl, { timeStyle: "short" }) : "–"}
              </InfoRow>
              <InfoRow label={t.server.listedSince}>{server.createdAt.toLocaleDateString(intl)}</InfoRow>
            </dl>
            {(server.website || server.discord) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {server.website && (
                  <a href={server.website} target="_blank" rel="noopener noreferrer nofollow ugc" className="btn-secondary">
                    {t.server.website} <ExternalIcon className="h-3.5 w-3.5" />
                  </a>
                )}
                {server.discord && (
                  <a
                    href={server.discord}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="btn border border-indigo-500/40 bg-indigo-500 text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.2)] hover:bg-indigo-400"
                  >
                    {t.server.discord} <ExternalIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="card p-6 text-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <TrophyIcon className="h-4 w-4 text-warn" /> {t.server.topVoters}
            </h2>
            {topVoters.length === 0 ? (
              <p className="mt-3 text-subtle">{t.server.noVotes}</p>
            ) : (
              <ol className="mt-3 space-y-1">
                {topVoters.map((v, i) => (
                  <li
                    key={v.username}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-surface-2"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="w-5 text-right font-pixel text-subtle">{i + 1}</span>
                      <PlayerHead name={v.username} size={24} />
                      <span className="truncate font-mono">{v.username}</span>
                    </span>
                    <span className="font-pixel text-accent">{v.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {canEdit && (
            <section className="card space-y-3 p-6 text-sm">
              <h2 className="font-display text-lg font-bold">{t.server.manage}</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={`/server/${server.slug}/edit`} className="btn-secondary">
                  {t.common.edit}
                </Link>
                <form action={refreshStatusNow}>
                  <input type="hidden" name="id" value={server.id} />
                  <button className="btn-secondary">
                    <RefreshIcon /> {t.server.refresh}
                  </button>
                </form>
              </div>
            </section>
          )}

          <ReportForm serverId={server.id} />
        </aside>
      </div>
    </div>
  );
}
