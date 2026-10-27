import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { ServerCard } from "@/components/server-card";
import { COUNTRIES, PAGE_SIZE, TAGS } from "@/lib/constants";
import { env } from "@/lib/env";
import { listFeaturedServers, listServers, type ServerSort } from "@/lib/servers";

const SORTS: Record<ServerSort, string> = {
  votes: "Meiste Votes",
  players: "Meiste Spieler",
  newest: "Neueste",
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
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
  const [result, featured] = await Promise.all([
    listServers({
      q,
      tag,
      version,
      country: country && country in COUNTRIES ? country : undefined,
      onlineOnly: online,
      sort,
      page,
    }),
    page === 1 && !filtered ? listFeaturedServers() : Promise.resolve([]),
  ]);
  const showRank = sort === "votes" && !filtered;

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Die besten Minecraft Server
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Entdecke Server mit Live-Status, stimme für deine Favoriten ab und trage deinen eigenen
          Server bei {env.siteName} ein.
        </p>
      </section>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
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

      {featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
            Featured Server
          </h2>
          {featured.map((s) => (
            <ServerCard key={s.id} server={s} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {filtered ? `${result.total} Treffer` : "Ranking diesen Monat"}
          </h2>
          <Link href="/submit" className="text-sm text-brand-400 hover:underline">
            + Server eintragen
          </Link>
        </div>
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
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          params={{ q, tag, version, country, online: online ? "1" : undefined, sort: sort === "votes" ? undefined : sort }}
        />
      </section>
    </div>
  );
}
