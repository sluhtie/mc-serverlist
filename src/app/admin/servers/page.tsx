import { desc, eq, ilike, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "@/components/link";
import { formatAddress } from "@/components/server-card";
import { StatusBadge } from "@/components/status-badge";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { isFeatured, monthlyVotes } from "@/lib/servers";
import { setFeatured, setPublished } from "@/server/actions/admin";
import { deleteServer } from "@/server/actions/servers";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.adminServers, robots: NOINDEX };
}

export default async function AdminServersPage({ searchParams }: PageProps<"/admin/servers">) {
  await requireAdmin();
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
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
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.admin.serversTitle(rows.length)}</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} placeholder={t.common.searchPlaceholder} className="input" />
          <button className="btn-secondary">{t.common.search}</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-2 text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="p-3">{t.admin.colServer}</th>
              <th className="p-3">{t.admin.colOwner}</th>
              <th className="p-3">{t.admin.colStatus}</th>
              <th className="p-3">{t.admin.colVotes}</th>
              <th className="p-3">{t.admin.colFeatured}</th>
              <th className="p-3">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => (
              <tr key={s.id} className={s.published ? "" : "opacity-60"}>
                <td className="p-3">
                  <Link href={`/server/${s.slug}`} className="font-semibold transition hover:text-accent">
                    {s.name}
                  </Link>
                  <div className="font-mono text-xs text-subtle">{formatAddress(s.host, s.port)}</div>
                </td>
                <td className="p-3">{s.owner}</td>
                <td className="p-3"><StatusBadge online={s.online} /></td>
                <td className="p-3">{s.monthlyVotes}</td>
                <td className="p-3">
                  <form action={setFeatured} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <Select
                      name="days"
                      size="sm"
                      className="w-40"
                      aria-label={t.admin.featuredFor(s.name)}
                      options={[
                        {
                          value: "",
                          label: s.featured ? t.admin.featuredUntil(s.featuredUntil?.toLocaleDateString(INTL_LOCALE[locale]) ?? "") : t.admin.no,
                        },
                        { value: "7", label: t.admin.days(7) },
                        { value: "30", label: t.admin.days(30) },
                        { value: "90", label: t.admin.days(90) },
                        { value: "0", label: t.admin.remove },
                      ]}
                    />
                    <button className="btn-secondary px-2 py-1">{t.admin.ok}</button>
                  </form>
                </td>
                <td className="flex flex-wrap gap-1 p-3">
                  <form action={setPublished}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="published" value={s.published ? "false" : "true"} />
                    <button className="btn-secondary px-2 py-1">{s.published ? t.admin.hide : t.admin.show}</button>
                  </form>
                  <Link href={`/server/${s.slug}/edit`} className="btn-secondary px-2 py-1">{t.common.edit}</Link>
                  <form action={deleteServer}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn-danger px-2 py-1">{t.admin.delete}</button>
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
