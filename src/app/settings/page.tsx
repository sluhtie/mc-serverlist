import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { ChangePasswordForm } from "@/components/forms/auth-forms";
import {
  ChangeEmailForm,
  DisableTwoFactorForm,
  EnableTwoFactorForm,
  RegenerateCodesForm,
  ResendVerificationForm,
} from "@/components/forms/settings-forms";
import { KeyIcon, MailIcon, ShieldIcon, SmartphoneIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { decryptSecret } from "@/lib/auth/crypto";
import { requireUser } from "@/lib/auth/session";
import { formatSecret, otpauthUri } from "@/lib/auth/totp";
import { remainingRecoveryCodes } from "@/lib/auth/two-factor";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/server";
import { NOINDEX } from "@/lib/seo";
import { cancelTotpSetup, startTotpSetup } from "@/server/actions/account";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.settings, robots: NOINDEX };
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`tag ${ok ? "border-brand-500/30 bg-brand-500/10 text-ok" : "border-amber-500/30 bg-amber-500/10 text-warn"}`}
    >
      {children}
    </span>
  );
}

function Section({ id, icon, title, aside, children }: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="card scroll-mt-24 space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          {icon} {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const session = await requireUser("/settings");
  const t = await getDictionary();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.id)).limit(1);
  const twoFactorOn = user.totpEnabledAt !== null;
  const setupPending = !twoFactorOn && user.totpSecret !== null;

  let setup: { qr: string; secret: string } | null = null;
  if (setupPending && user.totpSecret) {
    const secret = decryptSecret(user.totpSecret);
    const uri = otpauthUri(secret, user.email, env.siteName);
    setup = { qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }), secret: formatSecret(secret) };
  }
  const codesLeft = twoFactorOn ? await remainingRecoveryCodes(user.id) : 0;
  const iconClass = "h-5 w-5 text-accent";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionHeading as="h1" title={t.settings.title} subtitle={t.settings.subtitle} />

      <Section
        icon={<MailIcon className={iconClass} />}
        title={t.settings.email}
        aside={<Badge ok={session.emailVerified}>{session.emailVerified ? t.settings.verified : t.settings.unverified}</Badge>}
      >
        <p className="font-mono text-sm">{user.email}</p>
        {!session.emailVerified && (
          <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-muted">{t.settings.verifyBannerText(user.email)}</p>
            <ResendVerificationForm />
          </div>
        )}
        <details className="group">
          <summary className="link cursor-pointer text-sm font-medium">{t.settings.changeEmail}</summary>
          <div className="pt-4">
            <ChangeEmailForm />
          </div>
        </details>
      </Section>

      <Section icon={<KeyIcon className={iconClass} />} title={t.settings.password}>
        <p className="text-sm text-muted">{t.settings.passwordHint}</p>
        <ChangePasswordForm />
      </Section>

      <Section
        id="2fa"
        icon={<ShieldIcon className={iconClass} />}
        title={t.settings.twoFactor}
        aside={<Badge ok={twoFactorOn}>{twoFactorOn ? t.settings.on : t.settings.off}</Badge>}
      >
        <p className="text-sm text-muted">{t.settings.twoFactorIntro}</p>

        {twoFactorOn && (
          <>
            <p className="flex items-center gap-2 text-sm">
              <SmartphoneIcon className="h-4 w-4 text-accent" /> {t.settings.recoveryLeft(codesLeft)}
            </p>
            <details>
              <summary className="link cursor-pointer text-sm font-medium">{t.settings.regenerate}</summary>
              <div className="pt-4">
                <RegenerateCodesForm />
              </div>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-danger">{t.settings.disable}</summary>
              <div className="pt-4">
                <DisableTwoFactorForm />
              </div>
            </details>
          </>
        )}

        {setup && (
          <div className="space-y-4">
            <EnableTwoFactorForm qr={setup.qr} secret={setup.secret} />
            <form action={cancelTotpSetup}>
              <button className="btn-ghost text-sm text-muted">{t.settings.cancel}</button>
            </form>
          </div>
        )}

        {!twoFactorOn && !setup && (
          <form action={startTotpSetup}>
            <button className="btn-primary">
              <ShieldIcon /> {t.settings.setup}
            </button>
          </form>
        )}
      </Section>
    </div>
  );
}
