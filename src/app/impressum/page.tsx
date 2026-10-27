import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return pageMetadata({
    locale,
    title: t.meta.imprintTitle,
    description: t.meta.imprintDescription,
    path: "/impressum",
  });
}

export default async function ImpressumPage() {
  const t = await getDictionary();
  return (
    <article className="card mx-auto max-w-3xl space-y-4 p-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.legal.imprintTitle}</h1>
      <p className="text-muted">
        {t.legal.imprintText} <code>src/app/impressum/page.tsx</code> {t.legal.imprintSuffix}
      </p>
    </article>
  );
}
