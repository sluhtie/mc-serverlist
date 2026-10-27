import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import Link from "@/components/link";
import { findToken } from "@/lib/auth/tokens";
import { getDictionary } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  // The token sits in the URL, so keep it out of referrers to other sites.
  return { title: (await getDictionary()).meta.resetPassword, robots: NOINDEX, referrer: "no-referrer" };
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const [t, valid] = await Promise.all([getDictionary(), findToken(value, "reset_password")]);

  if (!valid) {
    return (
      <AuthShell title={t.auth.invalidTitle} subtitle={t.errors.linkInvalid}>
        <Link href="/forgot-password" className="btn-primary w-full">
          {t.auth.requestNewLink}
        </Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      <ResetPasswordForm token={value} />
    </AuthShell>
  );
}
