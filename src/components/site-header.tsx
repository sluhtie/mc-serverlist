import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { logout } from "@/server/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-white">
            ⛏
          </span>
          {env.siteName}
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800">
            Server
          </Link>
          <Link href="/submit" className="rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800">
            Server eintragen
          </Link>
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-2 text-amber-300 hover:bg-zinc-800"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800"
              >
                {user.username}
              </Link>
              <form action={logout}>
                <button className="btn-secondary">Abmelden</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800">
                Anmelden
              </Link>
              <Link href="/register" className="btn-primary">
                Registrieren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
