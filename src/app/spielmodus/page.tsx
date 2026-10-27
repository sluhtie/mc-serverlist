import { Breadcrumbs } from "@/components/breadcrumbs";
import { GamemodeGrid } from "@/components/gamemode-grid";
import { TAGS } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { getTagCounts } from "@/lib/servers";

export const metadata = pageMetadata({
  title: "Minecraft Spielmodi – Server nach Spielmodus finden",
  description:
    "Alle Minecraft Spielmodi auf einen Blick: Survival, SkyBlock, BedWars, Factions, Prison, Creative und mehr. Finde Server, die zu deinem Spielstil passen.",
  path: "/spielmodus",
});

export default async function GamemodesPage() {
  const counts = new Map((await getTagCounts(TAGS.length)).map((r) => [r.tag, r.count]));
  // Most popular first, the rest in their predefined order.
  const items = TAGS.map((tag) => ({ tag, count: counts.get(tag) ?? 0 })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { name: "Startseite", path: "/" },
          { name: "Spielmodi", path: "/spielmodus" },
        ]}
      />
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Minecraft Server nach Spielmodus</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Egal ob du entspannt bauen, im PvP kämpfen oder mit Freunden überleben willst: Wähle einen
          Spielmodus und finde passende Minecraft Server mit Live-Status und Vote-Ranking.
        </p>
      </header>
      <GamemodeGrid items={items} />
    </div>
  );
}
