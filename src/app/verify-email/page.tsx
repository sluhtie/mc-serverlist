import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import Link from "@/components/link";
import { getCurrentUser } from "@/lib/auth/session";
import { confirmEmailToken } from "@/lib/auth/verification";
import { getDictionary } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.verifyEmail, robots: NOINDEX, referrer: "no-referrer" };
}

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  // Opening the link is the confirmation; it only proves access to the inbox, so no login needed.
  const result = await confirmEmailToken(typeof token === "string" ? token : "");
  const [t, user] = await Promise.all([getDictionary(), getCurrentUser()]);

  const content = {
    verified: { title: t.auth.verifiedTitle, text: t.auth.verifiedText },
    changed: { title: t.auth.changedTitle, text: t.auth.changedText },
    taken: { title: t.auth.takenTitle, text: t.auth.takenText },
    invalid: { title: t.auth.invalidTitle, text: t.auth.invalidText },
  }[result];

  const action = !user ? (
    <Link href="/login" className="btn-primary w-full">
      {t.auth.toLogin}
    </Link>
  ) : result === "verified" ? (
    <Link href="/submit" className="btn-primary w-full">
      {t.auth.toSubmit}
    </Link>
  ) : (
    <Link href="/settings" className="btn-primary w-full">
      {t.auth.toSettings}
    </Link>
  );

  return (
    <AuthShell title={content.title} subtitle={content.text}>
      {action}
    </AuthShell>
  );
}
