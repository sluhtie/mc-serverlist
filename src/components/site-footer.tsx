import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { env } from "@/lib/env";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 py-8 text-sm text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4">
        <span className="flex items-center gap-2">
          <LogoMark className="h-6 w-6 shrink-0" />
          <span>
            © {new Date().getFullYear()} {env.siteName}. Nicht offiziell mit Mojang oder Microsoft
            verbunden.
          </span>
        </span>
        <nav className="ml-auto flex gap-4">
          <Link href="/api-docs" className="hover:text-zinc-200">
            API
          </Link>
          <Link href="/impressum" className="hover:text-zinc-200">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-zinc-200">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
