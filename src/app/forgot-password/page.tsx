import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";
import { getDictionary } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.forgotPassword, robots: NOINDEX };
}

export default async function ForgotPasswordPage() {
  const t = await getDictionary();
  return (
    <AuthShell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
