"use client";

import Link from "@/components/link";
import { useT } from "@/lib/i18n/client";
import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import {
  changePassword,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  verifyLoginChallenge,
} from "@/server/actions/auth";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function LoginForm({ next, notice }: { next?: string; notice?: FormState }) {
  const t = useT();
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state.error || !notice ? state : notice} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="identifier">
          {t.auth.identifier}
        </label>
        <input id="identifier" name="identifier" className="input" autoComplete="username" required />
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label className="label" htmlFor="password">
            {t.auth.password}
          </label>
          <Link href="/forgot-password" className="link text-xs">
            {t.auth.forgotPassword}
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? t.auth.loggingIn : t.auth.login}
      </button>
      <p className="text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="link">
          {t.auth.register}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(register, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">
          {t.auth.email}
        </label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label className="label" htmlFor="username">
          {t.auth.username}
        </label>
        <input id="username" name="username" className="input" autoComplete="username" required />
        <FieldError state={state} name="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError state={state} name="password" />
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? t.auth.creating : t.auth.create}
      </button>
      <p className="text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="link">
          {t.auth.login}
        </Link>
      </p>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="current">
          {t.auth.currentPassword}
        </label>
        <input id="current" name="current" type="password" className="input" autoComplete="current-password" required />
        <FieldError state={state} name="current" />
      </div>
      <div>
        <label className="label" htmlFor="new-password">
          {t.auth.newPassword}
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError state={state} name="password" />
      </div>
      <button className="btn-secondary" disabled={pending}>
        {t.auth.changePassword}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">
          {t.auth.email}
        </label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        <FieldError state={state} name="email" />
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? t.auth.sending : t.auth.sendResetLink}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="link">
          {t.auth.backToLogin}
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(resetPassword, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="new-password">
          {t.auth.newPassword}
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
        />
        <FieldError state={state} name="password" />
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? t.auth.saving : t.auth.savePassword}
      </button>
    </form>
  );
}

export function TwoFactorLoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(verifyLoginChallenge, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="code">
          {t.auth.code}
        </label>
        <input
          id="code"
          name="code"
          className="input text-center font-mono text-lg tracking-[0.3em]"
          autoComplete="one-time-code"
          maxLength={11}
          placeholder="123456"
          required
          autoFocus
        />
        <FieldError state={state} name="code" />
        <p className="mt-2 text-xs text-subtle">{t.auth.codeHint}</p>
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? t.auth.verifying : t.auth.verify}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="link">
          {t.auth.backToLogin}
        </Link>
      </p>
    </form>
  );
}
