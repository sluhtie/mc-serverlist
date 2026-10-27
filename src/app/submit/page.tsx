import { ServerForm } from "@/components/forms/server-form";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Server eintragen" };

export default async function SubmitPage() {
  await requireUser("/submit");
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Server eintragen</h1>
        <p className="mt-2 text-zinc-400">
          Trage deinen Minecraft Server kostenlos ein. Status und Spielerzahlen werden automatisch
          alle paar Minuten aktualisiert.
        </p>
      </div>
      <ServerForm />
    </div>
  );
}
