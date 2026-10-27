import { desc, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { setBanned, setRole } from "@/server/actions/admin";

export const metadata = { title: "Admin · Benutzer" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
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
        <h1 className="text-2xl font-bold">Benutzer ({rows.length})</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} placeholder="Suchen…" className="input" />
          <button className="btn-secondary">Suchen</button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-2">Benutzer</th>
              <th className="p-2">Rolle</th>
              <th className="p-2">Registriert</th>
              <th className="p-2">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((u) => (
              <tr key={u.id} className={u.banned ? "opacity-60" : ""}>
                <td className="p-2">
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </td>
                <td className="p-2">
                  {u.role === "admin" ? <span className="tag bg-amber-500/20 text-amber-300">Admin</span> : "User"}
                  {u.banned && <span className="tag ml-1 bg-red-500/20 text-red-300">Gesperrt</span>}
                </td>
                <td className="p-2">{u.createdAt.toLocaleDateString("de-DE")}</td>
                <td className="flex flex-wrap gap-1 p-2">
                  {u.id !== admin.id && (
                    <>
                      <form action={setRole}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="role" value={u.role === "admin" ? "user" : "admin"} />
                        <button className="btn-secondary px-2 py-1">
                          {u.role === "admin" ? "Admin entziehen" : "Zum Admin machen"}
                        </button>
                      </form>
                      <form action={setBanned}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="banned" value={u.banned ? "false" : "true"} />
                        <button className={u.banned ? "btn-secondary px-2 py-1" : "btn-danger px-2 py-1"}>
                          {u.banned ? "Entsperren" : "Sperren"}
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
