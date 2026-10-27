import { desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { formatAddress } from "@/components/server-card";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { isFeatured, monthlyVotes } from "@/lib/servers";
import { setFeatured, setPublished } from "@/server/actions/admin";
import { deleteServer } from "@/server/actions/servers";

export const metadata = { title: "Admin · Server" };

export default async function AdminServersPage({ searchParams }: PageProps<"/admin/servers">) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const { servers, users } = schema;
  const rows = await db
    .select({
      id: servers.id,
      slug: servers.slug,
      name: servers.name,
      host: servers.host,
      port: servers.port,
      online: servers.online,
      published: servers.published,
      featured: isFeatured,
      featuredUntil: servers.featuredUntil,
      owner: users.username,
      monthlyVotes,
    })
    .from(servers)
    .innerJoin(users, eq(users.id, servers.ownerId))
    .where(query ? or(ilike(servers.name, `%${query}%`), ilike(servers.host, `%${query}%`)) : undefined)
    .orderBy(desc(servers.createdAt))
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Server ({rows.length})</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} placeholder="Suchen…" className="input" />
          <button className="btn-secondary">Suchen</button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-2">Server</th>
              <th className="p-2">Besitzer</th>
              <th className="p-2">Status</th>
              <th className="p-2">Votes</th>
              <th className="p-2">Featured</th>
              <th className="p-2">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((s) => (
              <tr key={s.id} className={s.published ? "" : "opacity-60"}>
                <td className="p-2">
                  <Link href={`/server/${s.slug}`} className="font-medium hover:text-brand-400">
                    {s.name}
                  </Link>
                  <div className="font-mono text-xs text-zinc-500">{formatAddress(s.host, s.port)}</div>
                </td>
                <td className="p-2">{s.owner}</td>
                <td className="p-2"><StatusBadge online={s.online} /></td>
                <td className="p-2">{s.monthlyVotes}</td>
                <td className="p-2">
                  <form action={setFeatured} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <select name="days" defaultValue="" className="input w-28 py-1">
                      <option value="">{s.featured ? `bis ${s.featuredUntil?.toLocaleDateString("de-DE")}` : "Nein"}</option>
                      <option value="7">7 Tage</option>
                      <option value="30">30 Tage</option>
                      <option value="0">Entfernen</option>
                    </select>
                    <button className="btn-secondary px-2 py-1">OK</button>
                  </form>
                </td>
                <td className="flex flex-wrap gap-1 p-2">
                  <form action={setPublished}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="published" value={s.published ? "false" : "true"} />
                    <button className="btn-secondary px-2 py-1">{s.published ? "Ausblenden" : "Einblenden"}</button>
                  </form>
                  <Link href={`/server/${s.slug}/edit`} className="btn-secondary px-2 py-1">Bearbeiten</Link>
                  <form action={deleteServer}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn-danger px-2 py-1">Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
