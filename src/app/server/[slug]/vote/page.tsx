import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BannerImage } from "@/components/banner-image";
import { VoteForm } from "@/components/forms/vote-form";
import { ArrowLeftIcon, VoteIcon } from "@/components/icons";
import Link from "@/components/link";
import { formatAddress } from "@/components/server-card";
import { ServerIcon } from "@/components/server-icon";
import { VOTE_COOLDOWN_HOURS } from "@/lib/constants";
import { env } from "@/lib/env";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { getServerBySlug } from "@/lib/servers";

export async function generateMetadata({
  params,
}: PageProps<"/server/[slug]/vote">): Promise<Metadata> {
  const { slug } = await params;
  const [result, t, locale] = await Promise.all([getServerBySlug(slug), getDictionary(), getLocale()]);
  if (!result) return { title: t.meta.vote };
  const { server } = result;
  return pageMetadata({
    locale,
    title: t.meta.voteTitle(server.name),
    description: t.meta.voteDescription(server.name, formatAddress(server.host, server.port), server.votifierEnabled),
    path: `/server/${server.slug}/vote`,
    index: server.published,
    image: `/server/${server.slug}/opengraph-image`,
  });
}

export default async function VotePage({ params }: PageProps<"/server/[slug]/vote">) {
  const { slug } = await params;
  const [result, t] = await Promise.all([getServerBySlug(slug), getDictionary()]);
  if (!result || !result.server.published) notFound();
  const { server, monthlyVotes } = result;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="card group overflow-hidden">
        {server.bannerUrl && (
          <div className="relative hidden h-24 overflow-hidden group-has-[[data-banner]]:block">
            <BannerImage src={server.bannerUrl} alt="" className="h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          </div>
        )}
        <div className="relative flex items-end gap-4 px-6 pt-6 group-has-[[data-banner]]:-mt-10 group-has-[[data-banner]]:pt-0">
          <div className="rounded-2xl bg-surface p-1 shadow-lg ring-1 ring-line">
            <ServerIcon favicon={server.favicon} name={server.name} size={64} />
          </div>
          <div className="min-w-0 pb-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{t.vote.title(server.name)}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <VoteIcon className="h-4 w-4 text-accent" />
              {t.vote.votesThisMonth(monthlyVotes)}
            </p>
          </div>
        </div>
        <div className="p-6">
          <VoteForm serverId={server.id} turnstileSiteKey={env.turnstileSiteKey} />
          <p className="mt-4 text-xs text-subtle">
            {t.vote.cooldown(VOTE_COOLDOWN_HOURS)}
            {server.votifierEnabled && ` ${t.vote.rewardNote}`}
          </p>
        </div>
      </div>
      <Link
        href={`/server/${server.slug}`}
        className="flex items-center justify-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeftIcon /> {t.vote.back}
      </Link>
    </div>
  );
}
