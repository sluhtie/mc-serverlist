import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { REPORT_REASONS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { setReportStatus } from "@/server/actions/admin";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Admin · Meldungen", robots: NOINDEX };

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin();
  const { status } = await searchParams;
  const showResolved = status === "resolved";
  const { reports, servers, users } = schema;
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      message: reports.message,
      status: reports.status,
      createdAt: reports.createdAt,
      serverName: servers.name,
      serverSlug: servers.slug,
      reporter: users.username,
    })
    .from(reports)
    .innerJoin(servers, eq(servers.id, reports.serverId))
    .leftJoin(users, eq(users.id, reports.reporterId))
    .where(eq(reports.status, showResolved ? "resolved" : "open"))
    .orderBy(desc(reports.createdAt))
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Meldungen</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/reports" className={showResolved ? "btn-secondary" : "btn-primary"}>Offen</Link>
          <Link href="/admin/reports?status=resolved" className={showResolved ? "btn-primary" : "btn-secondary"}>Erledigt</Link>
        </div>
      </div>
      {rows.length === 0 && <div className="card p-8 text-center text-zinc-400">Keine Meldungen.</div>}
      {rows.map((r) => (
        <div key={r.id} className="card flex flex-wrap items-start gap-4 p-4 text-sm">
          <div className="min-w-0 flex-1 space-y-1">
            <div>
              <Link href={`/server/${r.serverSlug}`} className="font-semibold hover:text-brand-400">{r.serverName}</Link>
              <span className="tag ml-2">{REPORT_REASONS[r.reason] ?? r.reason}</span>
            </div>
            {r.message && <p className="whitespace-pre-line text-zinc-300">{r.message}</p>}
            <p className="text-xs text-zinc-500">
              {r.createdAt.toLocaleString("de-DE")} · {r.reporter ?? "Gast"}
            </p>
          </div>
          <form action={setReportStatus}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value={showResolved ? "open" : "resolved"} />
            <button className="btn-secondary">{showResolved ? "Wieder öffnen" : "Als erledigt markieren"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
