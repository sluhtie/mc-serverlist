import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { gamemodeBackground } from "@/components/gamemode-grid";
import { GamemodeIcon } from "@/components/gamemode-icon";
import { ArrowRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import Link from "@/components/link";
import { Pagination } from "@/components/pagination";
import { ServerCard } from "@/components/server-card";
import { PAGE_SIZE, TAGS } from "@/lib/constants";
import { INTL_LOCALE, localizePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { listServers, type ServerSort } from "@/lib/servers";
import { tagDescription, tagFromSlug, tagHref } from "@/lib/tags";

const SORTS: ServerSort[] = ["votes", "players", "newest"];

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function parseParams(sp: Awaited<PageProps<"/spielmodus/[tag]">["searchParams"]>) {
  const sort = SORTS.find((s) => s === first(sp.sort)) ?? "votes";
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  return { sort, page };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/spielmodus/[tag]">): Promise<Metadata> {
  const [tag, t, locale] = await Promise.all([params.then((p) => tagFromSlug(p.tag)), getDictionary(), getLocale()]);
  if (!tag) return { title: t.meta.tagNotFound };
  const { sort, page } = parseParams(await searchParams);
  const path = page > 1 ? `${tagHref(tag)}?page=${page}` : tagHref(tag);
  return pageMetadata({
    locale,
    title: page > 1 ? t.meta.tagPageTitle(tag, page) : t.meta.tagTitle(tag),
    description: tagDescription(tag, locale),
    // Other sort orders show the same servers, so only the default order is indexed.
    path: sort === "votes" ? path : undefined,
    index: sort === "votes",
    ownImage: true,
  });
}

export default async function GamemodePage({ params, searchParams }: PageProps<"/spielmodus/[tag]">) {
  const [tag, t, locale] = await Promise.all([params.then((p) => tagFromSlug(p.tag)), getDictionary(), getLocale()]);
  if (!tag) notFound();
  const { sort, page } = parseParams(await searchParams);
  const result = await listServers({ tag, sort, page });
  if (page > result.pageCount) notFound();
  const showRank = sort === "votes";
  const related = TAGS.filter((t) => t !== tag).slice(0, 12);
  const description = tagDescription(tag, locale);
  const numberFormat = new Intl.NumberFormat(INTL_LOCALE[locale]);

  return (
    <div className="space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.gamemodes.tagServers(tag),
          description,
          url: absoluteUrl(localizePath(tagHref(tag), locale)),
          inLanguage: INTL_LOCALE[locale],
          mainEntity: {
            "@type": "ItemList",
            itemListElement: result.items.map((s, i) => ({
              "@type": "ListItem",
              position: (result.page - 1) * PAGE_SIZE + i + 1,
              url: absoluteUrl(localizePath(`/server/${s.slug}`, locale)),
              name: s.name,
            })),
          },
        }}
      />
      <Breadcrumbs
        items={[
          { name: t.common.home, path: "/" },
          { name: t.nav.gamemodes, path: "/spielmodus" },
          { name: t.gamemodes.tagServers(tag), path: tagHref(tag) },
        ]}
      />

      <header className="card relative flex flex-col gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: gamemodeBackground(tag) }}
        />
        <span
          className="relative grid h-24 w-24 shrink-0 animate-rise place-items-center rounded-2xl shadow-lg ring-1 ring-black/10"
          style={{
            background: gamemodeBackground(tag),
            boxShadow: "inset 0 3px 0 rgb(255 255 255 / .18), inset 0 -5px 0 rgb(0 0 0 / .25)",
          }}
        >
          <GamemodeIcon tag={tag} className="h-16 w-16 drop-shadow-lg" />
        </span>
        <div className="relative">
          <p className="eyebrow">{t.common.serverCount(numberFormat.format(result.total), result.total)}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t.gamemodes.tagHeading(tag)}
          </h1>
          <p className="mt-2 max-w-3xl text-fg-soft">{description}</p>
        </div>
      </header>

      <section id="ranking" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {showRank ? t.gamemodes.ranking : t.sorts[sort]}
          </h2>
          <nav aria-label={t.home.sortLabel} className="flex rounded-xl border border-line bg-surface-2 p-1 text-sm">
            {SORTS.map((value) => (
              <Link
                key={value}
                href={value === "votes" ? tagHref(tag) : `${tagHref(tag)}?sort=${value}`}
                aria-current={value === sort ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  value === sort ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg"
                }`}
              >
                {t.sorts[value]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="card p-12 text-center text-muted">
              {t.gamemodes.empty(tag)}{" "}
              <Link href="/submit" className="link">
                {t.gamemodes.beFirst}
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
        <h2 className="font-display text-lg font-bold">{t.gamemodes.more}</h2>
        <ul className="flex flex-wrap gap-2">
          {related.map((other) => (
            <li key={other}>
              <Link
                href={tagHref(other)}
                className="tag gap-1.5 py-1 pr-2.5 pl-1.5 transition hover:border-line-strong hover:text-fg"
              >
                <GamemodeIcon tag={other} className="h-4 w-4" />
                {t.gamemodes.tagServers(other)}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/spielmodus" className="tag gap-1 py-1 text-accent transition hover:border-brand-500/50">
              {t.gamemodes.all} <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
