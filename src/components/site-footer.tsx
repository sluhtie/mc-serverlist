import { LogoMark } from "@/components/brand/logo-mark";
import Link from "@/components/link";
import { TAGS } from "@/lib/constants";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/server";
import { tagHref } from "@/lib/tags";

// Crawlable links to the most important landing pages on every page.
const FOOTER_TAGS = TAGS.slice(0, 12);

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow mb-3 text-subtle!">{title}</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-muted transition hover:text-fg">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const t = await getDictionary();
  return (
    <footer className="mt-16 text-sm">
      <div className="grass-strip" aria-hidden />
      <div className="border-t border-black/20 bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark className="h-9 w-9" />
              <span className="font-display text-lg font-extrabold tracking-tight">{env.siteName}</span>
            </Link>
            <p className="mt-3 text-muted">{t.footer.pitch}</p>
          </div>
          <Column
            title={t.footer.explore}
            links={[
              { href: "/#ranking", label: t.footer.ranking },
              { href: "/?sort=newest#ranking", label: t.footer.newest },
              { href: "/spielmodus", label: t.footer.allGamemodes },
            ]}
          />
          <Column
            title={t.footer.forOwners}
            links={[
              { href: "/submit", label: t.footer.submit },
              { href: "/api-docs", label: t.footer.api },
            ]}
          />
          <Column
            title={t.footer.legal}
            links={[
              { href: "/impressum", label: t.footer.imprint },
              { href: "/datenschutz", label: t.footer.privacy },
            ]}
          />
        </div>
        <nav aria-label={t.footer.gamemodesNav} className="mx-auto max-w-6xl border-t border-line px-4 py-6">
          <h2 className="eyebrow mb-3 text-subtle!">{t.footer.byGamemode}</h2>
          <ul className="flex flex-wrap gap-2">
            {FOOTER_TAGS.map((tag) => (
              <li key={tag}>
                <Link href={tagHref(tag)} className="tag transition hover:border-line-strong hover:text-fg">
                  {t.footer.tagServers(tag)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-subtle">
            {t.footer.disclaimer(new Date().getFullYear(), env.siteName)}
          </p>
        </div>
      </div>
    </footer>
  );
}
