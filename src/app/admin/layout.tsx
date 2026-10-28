import { NavLink } from "@/components/nav-link";
import { requireAdmin } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const t = await getDictionary();
  return (
    <div className="space-y-6">
      <nav aria-label={t.admin.nav} className="flex w-fit flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1">
        <NavLink href="/admin" exact>
          {t.admin.overview}
        </NavLink>
        <NavLink href="/admin/servers">{t.admin.servers}</NavLink>
        <NavLink href="/admin/users">{t.admin.users}</NavLink>
        <NavLink href="/admin/reports">{t.admin.reports}</NavLink>
        <NavLink href="/admin/api">{t.admin.api}</NavLink>
      </nav>
      {children}
    </div>
  );
}
