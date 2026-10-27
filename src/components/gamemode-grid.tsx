import { GamemodeIcon } from "@/components/gamemode-icon";
import Link from "@/components/link";
import { bannerTheme } from "@/lib/banner";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { tagHref, type Tag } from "@/lib/tags";

/** Block-colored backdrop for a game mode icon, shared with the landing page header. */
export function gamemodeBackground(tag: Tag) {
  const { hue } = bannerTheme(tag);
  return `linear-gradient(140deg, hsl(${hue} 45% 34%), hsl(${(hue + 30) % 360} 45% 14%))`;
}

/** Tiles linking to the game mode landing pages. */
export async function GamemodeGrid({ items }: { items: { tag: Tag; count: number }[] }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const numberFormat = new Intl.NumberFormat(INTL_LOCALE[locale]);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(({ tag, count }, i) => (
        <Link
          key={tag}
          href={tagHref(tag)}
          className="card card-hover group flex animate-rise flex-col items-start gap-3 p-4"
          style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
        >
          <span
            className="grid h-12 w-12 place-items-center rounded-xl shadow-md ring-1 ring-black/10 transition duration-300 group-hover:-rotate-6 group-hover:scale-110"
            style={{
              background: gamemodeBackground(tag),
              boxShadow: "inset 0 2px 0 rgb(255 255 255 / .18), inset 0 -3px 0 rgb(0 0 0 / .25)",
            }}
          >
            <GamemodeIcon tag={tag} className="h-8 w-8 drop-shadow" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display font-bold transition group-hover:text-accent">{tag}</span>
            <span className="text-xs text-subtle">{t.common.serverCount(numberFormat.format(count), count)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
