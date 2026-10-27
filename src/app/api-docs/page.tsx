import type { Metadata } from "next";
import { CodeIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { env } from "@/lib/env";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return pageMetadata({ locale, title: t.meta.apiTitle, description: t.meta.apiDescription, path: "/api-docs" });
}

function Endpoint({ title, request, children }: { title: string; request: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3 p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <CodeIcon className="h-4 w-4 text-accent" /> {title}
      </h2>
      <code className="block overflow-x-auto rounded-xl border border-black/40 bg-[#14161a] p-3.5 font-mono text-sm whitespace-nowrap text-zinc-200">
        <span className="mr-2 rounded bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">GET</span>
        {request}
      </code>
      <p className="text-sm text-muted">{children}</p>
    </section>
  );
}

export default async function ApiDocsPage() {
  const t = await getDictionary();
  const base = env.appUrl;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading as="h1" eyebrow="API" title={t.api.title} subtitle={t.api.intro} />
      <Endpoint title={t.api.statusTitle} request={`${base}/api/v1/servers/<slug>`}>
        {t.api.statusText}
      </Endpoint>
      <Endpoint title={t.api.checkTitle} request={`${base}/api/v1/votes/check?server=<slug>&username=<name>`}>
        {t.api.checkBefore} <code className="font-mono text-fg">{`{ "voted": true, "votedAt": "…" }`}</code>{" "}
        {t.api.checkAfter}
      </Endpoint>
      <Endpoint title={t.api.headTitle} request={`${base}/api/skins/<name>?size=64`}>
        {t.api.headBefore} <code className="font-mono text-fg">size</code> {t.api.headAfter}
      </Endpoint>
    </div>
  );
}
