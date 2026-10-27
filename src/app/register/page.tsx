import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, localRedirect } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.register, robots: NOINDEX };
}

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  if (await getCurrentUser()) await localRedirect("/account");
  const t = await getDictionary();
  return (
    <AuthShell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <RegisterForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
