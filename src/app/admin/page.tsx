import { eq, gte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.admin, robots: NOINDEX };
}

async function count(query: Promise<{ n: number }[]>) {
  const [row] = await query;
  return row?.n ?? 0;
}

export default async function AdminPage() {
  await requireAdmin();
  const t = await getDictionary();
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
    [t.admin.statServers, serverCount],
    [t.admin.statOnline, onlineCount],
    [t.admin.statUsers, userCount],
    [t.admin.statVotes, votesToday],
    [t.admin.statReports, openReports],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.admin.overviewTitle}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4">
            <div className="text-xs font-medium tracking-wide text-subtle uppercase">{label}</div>
            <div className="mt-1.5 font-pixel text-3xl">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
