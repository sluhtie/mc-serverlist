import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/forms/auth-forms";
import { PlusIcon, ShieldIcon, VoteIcon } from "@/components/icons";
import Link from "@/components/link";
import { PlayerHead } from "@/components/player-head";
import { formatAddress } from "@/components/server-card";
import { ServerIcon } from "@/components/server-icon";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { monthlyVotes } from "@/lib/servers";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.account, robots: NOINDEX };
}

export default async function AccountPage() {
  const user = await requireUser("/account");
  const t = await getDictionary();
  const { servers } = schema;
  const myServers = await db
    .select({
      id: servers.id,
      slug: servers.slug,
      name: servers.name,
      host: servers.host,
      port: servers.port,
      favicon: servers.favicon,
      online: servers.online,
      published: servers.published,
      monthlyVotes,
    })
    .from(servers)
    .where(eq(servers.ownerId, user.id))
    .orderBy(desc(servers.createdAt));

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-surface p-1.5 shadow-md ring-1 ring-line">
          <PlayerHead name={user.username} size={56} className="rounded-xl" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.account.hello(user.username)}</h1>
          <p className="text-muted">{user.email}</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{t.account.myServers}</h2>
          <Link href="/submit" className="btn-primary">
            <PlusIcon /> {t.account.addServer}
          </Link>
        </div>
        {myServers.length === 0 ? (
          <div className="card p-10 text-center text-muted">{t.account.empty}</div>
        ) : (
          <div className="grid gap-3">
            {myServers.map((s) => (
              <div key={s.id} className="card flex flex-wrap items-center gap-4 p-4">
                <ServerIcon favicon={s.favicon} name={s.name} size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/server/${s.slug}`} className="font-display font-bold transition hover:text-accent">
                    {s.name}
                  </Link>
                  <div className="font-mono text-xs text-subtle">{formatAddress(s.host, s.port)}</div>
                </div>
                <StatusBadge online={s.online} />
                {!s.published && <span className="tag border-amber-500/30 bg-amber-500/10 text-warn">{t.common.hidden}</span>}
                <span className="flex items-center gap-1 text-sm text-muted">
                  <VoteIcon className="h-4 w-4 text-accent" /> {t.account.votes(s.monthlyVotes)}
                </span>
                <Link href={`/server/${s.slug}/edit`} className="btn-secondary">
                  {t.common.edit}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card max-w-md space-y-5 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <ShieldIcon className="h-5 w-5 text-accent" /> {t.account.security}
        </h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
