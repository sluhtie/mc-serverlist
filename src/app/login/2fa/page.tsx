import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthShell } from "@/components/auth-shell";
import { TwoFactorLoginForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { findToken } from "@/lib/auth/tokens";
import { CHALLENGE_COOKIE } from "@/lib/auth/verification";
import { getDictionary, localRedirect } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.twoFactor, robots: NOINDEX };
}

export default async function TwoFactorPage({ searchParams }: PageProps<"/login/2fa">) {
  const { next } = await searchParams;
  if (await getCurrentUser()) await localRedirect("/account");
  // Only reachable right after a correct password.
  const token = (await cookies()).get(CHALLENGE_COOKIE)?.value ?? "";
  if (!(await findToken(token, "login_2fa"))) await localRedirect("/login?expired=1");
  const t = await getDictionary();
  return (
    <AuthShell title={t.auth.twoFactorTitle} subtitle={t.auth.twoFactorSubtitle}>
      <TwoFactorLoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
