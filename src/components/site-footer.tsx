import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { TAGS } from "@/lib/constants";
import { env } from "@/lib/env";
import { tagHref } from "@/lib/tags";

// Crawlable links to the most important landing pages on every page.
const FOOTER_TAGS = TAGS.slice(0, 12);

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 py-8 text-sm text-zinc-400">
      <nav aria-label="Spielmodi" className="mx-auto mb-6 max-w-6xl px-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Minecraft Server nach Spielmodus
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {FOOTER_TAGS.map((tag) => (
            <li key={tag}>
              <Link href={tagHref(tag)} className="hover:text-zinc-200">
                {tag} Server
              </Link>
            </li>
          ))}
          <li>
            <Link href="/spielmodus" className="text-brand-400 hover:underline">
              Alle Spielmodi
            </Link>
          </li>
        </ul>
      </nav>
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
