import Link from "next/link";
import { HeroArt } from "@/components/brand/hero-art";
import { LogoMark } from "@/components/brand/logo-mark";
import { Pagination } from "@/components/pagination";
import { ServerCard } from "@/components/server-card";
import { ServerTile } from "@/components/server-tile";
import { bannerTheme } from "@/lib/banner";
import { COUNTRIES, PAGE_SIZE, TAGS } from "@/lib/constants";
import { env } from "@/lib/env";
import {
  getSiteStats,
  getTagCounts,
  listFeaturedServers,
  listNewestServers,
  listServers,
  type ServerSort,
} from "@/lib/servers";

const SORTS: Record<ServerSort, string> = {
  votes: "Meiste Votes",
  players: "Meiste Spieler",
  newest: "Neueste",
};

const numberFormat = new Intl.NumberFormat("de-DE");

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function SectionHeading({
  title,
  subtitle,
  action,
  accent = "text-zinc-100",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className={`text-xl font-bold tracking-tight ${accent}`}>{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

async function Hero() {
  const stats = await getSiteStats();
  const items = [
    { label: "Server gelistet", value: stats.servers },
    { label: "Spieler online", value: stats.players },
    { label: "Votes diesen Monat", value: stats.votes },
  ];
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-[#0b1a12] via-zinc-950 to-zinc-950">
      <HeroArt className="absolute inset-x-0 bottom-0 -z-10 h-56 w-full sm:h-64" />
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="grid items-center gap-8 px-6 pb-40 pt-10 sm:px-10 sm:pb-44 sm:pt-14 lg:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <p className="tag mb-4 gap-1.5 border border-brand-500/30 bg-brand-500/10 text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            {numberFormat.format(stats.online)} Server gerade online
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Finde deinen nächsten <span className="text-brand-400">Minecraft Server</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-300">
            Live-Status, Spielerzahlen und ein monatliches Vote-Ranking. Stimme für deine
            Lieblingsserver ab oder trage deinen eigenen Server bei {env.siteName} ein.
          </p>
          <form action="/" role="search" className="mt-6 flex max-w-xl gap-2">
            <input
              name="q"
              placeholder="Servername oder IP suchen…"
              className="input bg-zinc-950/80 py-2.5 text-base backdrop-blur"
              aria-label="Suche"
            />
            <button className="btn-primary px-5">Suchen</button>
          </form>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {items.map((item) => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">{item.label}</dt>
                <dd className="text-2xl font-bold text-white">{numberFormat.format(item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <LogoMark className="animate-float mx-auto hidden h-56 w-56 drop-shadow-[0_20px_40px_rgba(34,197,94,0.25)] lg:block" />
      </div>
    </section>
  );
}

async function Gamemodes() {
  const counts = await getTagCounts();
  // Fall back to the predefined tags so the section is useful on a fresh install.
  const tags = counts.length > 0 ? counts : TAGS.slice(0, 12).map((tag) => ({ tag, count: 0 }));
  return (
    <section className="space-y-4">
      <SectionHeading title="Beliebte Spielmodi" subtitle="Finde Server, die zu deinem Spielstil passen." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tags.map(({ tag, count }) => {
          const { hue } = bannerTheme(tag);
          return (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="card group flex items-center gap-3 p-3 transition hover:border-zinc-600"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-bold text-white shadow-inner"
                style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${hue} 50% 24%))` }}
              >
                {tag.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold group-hover:text-brand-400">{tag}</span>
                <span className="text-xs text-zinc-500">
                  {count === 1 ? "1 Server" : `${numberFormat.format(count)} Server`}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const PLAYER_STEPS = [
  { title: "Server finden", text: "Filtere nach Spielmodus, Version und Land und sieh live, wer online ist." },
  { title: "IP kopieren", text: "Ein Klick kopiert die Adresse. In Minecraft unter Multiplayer einfügen und los." },
  { title: "Voten", text: "Stimme täglich für deinen Lieblingsserver ab und kassiere Belohnungen ingame." },
];

const OWNER_FEATURES = [
  { title: "Live-Status", text: "Spielerzahlen, MOTD, Uptime und Verlauf werden automatisch abgefragt." },
  { title: "Votifier", text: "Votes landen per Votifier oder NuVotifier direkt auf deinem Server." },
  { title: "Offene API", text: "Hol dir Stats und Vote-Checks per JSON für Plugins und Websites." },
];

function InfoSection() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="card p-6">
        <h2 className="text-xl font-bold tracking-tight">So funktioniert&apos;s</h2>
        <ol className="mt-5 space-y-4">
          {PLAYER_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-zinc-800 font-bold text-brand-400">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-zinc-400">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="card relative overflow-hidden border-brand-600/40 bg-gradient-to-br from-brand-600/15 via-zinc-900/60 to-zinc-900/60 p-6">
        <LogoMark className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 opacity-20" />
        <h2 className="text-xl font-bold tracking-tight">Du betreibst einen Server?</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Trag ihn kostenlos ein und bring neue Spieler auf deinen Server.
        </p>
        <ul className="mt-5 space-y-3">
          {OWNER_FEATURES.map((feature) => (
            <li key={feature.title} className="flex gap-3 text-sm">
              <span className="mt-0.5 text-brand-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="text-zinc-100">{feature.title}:</strong>{" "}
                <span className="text-zinc-400">{feature.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/submit" className="btn-primary">
            Server eintragen
          </Link>
          <Link href="/api-docs" className="btn-secondary">
            API ansehen
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = first(sp.q)?.slice(0, 64);
  const tag = TAGS.find((t) => t === first(sp.tag));
  const version = first(sp.version)?.slice(0, 32);
  const country = first(sp.country);
  const online = first(sp.online) === "1";
  const sortParam = first(sp.sort);
  const sort: ServerSort = sortParam && sortParam in SORTS ? (sortParam as ServerSort) : "votes";
  const page = Math.max(1, Number(first(sp.page)) || 1);

  const filtered = Boolean(q || tag || version || country || online);
  const landing = page === 1 && !filtered;
  const [result, featured, newest] = await Promise.all([
    listServers({
      q,
      tag,
      version,
      country: country && country in COUNTRIES ? country : undefined,
      onlineOnly: online,
      sort,
      page,
    }),
    landing ? listFeaturedServers() : Promise.resolve([]),
    landing ? listNewestServers(4) : Promise.resolve([]),
  ]);
  const showRank = sort === "votes" && !filtered;

  return (
    <div className="space-y-12">
      {landing ? (
        <Hero />
      ) : (
        <section>
          <h1 className="text-3xl font-bold tracking-tight">
            {tag ? `${tag} Server` : q ? `Suche: „${q}“` : "Minecraft Server"}
          </h1>
          <p className="mt-2 text-zinc-400">
            Live-Status, Spielerzahlen und Votes aller Server bei {env.siteName}.
          </p>
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-4">
          <SectionHeading
            title="★ Featured Server"
            subtitle="Von uns hervorgehobene Server."
            accent="text-amber-300"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <ServerTile key={s.id} server={s} highlight />
            ))}
          </div>
        </section>
      )}

      {landing && <Gamemodes />}

      {newest.length > 0 && (
        <section className="space-y-4">
          <SectionHeading
            title="Neu eingetragen"
            subtitle="Frisch auf der Liste – schau vorbei!"
            action={
              <Link href="/?sort=newest#ranking" className="text-sm text-brand-400 hover:underline">
                Alle neuen Server →
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newest.map((s) => (
              <ServerTile key={s.id} server={s} />
            ))}
          </div>
        </section>
      )}

      <section id="ranking" className="scroll-mt-6 space-y-4">
        <SectionHeading
          title={filtered ? `${result.total} Treffer` : sort === "votes" ? "Ranking diesen Monat" : "Alle Server"}
          subtitle={showRank ? "Sortiert nach Votes im aktuellen Monat." : undefined}
          action={
            <Link href="/submit" className="text-sm text-brand-400 hover:underline">
              + Server eintragen
            </Link>
          }
        />

        <form action="/#ranking" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
          <input
            name="q"
            defaultValue={q}
            placeholder="Name oder IP suchen…"
            className="input lg:col-span-2"
            aria-label="Suche"
          />
          <select name="tag" defaultValue={tag ?? ""} className="input" aria-label="Spielmodus">
            <option value="">Alle Spielmodi</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            name="version"
            defaultValue={version}
            placeholder="Version, z. B. 1.21"
            className="input"
            aria-label="Version"
          />
          <select name="country" defaultValue={country ?? ""} className="input" aria-label="Land">
            <option value="">Alle Länder</option>
            {Object.entries(COUNTRIES).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="input" aria-label="Sortierung">
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-300 lg:col-span-2">
            <input type="checkbox" name="online" value="1" defaultChecked={online} />
            Nur Online-Server
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
            {filtered && (
              <Link href="/" className="btn-secondary">
                Zurücksetzen
              </Link>
            )}
            <button className="btn-primary">Filtern</button>
          </div>
        </form>

        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="card p-10 text-center text-zinc-400">
              Keine Server gefunden.{" "}
              <Link href="/submit" className="text-brand-400 hover:underline">
                Trage den ersten ein!
              </Link>
            </div>
          ) : (
            result.items.map((s, i) => (
              <ServerCard
                key={s.id}
                server={s}
                rank={showRank ? (result.page - 1) * PAGE_SIZE + i + 1 : undefined}
              />
            ))
          )}
        </div>
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          params={{ q, tag, version, country, online: online ? "1" : undefined, sort: sort === "votes" ? undefined : sort }}
        />
      </section>

      {landing && <InfoSection />}
    </div>
  );
}
