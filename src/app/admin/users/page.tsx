import { desc, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { setBanned, setRole } from "@/server/actions/admin";
import type { Metadata } from "next";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.adminUsers, robots: NOINDEX };
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const { users } = schema;
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      banned: users.banned,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(query ? or(ilike(users.email, `%${query}%`), ilike(users.username, `%${query}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.admin.usersTitle(rows.length)}</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} placeholder={t.common.searchPlaceholder} className="input" />
          <button className="btn-secondary">{t.common.search}</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-2 text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="p-3">{t.admin.colUser}</th>
              <th className="p-3">{t.admin.colRole}</th>
              <th className="p-3">{t.admin.colRegistered}</th>
              <th className="p-3">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className={u.banned ? "opacity-60" : ""}>
                <td className="p-3">
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-subtle">{u.email}</div>
                </td>
                <td className="p-3">
                  {u.role === "admin" ? <span className="tag border-amber-500/30 bg-amber-500/10 text-warn">{t.admin.roleAdmin}</span> : t.admin.roleUser}
                  {u.banned && <span className="tag ml-1 border-red-500/30 bg-red-500/10 text-danger">{t.admin.banned}</span>}
                </td>
                <td className="p-3">{u.createdAt.toLocaleDateString(INTL_LOCALE[locale])}</td>
                <td className="flex flex-wrap gap-1 p-3">
                  {u.id !== admin.id && (
                    <>
                      <form action={setRole}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="role" value={u.role === "admin" ? "user" : "admin"} />
                        <button className="btn-secondary px-2 py-1">
                          {u.role === "admin" ? t.admin.revokeAdmin : t.admin.makeAdmin}
                        </button>
                      </form>
                      <form action={setBanned}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="banned" value={u.banned ? "false" : "true"} />
                        <button className={u.banned ? "btn-secondary px-2 py-1" : "btn-danger px-2 py-1"}>
                          {u.banned ? t.admin.unban : t.admin.ban}
                        </button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
