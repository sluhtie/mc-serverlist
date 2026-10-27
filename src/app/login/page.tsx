import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, localRedirect } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.login, robots: NOINDEX };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  if (await getCurrentUser()) await localRedirect("/account");
  const t = await getDictionary();
  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
