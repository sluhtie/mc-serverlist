import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "@/components/link";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { setReportStatus } from "@/server/actions/admin";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.adminReports, robots: NOINDEX };
}

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin();
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
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
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.admin.reports}</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/reports" className={showResolved ? "btn-secondary" : "btn-primary"}>{t.admin.open}</Link>
          <Link href="/admin/reports?status=resolved" className={showResolved ? "btn-primary" : "btn-secondary"}>{t.admin.resolved}</Link>
        </div>
      </div>
      {rows.length === 0 && <div className="card p-10 text-center text-muted">{t.admin.noReports}</div>}
      {rows.map((r) => (
        <div key={r.id} className="card flex flex-wrap items-start gap-4 p-4 text-sm">
          <div className="min-w-0 flex-1 space-y-1">
            <div>
              <Link href={`/server/${r.serverSlug}`} className="font-display font-bold transition hover:text-accent">{r.serverName}</Link>
              <span className="tag ml-2">{t.reportReasons[r.reason] ?? r.reason}</span>
            </div>
            {r.message && <p className="whitespace-pre-line text-fg-soft">{r.message}</p>}
            <p className="text-xs text-subtle">
              {r.createdAt.toLocaleString(INTL_LOCALE[locale])} · {r.reporter ?? t.common.guest}
            </p>
          </div>
          <form action={setReportStatus}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value={showResolved ? "open" : "resolved"} />
            <button className="btn-secondary">{showResolved ? t.admin.reopen : t.admin.markResolved}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
