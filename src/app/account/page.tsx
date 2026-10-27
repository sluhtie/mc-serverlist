import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/forms/auth-forms";
import { formatAddress } from "@/components/server-card";
import { ServerIcon } from "@/components/server-icon";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { monthlyVotes } from "@/lib/servers";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Mein Account", robots: NOINDEX };

export default async function AccountPage() {
  const user = await requireUser("/account");
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hallo, {user.username}</h1>
        <p className="text-zinc-400">{user.email}</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meine Server</h2>
          <Link href="/submit" className="btn-primary">
            + Server eintragen
          </Link>
        </div>
        {myServers.length === 0 ? (
          <div className="card p-8 text-center text-zinc-400">Du hast noch keine Server eingetragen.</div>
        ) : (
          myServers.map((s) => (
            <div key={s.id} className="card flex flex-wrap items-center gap-4 p-4">
              <ServerIcon favicon={s.favicon} name={s.name} size={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/server/${s.slug}`} className="font-semibold hover:text-brand-400">
                  {s.name}
                </Link>
                <div className="font-mono text-xs text-zinc-500">{formatAddress(s.host, s.port)}</div>
              </div>
              <StatusBadge online={s.online} />
              {!s.published && <span className="tag bg-amber-500/20 text-amber-300">Ausgeblendet</span>}
              <span className="text-sm text-zinc-400">{s.monthlyVotes} Votes</span>
              <Link href={`/server/${s.slug}/edit`} className="btn-secondary">
                Bearbeiten
              </Link>
            </div>
          ))
        )}
      </section>

      <section className="card max-w-md space-y-4 p-6">
        <h2 className="text-lg font-semibold">Passwort ändern</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
