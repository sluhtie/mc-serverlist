import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerForm } from "@/components/forms/server-form";
import { requireUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getServerBySlug } from "@/lib/servers";
import { deleteServer } from "@/server/actions/servers";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.edit, robots: NOINDEX };
}

export default async function EditServerPage({ params }: PageProps<"/server/[slug]/edit">) {
  const { slug } = await params;
  const user = await requireUser(`/server/${slug}/edit`);
  const [result, t] = await Promise.all([getServerBySlug(slug), getDictionary()]);
  if (!result) notFound();
  const { server } = result;
  if (server.ownerId !== user.id && user.role !== "admin") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.submit.editTitle(server.name)}</h1>
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
      <form
        action={deleteServer}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-6"
      >
        <input type="hidden" name="id" value={server.id} />
        <div>
          <h2 className="font-display font-bold text-danger">{t.submit.deleteTitle}</h2>
          <p className="text-sm text-muted">{t.submit.deleteText}</p>
        </div>
        <button className="btn-danger">{t.submit.delete}</button>
      </form>
    </div>
  );
}
