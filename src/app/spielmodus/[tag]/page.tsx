import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GamemodeIcon } from "@/components/gamemode-icon";
import { JsonLd } from "@/components/json-ld";
import { Pagination } from "@/components/pagination";
import { ServerCard } from "@/components/server-card";
import { bannerTheme } from "@/lib/banner";
import { PAGE_SIZE, TAGS } from "@/lib/constants";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { listServers, type ServerSort } from "@/lib/servers";
import { TAG_DESCRIPTIONS, tagFromSlug, tagHref } from "@/lib/tags";

const SORTS: Record<ServerSort, string> = {
  votes: "Meiste Votes",
  players: "Meiste Spieler",
  newest: "Neueste",
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function parseParams(sp: Awaited<PageProps<"/spielmodus/[tag]">["searchParams"]>) {
  const sortParam = first(sp.sort);
  const sort: ServerSort = sortParam && sortParam in SORTS ? (sortParam as ServerSort) : "votes";
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  return { sort, page };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/spielmodus/[tag]">): Promise<Metadata> {
  const tag = tagFromSlug((await params).tag);
  if (!tag) return { title: "Spielmodus nicht gefunden" };
  const { sort, page } = parseParams(await searchParams);
  const path = page > 1 ? `${tagHref(tag)}?page=${page}` : tagHref(tag);
  return pageMetadata({
    title: page > 1 ? `${tag} Server – Seite ${page}` : `${tag} Server – Die besten Minecraft ${tag} Server`,
    description: TAG_DESCRIPTIONS[tag],
    // Other sort orders show the same servers, so only the default order is indexed.
    path: sort === "votes" ? path : undefined,
    index: sort === "votes",
    ownImage: true,
  });
}

export default async function GamemodePage({ params, searchParams }: PageProps<"/spielmodus/[tag]">) {
  const tag = tagFromSlug((await params).tag);
  if (!tag) notFound();
  const { sort, page } = parseParams(await searchParams);
  const result = await listServers({ tag, sort, page });
  if (page > result.pageCount) notFound();
  const showRank = sort === "votes";
  const { hue } = bannerTheme(tag);
  const related = TAGS.filter((t) => t !== tag).slice(0, 12);

  return (
    <div className="space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${tag} Server`,
          description: TAG_DESCRIPTIONS[tag],
          url: absoluteUrl(tagHref(tag)),
          inLanguage: "de-DE",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: result.items.map((s, i) => ({
              "@type": "ListItem",
              position: (result.page - 1) * PAGE_SIZE + i + 1,
              url: absoluteUrl(`/server/${s.slug}`),
              name: s.name,
            })),
          },
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Startseite", path: "/" },
          { name: "Spielmodi", path: "/spielmodus" },
          { name: `${tag} Server`, path: tagHref(tag) },
        ]}
      />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span
          className="grid h-20 w-20 shrink-0 place-items-center rounded-xl ring-1 ring-white/10"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 35% 22%), hsl(${hue} 40% 11%))` }}
        >
          <GamemodeIcon tag={tag} className="h-12 w-12 drop-shadow" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minecraft {tag} Server</h1>
          <p className="mt-2 max-w-3xl text-zinc-400">{TAG_DESCRIPTIONS[tag]}</p>
        </div>
      </header>

      <section id="ranking" className="scroll-mt-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">
            {result.total === 1 ? "1 Server" : `${result.total} Server`}
            {showRank && <span className="font-normal text-zinc-400"> · Ranking diesen Monat</span>}
          </h2>
          <nav aria-label="Sortierung" className="flex gap-1 text-sm">
            {Object.entries(SORTS).map(([value, label]) => (
              <Link
                key={value}
                href={value === "votes" ? tagHref(tag) : `${tagHref(tag)}?sort=${value}`}
                aria-current={value === sort ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 ${
                  value === sort ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/60"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="card p-10 text-center text-zinc-400">
              Noch keine {tag} Server eingetragen.{" "}
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
          basePath={tagHref(tag)}
          params={{ sort: sort === "votes" ? undefined : sort }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Weitere Spielmodi</h2>
        <ul className="flex flex-wrap gap-2">
          {related.map((t) => (
            <li key={t}>
              <Link href={tagHref(t)} className="tag hover:bg-zinc-700">
                {t} Server
              </Link>
            </li>
          ))}
          <li>
            <Link href="/spielmodus" className="tag text-brand-400 hover:bg-zinc-700">
              Alle Spielmodi →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
