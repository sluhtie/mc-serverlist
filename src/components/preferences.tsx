"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { useLocale, useT } from "@/lib/i18n/client";
import { delocalizePath, LOCALES, localizePath } from "@/lib/i18n/config";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

const THEME_ICONS = { system: MonitorIcon, light: SunIcon, dark: MoonIcon } as const;
const YEAR = 60 * 60 * 24 * 365;

/** Switches the page right away and remembers the choice for server rendering. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    delete root.dataset.theme;
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.dataset.theme = theme;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${YEAR}; samesite=lax`;
  }
}

/** Three-way switch: follow the OS, or force light or dark. */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const t = useT();
  const [theme, setTheme] = useState(initial);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div role="radiogroup" aria-label={t.prefs.theme} className="flex rounded-xl border border-line bg-surface-2 p-0.5">
      {(["light", "system", "dark"] as const).map((value) => {
        const Icon = THEME_ICONS[value];
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={t.prefs[value]}
            aria-label={t.prefs[value]}
            onClick={() => choose(value)}
            className={`grid h-7 w-7 cursor-pointer place-items-center rounded-lg transition ${
              active ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-subtle hover:text-fg"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function LanguageLinks() {
  const t = useT();
  const current = useLocale();
  const { path } = delocalizePath(usePathname());
  const query = useSearchParams().toString();
  const target = query ? `${path}?${query}` : path;
  return (
    <nav aria-label={t.prefs.language} className="flex rounded-xl border border-line bg-surface-2 p-0.5 text-xs font-semibold">
      {LOCALES.map((locale) => (
        // A full page load, because the root layout (header, <html lang>) renders per locale.
        <a
          key={locale}
          href={localizePath(target, locale)}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`grid h-7 min-w-8 place-items-center rounded-lg px-1.5 uppercase transition ${
            locale === current ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-subtle hover:text-fg"
          }`}
        >
          {locale}
        </a>
      ))}
    </nav>
  );
}

export function LanguageSwitcher() {
  return (
    // useSearchParams needs a Suspense boundary; the fallback keeps the layout stable.
    <Suspense fallback={<div className="h-8 w-[4.5rem]" />}>
      <LanguageLinks />
    </Suspense>
  );
}
