import type { Metadata } from "next";
import { ServerForm } from "@/components/forms/server-form";
import { SectionHeading } from "@/components/section-heading";
import { VerifyEmailNotice } from "@/components/verify-email-notice";
import { requireUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

// Visitors without an account are redirected to the login, so there is nothing to index.
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.submit, robots: NOINDEX };
}

export default async function SubmitPage() {
  const user = await requireUser("/submit");
  const t = await getDictionary();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeading as="h1" eyebrow={t.home.ownerEyebrow} title={t.submit.title} subtitle={t.submit.intro} />
      {/* The action checks this too; the notice just saves filling in the form for nothing. */}
      {user.emailVerified ? <ServerForm /> : <VerifyEmailNotice email={user.email} />}
    </div>
  );
}
