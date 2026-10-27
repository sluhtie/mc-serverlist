import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return pageMetadata({
    locale,
    title: t.meta.privacyTitle,
    description: t.meta.privacyDescription,
    path: "/datenschutz",
  });
}

export default async function DatenschutzPage() {
  const t = await getDictionary();
  return (
    <article className="card mx-auto max-w-3xl space-y-4 p-8 text-fg-soft">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg">{t.legal.privacyTitle}</h1>
      <p>
        {t.legal.privacyPlaceholder} (<code>src/app/datenschutz/page.tsx</code>).
      </p>
      <h2 className="pt-2 font-display text-xl font-bold text-fg">{t.legal.storedTitle}</h2>
      <ul className="list-disc space-y-1.5 pl-6 marker:text-subtle">
        <li>{t.legal.storedAccount}</li>
        <li>
          {t.legal.storedSession} <code>mcsl_session</code>
        </li>
        <li>{t.legal.storedPrefs}</li>
        <li>{t.legal.storedVotes}</li>
        <li>{t.legal.storedTurnstile}</li>
      </ul>
    </article>
  );
}
