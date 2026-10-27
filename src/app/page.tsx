import type { Metadata } from "next";
import { GamemodeGrid } from "@/components/gamemode-grid";
import { HeroArt } from "@/components/brand/hero-art";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  ArrowRightIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  PlusIcon,
  SearchIcon,
  ServerRackIcon,
  SignalIcon,
  UsersIcon,
  VoteIcon,
} from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import Link from "@/components/link";
import { Pagination } from "@/components/pagination";
import { SectionHeading } from "@/components/section-heading";
import { ServerCard } from "@/components/server-card";
import { ServerTile } from "@/components/server-tile";
import { Select } from "@/components/ui/select";
import { COUNTRIES, PAGE_SIZE, TAGS } from "@/lib/constants";
import { env } from "@/lib/env";
import { INTL_LOCALE, localizePath } from "@/lib/i18n/config";
import { getDictionary, getLocale, localPermanentRedirect } from "@/lib/i18n/server";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import {
  getSiteStats,
  getTagCounts,
  listFeaturedServers,
  listNewestServers,
  listServers,
  type ServerSort,
} from "@/lib/servers";
import { knownTag, tagHref } from "@/lib/tags";

const SORTS: ServerSort[] = ["votes", "players", "newest"];

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

type SearchParams = Awaited<PageProps<"/">["searchParams"]>;

function parseParams(sp: SearchParams) {
  const q = first(sp.q)?.slice(0, 64);
  const tag = knownTag(first(sp.tag));
  const version = first(sp.version)?.slice(0, 32);
  const country = COUNTRIES.find((c) => c === first(sp.country));
  const online = first(sp.online) === "1";
  const sort = SORTS.find((s) => s === first(sp.sort)) ?? "votes";
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  return { q, tag, version, country, online, sort, page };
}

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const [{ q, tag, version, country, online, sort, page }, t, locale] = await Promise.all([
    searchParams.then(parseParams),
    getDictionary(),
    getLocale(),
  ]);
  if (q || tag || version || country || online || sort !== "votes") {
    // Search and filter combinations are endless near-duplicates of the main list and the
    // game mode pages, so keep them out of the index but let crawlers follow the links.
    return pageMetadata({
      locale,
      title: q ? t.meta.searchTitle(q) : tag ? t.gamemodes.tagServers(tag) : t.meta.filterTitle,
      description: t.meta.siteDescription,
      index: false,
      ownImage: true,
    });
  }
  if (page > 1) {
    // Paginated pages canonicalize to themselves so the servers on them stay discoverable.
    return pageMetadata({
      locale,
      title: t.meta.rankingPageTitle(page),
      description: t.meta.rankingPageDescription(page),
      path: `/?page=${page}`,
      ownImage: true,
    });
  }
  return pageMetadata({
    locale,
    title: t.meta.homeTitle(env.siteName),
    absoluteTitle: true,
    description: t.meta.siteDescription,
    path: "/",
    ownImage: true,
  });
}

async function Hero() {
  const [stats, t, locale] = await Promise.all([getSiteStats(), getDictionary(), getLocale()]);
  const numberFormat = new Intl.NumberFormat(INTL_LOCALE[locale]);
  const items = [
    { label: t.home.statServers, value: stats.servers, icon: ServerRackIcon },
    { label: t.home.statPlayers, value: stats.players, icon: UsersIcon },
    { label: t.home.statVotes, value: stats.votes, icon: VoteIcon },
  ];
  return (
    <section className="relative isolate -mt-2 overflow-hidden rounded-[2rem] border border-line bg-gradient-to-b from-sky-200 via-sky-100 to-page shadow-[var(--shadow-card)] dark:from-[#0b1f14] dark:via-[#0a120e] dark:to-page">
      <HeroArt variant="day" animated className="absolute inset-x-0 bottom-0 -z-10 h-56 w-full sm:h-72 dark:hidden" />
      <HeroArt animated className="absolute inset-x-0 bottom-0 -z-10 hidden h-56 w-full sm:h-72 dark:block" />
      <div className="pointer-events-none absolute -top-32 -left-24 -z-10 h-96 w-96 animate-glow rounded-full bg-brand-500/20 blur-3xl" />
      <div className="grid grid-cols-1 items-center gap-10 px-5 pt-10 pb-44 sm:px-12 sm:pt-16 sm:pb-56 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0 max-w-2xl">
          <p className="tag mb-5 animate-rise gap-2 border-brand-500/30 bg-surface/70 px-3 py-1 text-ok backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            {t.home.onlineNow(numberFormat.format(stats.online))}
          </p>
          <h1
            className="animate-rise font-display text-[2.6rem] leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl"
            style={{ animationDelay: "60ms" }}
          >
            {t.home.heroTitle}{" "}
            <span className="bg-gradient-to-r from-brand-500 via-emerald-400 to-lime-400 bg-clip-text text-transparent dark:from-brand-400 dark:via-emerald-300 dark:to-lime-300">
              {t.home.heroHighlight}
            </span>
          </h1>
          <p className="mt-5 max-w-xl animate-rise text-lg text-fg-soft" style={{ animationDelay: "120ms" }}>
            {t.home.heroText(env.siteName)}
          </p>
          <form
            action={localizePath("/", locale)}
            role="search"
            className="mt-7 flex max-w-xl animate-rise items-center gap-2 rounded-2xl border border-line bg-surface/85 p-1.5 shadow-lg backdrop-blur focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
            style={{ animationDelay: "180ms" }}
          >
            <SearchIcon className="ml-2.5 h-5 w-5 shrink-0 text-subtle" />
            <input
              name="q"
              placeholder={t.home.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-fg placeholder:text-subtle focus:outline-none"
              aria-label={t.home.searchLabel}
            />
            <button className="btn-primary px-4 py-2.5 sm:px-5">{t.home.search}</button>
          </form>
          <dl className="mt-8 grid max-w-xl animate-rise grid-cols-3 gap-2 sm:gap-3" style={{ animationDelay: "240ms" }}>
            {items.map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl border border-line bg-surface/70 p-3 backdrop-blur sm:p-4">
                <dt className="flex items-start gap-1.5 text-[11px] leading-tight font-medium tracking-wide text-muted uppercase sm:text-xs">
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{item.label}</span>
                </dt>
                <dd className="mt-1 font-pixel text-2xl text-fg sm:text-3xl">{numberFormat.format(item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mx-auto hidden lg:block" aria-hidden>
          <div className="absolute inset-6 animate-glow rounded-full bg-brand-500/30 blur-3xl" />
          <LogoMark className="relative h-64 w-64 animate-float drop-shadow-[0_30px_40px_rgba(22,101,52,0.35)]" />
        </div>
      </div>
    </section>
  );
}

async function Gamemodes() {
  // Only known tags have an icon and a filter, so drop anything else that is stored.
  const [rows, t] = await Promise.all([getTagCounts(), getDictionary()]);
  const counts = rows.flatMap(({ tag, count }) => {
    const known = knownTag(tag);
    return known ? [{ tag: known, count }] : [];
  });
  // Fall back to the predefined tags so the section is useful on a fresh install.
  const tags = counts.length > 0 ? counts : TAGS.slice(0, 12).map((tag) => ({ tag, count: 0 }));
  return (
    <section className="space-y-5">
      <SectionHeading
        eyebrow={t.home.gamemodesEyebrow}
        title={t.home.gamemodesTitle}
        subtitle={t.home.gamemodesSubtitle}
        action={<MoreLink href="/spielmodus">{t.home.allGamemodes}</MoreLink>}
      />
      <GamemodeGrid items={tags} />
    </section>
  );
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

const STEP_ICONS = [SearchIcon, CopyIcon, VoteIcon];
const FEATURE_ICONS = [SignalIcon, VoteIcon, CodeIcon];

async function InfoSection() {
  const t = await getDictionary();
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="card p-7">
        <p className="eyebrow">{t.home.howEyebrow}</p>
        <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">{t.home.howTitle}</h2>
        <ol className="mt-6 space-y-5">
          {t.home.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={step.title} className="flex gap-4">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-accent">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-md bg-brand-600 font-pixel text-[11px] text-white">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="font-display font-bold">{step.title}</h3>
                  <p className="text-sm text-muted">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-brand-700/40 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-7 text-white shadow-[var(--shadow-card)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 255 255 / .12) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <LogoMark className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rotate-12 opacity-25" />
        <div className="relative">
          <p className="eyebrow text-lime-300!">{t.home.ownerEyebrow}</p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">{t.home.ownerTitle}</h2>
          <p className="mt-1 text-white/75">{t.home.ownerText}</p>
          <ul className="mt-6 space-y-3.5">
            {t.home.ownerFeatures.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <li key={feature.title} className="flex gap-3 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-4 w-4 text-lime-300" />
                  </span>
                  <span>
                    <strong className="font-semibold">{feature.title}</strong>
                    <span className="block text-white/70">{feature.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/submit" className="btn bg-white text-brand-800 shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)] hover:bg-lime-50">
              <PlusIcon /> {t.home.ownerCta}
            </Link>
            <Link href="/api-docs" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/15">
              <CodeIcon /> {t.home.apiCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [{ q, tag, version, country, online, sort, page }, t, locale] = await Promise.all([
    searchParams.then(parseParams),
    getDictionary(),
    getLocale(),
  ]);

  // A plain game mode filter has a dedicated, indexable landing page.
  if (tag && !q && !version && !country && !online) {
    const sp = new URLSearchParams();
    if (sort !== "votes") sp.set("sort", sort);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    await localPermanentRedirect(qs ? `${tagHref(tag)}?${qs}` : tagHref(tag));
  }

  const filtered = Boolean(q || tag || version || country || online);
  const landing = page === 1 && !filtered;
  const [result, featured, newest] = await Promise.all([
    listServers({
      q,
      tag,
      version,
      country,
      onlineOnly: online,
      sort,
      page,
    }),
    landing ? listFeaturedServers() : Promise.resolve([]),
    landing ? listNewestServers(4) : Promise.resolve([]),
  ]);
  const showRank = sort === "votes" && !filtered;
  const home = absoluteUrl(localizePath("/", locale));

  return (
    <div className="space-y-16">
      {landing && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${absoluteUrl("/")}#website`,
                name: env.siteName,
                url: home,
                description: t.meta.siteDescription,
                inLanguage: INTL_LOCALE[locale],
                publisher: { "@id": `${absoluteUrl("/")}#organization` },
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: `${home}?q={search_term_string}` },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": `${absoluteUrl("/")}#organization`,
                name: env.siteName,
                url: absoluteUrl("/"),
                logo: absoluteUrl("/icons/icon-512.png"),
              },
              {
                "@type": "ItemList",
                name: t.meta.rankingName,
                itemListOrder: "https://schema.org/ItemListOrderDescending",
                itemListElement: result.items.map((s, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  url: absoluteUrl(localizePath(`/server/${s.slug}`, locale)),
                  name: s.name,
                })),
              },
            ],
          }}
        />
      )}
      {landing ? (
        <Hero />
      ) : (
        <section>
          <SectionHeading
            as="h1"
            eyebrow={t.home.rankingEyebrow}
            title={tag ? t.gamemodes.tagServers(tag) : q ? t.home.listSearchTitle(q) : t.home.listTitle}
            subtitle={t.home.listText(env.siteName)}
          />
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-5">
          <SectionHeading eyebrow={t.home.featuredEyebrow} title={t.home.featuredTitle} subtitle={t.home.featuredSubtitle} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <ServerTile key={s.id} server={s} highlight />
            ))}
          </div>
        </section>
      )}

      {landing && <Gamemodes />}

      {newest.length > 0 && (
        <section className="space-y-5">
          <SectionHeading
            eyebrow={t.home.newestEyebrow}
            title={t.home.newestTitle}
            subtitle={t.home.newestSubtitle}
            action={<MoreLink href="/?sort=newest#ranking">{t.home.allNewest}</MoreLink>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newest.map((s) => (
              <ServerTile key={s.id} server={s} />
            ))}
          </div>
        </section>
      )}

      <section id="ranking" className="scroll-mt-24 space-y-5">
        <SectionHeading
          eyebrow={landing ? t.home.rankingEyebrow : undefined}
          title={filtered ? t.home.results(result.total) : sort === "votes" ? t.home.rankingTitle : t.home.allServers}
          subtitle={showRank ? t.home.rankingSubtitle : undefined}
          action={
            <Link href="/submit" className="btn-secondary">
              <PlusIcon /> {t.home.addServer}
            </Link>
          }
        />

        <form
          action={`${localizePath("/", locale)}#ranking`}
          className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6"
          role="search"
        >
          <div className="relative lg:col-span-2">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              name="q"
              defaultValue={q}
              placeholder={t.home.filterSearch}
              className="input pl-10"
              aria-label={t.home.searchLabel}
            />
          </div>
          <Select
            name="tag"
            defaultValue={tag ?? ""}
            aria-label={t.home.tagLabel}
            options={[{ value: "", label: t.home.allTags }, ...TAGS.map((tg) => ({ value: tg, label: tg }))]}
          />
          <input
            name="version"
            defaultValue={version}
            placeholder={t.home.versionPlaceholder}
            className="input"
            aria-label={t.home.versionLabel}
          />
          <Select
            name="country"
            defaultValue={country ?? ""}
            aria-label={t.home.countryLabel}
            options={[
              { value: "", label: t.home.allCountries },
              ...COUNTRIES.map((value) => ({ value, label: t.countries[value] })),
            ]}
          />
          <Select
            name="sort"
            defaultValue={sort}
            aria-label={t.home.sortLabel}
            options={SORTS.map((value) => ({ value, label: t.sorts[value] }))}
          />
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-fg-soft lg:col-span-2">
            <input type="checkbox" name="online" value="1" defaultChecked={online} className="checkbox" />
            {t.home.onlineOnly}
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
            {filtered && (
              <Link href="/" className="btn-ghost">
                {t.home.reset}
              </Link>
            )}
            <button className="btn-primary">
              <CheckIcon /> {t.home.filter}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {result.items.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-12 text-center text-muted">
              <LogoMark className="h-14 w-14 opacity-60 grayscale" />
              <p>{t.home.noServers}</p>
              <Link href="/submit" className="link">
                {t.home.beFirst}
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
