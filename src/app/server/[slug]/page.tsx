import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CopyAddress } from "@/components/copy-address";
import { ReportForm } from "@/components/forms/report-form";
import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { Motd } from "@/components/motd";
import { PlayerChart } from "@/components/player-chart";
import { PlayerHead } from "@/components/player-head";
import { formatAddress } from "@/components/server-card";
import { ServerIcon } from "@/components/server-icon";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { COUNTRIES } from "@/lib/constants";
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
  const result = await getServerBySlug(slug);
  if (!result) return { title: "Server nicht gefunden" };
  const { server, monthlyVotes } = result;
  const address = formatAddress(server.host, server.port);
  const status = server.online
    ? `${server.playersOnline}/${server.playersMax} Spieler online`
    : "Aktuell offline";
  return pageMetadata({
    title: `${server.name} – Minecraft Server IP: ${address}`,
    // Lead with the server's own pitch, then the facts people search for (IP, players).
    description: `${truncate(server.shortDescription, 90)} IP: ${address} · ${status} · ${monthlyVotes} Votes diesen Monat.`,
    path: `/server/${server.slug}`,
    index: server.published,
    ownImage: true,
  });
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export default async function ServerPage({ params, searchParams }: PageProps<"/server/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const [result, user] = await Promise.all([getServerBySlug(slug), getCurrentUser()]);
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
  const url = absoluteUrl(`/server/${server.slug}`);

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "GameServer",
          "@id": `${url}#server`,
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
          { name: "Startseite", path: "/" },
          ...(mainTag ? [{ name: `${mainTag} Server`, path: tagHref(mainTag) }] : []),
          { name: server.name, path: `/server/${server.slug}` },
        ]}
      />
      {sp.created && (
        <p className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
          Dein Server ist jetzt gelistet! Teile den Vote-Link mit deiner Community:{" "}
          <code className="font-mono">/server/{server.slug}/vote</code>
        </p>
      )}
      {!server.published && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Dieser Server ist ausgeblendet und nicht öffentlich sichtbar.
        </p>
      )}

      <header className="card flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <ServerIcon favicon={server.favicon} name={server.name} size={64} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{server.name}</h1>
            <StatusBadge online={server.online} />
            {result.featured && <span className="tag bg-amber-500/20 text-amber-300">Featured</span>}
          </div>
          <p className="text-zinc-400">{server.shortDescription}</p>
          <div className="flex flex-wrap gap-1.5">
            {server.tags.map((tag) => {
              const known = knownTag(tag);
              return known ? (
                <Link key={tag} href={tagHref(known)} className="tag hover:bg-zinc-700">
                  {tag}
                </Link>
              ) : (
                <span key={tag} className="tag">
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <CopyAddress address={address} large />
          <Link href={`/server/${server.slug}/vote`} className="btn-primary">
            Für diesen Server voten
          </Link>
        </div>
      </header>

      {server.bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={server.bannerUrl}
          alt={`${server.name} Banner`}
          width={468}
          height={60}
          className="mx-auto h-auto w-full max-w-[468px] rounded-md"
          decoding="async"
        />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Spieler" value={`${server.playersOnline} / ${server.playersMax}`} />
        <Stat label="Votes (Monat)" value={monthlyVotes} />
        <Stat label="Rang" value={rank ? `#${rank}` : "–"} />
        <Stat label="Uptime (7 Tage)" value={uptime !== null ? `${uptime}%` : "–"} />
        <Stat label="Ping" value={server.latencyMs !== null ? `${server.latencyMs} ms` : "–"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {server.motd && (
            <section className="card space-y-3 p-6">
              <h2 className="font-semibold">MOTD</h2>
              <Motd value={server.motd} />
            </section>
          )}
          <section className="card space-y-3 p-6">
            <h2 className="font-semibold">Über den Server</h2>
            {server.description ? (
              <Markdown>{server.description}</Markdown>
            ) : (
              <p className="text-zinc-300">{server.shortDescription}</p>
            )}
          </section>
          <section className="card space-y-3 p-6">
            <h2 className="font-semibold">Spieler in den letzten 24 Stunden</h2>
            <PlayerChart points={history} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-3 p-6 text-sm">
            <h2 className="text-base font-semibold">Informationen</h2>
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Version</dt>
                <dd className="truncate text-right">{server.version ?? "–"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Land</dt>
                <dd>{server.country ? COUNTRIES[server.country] ?? server.country : "–"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Votifier</dt>
                <dd>{server.votifierEnabled ? "Aktiv" : "Nein"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Zuletzt geprüft</dt>
                <dd>
                  {server.lastPingedAt
                    ? server.lastPingedAt.toLocaleTimeString("de-DE", { timeStyle: "short" })
                    : "–"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Eingetragen</dt>
                <dd>{server.createdAt.toLocaleDateString("de-DE")}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              {server.website && (
                <a href={server.website} target="_blank" rel="noopener noreferrer nofollow ugc" className="btn-secondary">
                  Website
                </a>
              )}
              {server.discord && (
                <a href={server.discord} target="_blank" rel="noopener noreferrer nofollow ugc" className="btn-secondary">
                  Discord
                </a>
              )}
            </div>
          </section>

          <section className="card space-y-3 p-6 text-sm">
            <h2 className="text-base font-semibold">Top-Voter diesen Monat</h2>
            {topVoters.length === 0 ? (
              <p className="text-zinc-500">Noch keine Votes. Sei der Erste!</p>
            ) : (
              <ol className="space-y-1">
                {topVoters.map((v, i) => (
                  <li key={v.username} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 font-mono">
                      <span className="w-5 text-right text-zinc-500">{i + 1}.</span>
                      <PlayerHead name={v.username} size={20} />
                      <span className="truncate">{v.username}</span>
                    </span>
                    <span className="text-zinc-400">{v.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {canEdit && (
            <section className="card space-y-3 p-6 text-sm">
              <h2 className="text-base font-semibold">Verwaltung</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={`/server/${server.slug}/edit`} className="btn-secondary">
                  Bearbeiten
                </Link>
                <form action={refreshStatusNow}>
                  <input type="hidden" name="id" value={server.id} />
                  <button className="btn-secondary">Status aktualisieren</button>
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
