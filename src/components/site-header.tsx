import { LogoMark } from "@/components/brand/logo-mark";
import { MenuIcon, PlusIcon } from "@/components/icons";
import Link from "@/components/link";
import { NavLink } from "@/components/nav-link";
import { LanguageSwitcher, ThemeToggle } from "@/components/preferences";
import { PlayerHead } from "@/components/player-head";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/server";
import type { Theme } from "@/lib/theme";
import { logout } from "@/server/actions/auth";

export async function SiteHeader({ theme }: { theme: Theme }) {
  const [user, t] = await Promise.all([getCurrentUser(), getDictionary()]);

  const links = (
    <>
      <NavLink href="/">{t.nav.servers}</NavLink>
      <NavLink href="/spielmodus">{t.nav.gamemodes}</NavLink>
      {user?.role === "admin" && (
        <NavLink href="/admin" className="text-warn!">
          {t.nav.admin}
        </NavLink>
      )}
    </>
  );

  const account = user ? (
    <>
      <Link href="/account" className="btn-ghost gap-2 px-2.5">
        <PlayerHead name={user.username} size={22} />
        <span className="max-w-32 truncate">{user.username}</span>
      </Link>
      <form action={logout}>
        <button className="btn-ghost text-muted">{t.nav.logout}</button>
      </form>
    </>
  ) : (
    <>
      <Link href="/login" className="btn-ghost">
        {t.nav.login}
      </Link>
      <Link href="/register" className="btn-secondary">
        {t.nav.register}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-page/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={t.nav.home}>
          <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
          <span className="font-display text-lg font-extrabold tracking-tight">{env.siteName}</span>
        </Link>

        <nav aria-label={t.nav.main} className="ml-4 hidden items-center gap-1 md:flex">
          {links}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle initial={theme} />
          <span className="mx-1 h-6 w-px bg-line" aria-hidden />
          {account}
          <Link href="/submit" className="btn-primary">
            <PlusIcon className="h-4 w-4" />
            {t.nav.submit}
          </Link>
        </div>

        {/* Mobile: a disclosure instead of a JS drawer, so it works before hydration. */}
        <details className="group relative ml-auto md:hidden">
          <summary
            className="btn-secondary list-none px-2.5 [&::-webkit-details-marker]:hidden"
            aria-label={t.nav.menu}
          >
            <MenuIcon className="h-5 w-5" />
          </summary>
          <div className="card absolute right-0 mt-2 flex w-72 flex-col gap-1 p-3">
            <nav aria-label={t.nav.main} className="flex flex-col gap-1">
              {links}
            </nav>
            <div className="my-2 h-px bg-line" />
            <div className="flex flex-col gap-1 [&>*]:justify-start">{account}</div>
            <Link href="/submit" className="btn-primary mt-2">
              <PlusIcon className="h-4 w-4" />
              {t.nav.submit}
            </Link>
            <div className="mt-3 flex items-center justify-between">
              <LanguageSwitcher />
              <ThemeToggle initial={theme} />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
