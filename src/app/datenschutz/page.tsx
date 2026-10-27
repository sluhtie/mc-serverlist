import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Datenschutz",
  description: "Datenschutzerklärung: welche Daten die Minecraft Serverliste verarbeitet und warum.",
  path: "/datenschutz",
});

export default function DatenschutzPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 text-zinc-300">
      <h1 className="text-2xl font-bold text-zinc-100">Datenschutzerklärung</h1>
      <p>
        Platzhalter: Bitte durch eine vollständige Datenschutzerklärung des Betreibers ersetzen
        (<code>src/app/datenschutz/page.tsx</code>).
      </p>
      <h2 className="text-lg font-semibold text-zinc-100">Was diese Software speichert</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Account-Daten: E-Mail, Benutzername, Passwort-Hash (bcrypt).</li>
        <li>Ein Session-Cookie (<code>mcsl_session</code>), technisch notwendig für den Login.</li>
        <li>
          Votes: Minecraft-Name, Zeitpunkt und ein gesalzener Hash der IP-Adresse zur
          Missbrauchsvermeidung. Die IP selbst wird nicht gespeichert, aber bei aktivem Votifier
          an den jeweiligen Minecraft-Server übermittelt.
        </li>
        <li>Optional Cloudflare Turnstile beim Voten, falls vom Betreiber aktiviert.</li>
      </ul>
    </article>
  );
}
