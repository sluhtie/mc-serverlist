import { eq, gte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export const metadata = { title: "Admin" };

async function count(query: Promise<{ n: number }[]>) {
  const [row] = await query;
  return row?.n ?? 0;
}

export default async function AdminPage() {
  await requireAdmin();
  const { servers, users, votes, reports } = schema;
  const n = sql<number>`count(*)::int`;
  const [serverCount, onlineCount, userCount, votesToday, openReports] = await Promise.all([
    count(db.select({ n }).from(servers)),
    count(db.select({ n }).from(servers).where(eq(servers.online, true))),
    count(db.select({ n }).from(users)),
    count(db.select({ n }).from(votes).where(gte(votes.createdAt, sql`now() - interval '24 hours'`))),
    count(db.select({ n }).from(reports).where(eq(reports.status, "open"))),
  ]);

  const stats = [
    ["Server", serverCount],
    ["Davon online", onlineCount],
    ["Benutzer", userCount],
    ["Votes (24 h)", votesToday],
    ["Offene Meldungen", openReports],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin-Übersicht</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
