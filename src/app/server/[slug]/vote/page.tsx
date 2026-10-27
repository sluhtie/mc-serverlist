import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VoteForm } from "@/components/forms/vote-form";
import { ServerIcon } from "@/components/server-icon";
import { VOTE_COOLDOWN_HOURS } from "@/lib/constants";
import { env } from "@/lib/env";
import { getServerBySlug } from "@/lib/servers";

export async function generateMetadata({
  params,
}: PageProps<"/server/[slug]/vote">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getServerBySlug(slug);
  return { title: result ? `Für ${result.server.name} voten` : "Voten" };
}

export default async function VotePage({ params }: PageProps<"/server/[slug]/vote">) {
  const { slug } = await params;
  const result = await getServerBySlug(slug);
  if (!result || !result.server.published) notFound();
  const { server, monthlyVotes } = result;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card flex items-center gap-4 p-6">
        <ServerIcon favicon={server.favicon} name={server.name} size={56} />
        <div>
          <h1 className="text-xl font-bold">Für {server.name} voten</h1>
          <p className="text-sm text-zinc-400">{monthlyVotes} Votes diesen Monat</p>
        </div>
      </div>
      <div className="card p-6">
        <VoteForm serverId={server.id} turnstileSiteKey={env.turnstileSiteKey} />
        <p className="mt-4 text-xs text-zinc-500">
          Du kannst alle {VOTE_COOLDOWN_HOURS} Stunden einmal pro Server voten.
          {server.votifierEnabled && " Deine Belohnung wird automatisch an den Server gesendet."}
        </p>
      </div>
      <Link href={`/server/${server.slug}`} className="block text-center text-sm text-zinc-400 hover:text-zinc-200">
        ← Zurück zum Server
      </Link>
    </div>
  );
}
