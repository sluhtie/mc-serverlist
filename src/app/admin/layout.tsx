import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4 text-sm">
        <Link href="/admin" className="btn-secondary">Übersicht</Link>
        <Link href="/admin/servers" className="btn-secondary">Server</Link>
        <Link href="/admin/users" className="btn-secondary">Benutzer</Link>
        <Link href="/admin/reports" className="btn-secondary">Meldungen</Link>
      </nav>
      {children}
    </div>
  );
}
