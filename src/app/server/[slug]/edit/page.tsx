import { notFound } from "next/navigation";
import { ServerForm } from "@/components/forms/server-form";
import { requireUser } from "@/lib/auth/session";
import { getServerBySlug } from "@/lib/servers";
import { deleteServer } from "@/server/actions/servers";

export const metadata = { title: "Server bearbeiten" };

export default async function EditServerPage({ params }: PageProps<"/server/[slug]/edit">) {
  const { slug } = await params;
  const user = await requireUser(`/server/${slug}/edit`);
  const result = await getServerBySlug(slug);
  if (!result) notFound();
  const { server } = result;
  if (server.ownerId !== user.id && user.role !== "admin") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">{server.name} bearbeiten</h1>
      <ServerForm
        values={{
          id: server.id,
          name: server.name,
          host: server.host,
          port: server.port,
          shortDescription: server.shortDescription,
          description: server.description,
          website: server.website,
          discord: server.discord,
          bannerUrl: server.bannerUrl,
          country: server.country,
          tags: server.tags,
          votifierEnabled: server.votifierEnabled,
          votifierHost: server.votifierHost,
          votifierPort: server.votifierPort,
          votifierProtocol: server.votifierProtocol,
          votifierPublicKey: server.votifierPublicKey,
          votifierToken: server.votifierToken,
        }}
      />
      <form action={deleteServer} className="card flex items-center justify-between gap-4 border-red-500/30 p-6">
        <input type="hidden" name="id" value={server.id} />
        <div>
          <h2 className="font-semibold text-red-300">Server löschen</h2>
          <p className="text-sm text-zinc-400">Entfernt den Server inklusive aller Votes. Nicht umkehrbar.</p>
        </div>
        <button className="btn-danger">Löschen</button>
      </form>
    </div>
  );
}
