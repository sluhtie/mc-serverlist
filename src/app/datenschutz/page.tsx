import type { Metadata } from "next";
import { LegalSections, OperatorAddress, OperatorContact } from "@/components/legal-sections";
import { env } from "@/lib/env";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { isLegalOperatorComplete } from "@/lib/legal";
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
  const operator = env.legal;
  const sections = t.legal.privacySections({
    siteName: env.siteName,
    email: operator.email,
    hosting: operator.hosting,
    mailProvider: operator.mailProvider,
    turnstile: Boolean(env.turnstileSiteKey),
  });
  return (
    <article className="card mx-auto max-w-3xl space-y-4 p-8 text-fg-soft">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg">{t.legal.privacyTitle}</h1>
      {!isLegalOperatorComplete(operator) && (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-warn">
          {t.legal.missingOperator}
        </p>
      )}
      <p>{t.legal.privacyIntro(env.siteName)}</p>

      <section className="space-y-3">
        <h2 className="pt-2 font-display text-xl font-bold text-fg">{t.legal.controllerTitle}</h2>
        <OperatorAddress name={operator.name} address={operator.address} />
        {(operator.phone || operator.email) && (
          <OperatorContact phone={operator.phone} email={operator.email} labels={t.legal} />
        )}
      </section>

      <LegalSections sections={sections} />
      <p className="pt-2 text-sm text-subtle">{t.legal.updated}</p>
    </article>
  );
}
