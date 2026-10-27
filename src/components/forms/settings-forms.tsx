"use client";

import { useActionState, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import Link from "@/components/link";
import type { FormState } from "@/lib/form";
import { useT } from "@/lib/i18n/client";
import {
  changeEmail,
  disableTotp,
  enableTotp,
  regenerateRecoveryCodes,
  resendVerification,
  type TwoFactorState,
} from "@/server/actions/account";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function ResendVerificationForm() {
  const t = useT();
  const [state, action, pending] = useActionState(resendVerification, initial);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <button className="btn-secondary" disabled={pending}>
        {pending ? t.auth.sending : t.settings.resend}
      </button>
    </form>
  );
}

export function ChangeEmailForm() {
  const t = useT();
  const [state, action, pending] = useActionState(changeEmail, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="new-email">
          {t.settings.newEmail}
        </label>
        <input id="new-email" name="email" type="email" className="input" autoComplete="email" required />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label className="label" htmlFor="email-current">
          {t.auth.currentPassword}
        </label>
        <input
          id="email-current"
          name="current"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
        <FieldError state={state} name="current" />
      </div>
      <p className="text-xs text-subtle">{t.settings.changeEmailHint}</p>
      <button className="btn-secondary" disabled={pending}>
        {pending ? t.auth.sending : t.settings.changeEmail}
      </button>
    </form>
  );
}

function CodeInput({ id, label, recovery = false }: { id: string; label: string; recovery?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name="code"
        className="input max-w-56 font-mono tracking-widest"
        autoComplete="one-time-code"
        inputMode={recovery ? "text" : "numeric"}
        maxLength={recovery ? 11 : 6}
        placeholder="123456"
        required
      />
    </div>
  );
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4 rounded-2xl border border-brand-500/40 bg-brand-500/5 p-5">
      <div>
        <h3 className="font-display font-bold">{t.settings.recoveryTitle}</h3>
        <p className="mt-1 text-sm text-muted">{t.settings.recoveryIntro}</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="rounded-lg border border-line bg-inset px-3 py-1.5 text-center">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(codes.join("\n"));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // Clipboard can be unavailable; the codes stay visible for copying by hand.
            }
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? t.common.copied : t.settings.copyCodes}
        </button>
        {/* A fresh navigation re-renders the settings page with 2FA shown as active. */}
        <Link href="/settings" className="btn-primary">
          {t.settings.done}
        </Link>
      </div>
    </div>
  );
}

/** QR code and confirmation step; swaps to the recovery codes once 2FA is on. */
export function EnableTwoFactorForm({ qr, secret }: { qr: string; secret: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(enableTotp, initial as TwoFactorState);
  if (state.recoveryCodes) {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <RecoveryCodes codes={state.recoveryCodes} />
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <p className="text-sm font-medium">{t.settings.scanStep}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- QR code rendered on the server as a data URL */}
      <img src={qr} alt={t.settings.qrAlt} width={220} height={220} className="rounded-xl border border-line bg-white p-2" />
      <p className="text-xs text-subtle">{t.settings.manualKey}</p>
      <code className="block w-fit rounded-lg border border-line bg-inset px-3 py-1.5 font-mono text-sm break-all select-all">
        {secret}
      </code>
      <p className="pt-2 text-sm font-medium">{t.settings.codeStep}</p>
      <CodeInput id="setup-code" label={t.settings.authCode} />
      <FieldError state={state} name="code" />
      <button className="btn-primary" disabled={pending}>
        {pending ? t.auth.verifying : t.settings.activate}
      </button>
    </form>
  );
}

export function RegenerateCodesForm() {
  const t = useT();
  const [state, action, pending] = useActionState(regenerateRecoveryCodes, initial as TwoFactorState);
  if (state.recoveryCodes) return <RecoveryCodes codes={state.recoveryCodes} />;
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <CodeInput id="regen-code" label={t.settings.authCode} />
      <FieldError state={state} name="code" />
      <p className="text-xs text-subtle">{t.settings.regenerateHint}</p>
      <button className="btn-secondary" disabled={pending}>
        {t.settings.regenerate}
      </button>
    </form>
  );
}

export function DisableTwoFactorForm() {
  const t = useT();
  const [state, action, pending] = useActionState(disableTotp, initial);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <p className="text-xs text-subtle">{t.settings.disableHint}</p>
      <div>
        <label className="label" htmlFor="disable-current">
          {t.auth.currentPassword}
        </label>
        <input
          id="disable-current"
          name="current"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
        <FieldError state={state} name="current" />
      </div>
      <CodeInput id="disable-code" label={t.settings.codeOrRecovery} recovery />
      <FieldError state={state} name="code" />
      <button className="btn-danger" disabled={pending}>
        {t.settings.disable}
      </button>
    </form>
  );
}
