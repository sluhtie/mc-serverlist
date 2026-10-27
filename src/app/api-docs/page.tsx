import { env } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "API für Minecraft Server Stats und Votes",
  description:
    "Öffentliche JSON-API: Server-Status, Spielerzahlen und Vote-Checks für Plugins, Discord-Bots und Websites abfragen.",
  path: "/api-docs",
});

export default function ApiDocsPage() {
  const base = env.appUrl;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Öffentliche API</h1>
      <p className="text-zinc-400">
        Alle Endpunkte sind ohne Authentifizierung nutzbar und liefern JSON (außer den Spielerköpfen). Bitte cache die
        Antworten und frage nicht öfter als einmal pro Minute ab.
      </p>
      <section className="card space-y-3 p-6">
        <h2 className="font-semibold">Server-Status</h2>
        <code className="block rounded bg-black/60 p-3 font-mono text-sm">GET {base}/api/v1/servers/&lt;slug&gt;</code>
        <p className="text-sm text-zinc-400">Status, Spielerzahlen, Version, MOTD und Votes des laufenden Monats.</p>
      </section>
      <section className="card space-y-3 p-6">
        <h2 className="font-semibold">Vote prüfen</h2>
        <code className="block rounded bg-black/60 p-3 font-mono text-sm">
          GET {base}/api/v1/votes/check?server=&lt;slug&gt;&amp;username=&lt;name&gt;
        </code>
        <p className="text-sm text-zinc-400">
          Gibt <code>{`{ "voted": true, "votedAt": "…" }`}</code> zurück, wenn der Spieler in den
          letzten 24 Stunden gevotet hat. Praktisch für Plugins ohne Votifier.
        </p>
      </section>
      <section className="card space-y-3 p-6">
        <h2 className="font-semibold">Spielerkopf</h2>
        <code className="block rounded bg-black/60 p-3 font-mono text-sm">
          GET {base}/api/skins/&lt;name&gt;?size=64
        </code>
        <p className="text-sm text-zinc-400">
          Kopf des Minecraft-Skins als PNG (inklusive Hut-Ebene), <code>size</code> zwischen 8 und 256
          Pixeln. Für unbekannte Namen gibt es einen Platzhalter-Kopf statt eines Fehlers.
        </p>
      </section>
    </div>
  );
}
