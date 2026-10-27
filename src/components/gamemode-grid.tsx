import Link from "next/link";
import { GamemodeIcon } from "@/components/gamemode-icon";
import { bannerTheme } from "@/lib/banner";
import { tagHref, type Tag } from "@/lib/tags";

const numberFormat = new Intl.NumberFormat("de-DE");

/** Tiles linking to the game mode landing pages. */
export function GamemodeGrid({ items }: { items: { tag: Tag; count: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(({ tag, count }) => {
        const { hue } = bannerTheme(tag);
        return (
          <Link
            key={tag}
            href={tagHref(tag)}
            className="card group flex items-center gap-3 p-3 transition hover:border-zinc-600"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ring-white/10 transition group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, hsl(${hue} 35% 22%), hsl(${hue} 40% 11%))` }}
            >
              <GamemodeIcon tag={tag} className="h-7 w-7 drop-shadow" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold group-hover:text-brand-400">{tag}</span>
              <span className="text-xs text-zinc-500">
                {count === 1 ? "1 Server" : `${numberFormat.format(count)} Server`}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
