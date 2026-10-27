import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GamemodeGrid } from "@/components/gamemode-grid";
import { SectionHeading } from "@/components/section-heading";
import { TAGS } from "@/lib/constants";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { getTagCounts } from "@/lib/servers";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return pageMetadata({
    locale,
    title: t.meta.gamemodesTitle,
    description: t.meta.gamemodesDescription,
    path: "/spielmodus",
  });
}

export default async function GamemodesPage() {
  const [rows, t] = await Promise.all([getTagCounts(TAGS.length), getDictionary()]);
  const counts = new Map(rows.map((r) => [r.tag, r.count]));
  // Most popular first, the rest in their predefined order.
  const items = TAGS.map((tag) => ({ tag, count: counts.get(tag) ?? 0 })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { name: t.common.home, path: "/" },
          { name: t.nav.gamemodes, path: "/spielmodus" },
        ]}
      />
      <header className="max-w-3xl">
        <SectionHeading as="h1" eyebrow={t.nav.gamemodes} title={t.gamemodes.title} subtitle={t.gamemodes.intro} />
      </header>
      <GamemodeGrid items={items} />
    </div>
  );
}
