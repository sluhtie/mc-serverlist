"use client";

import Link from "@/components/link";
import { useT } from "@/lib/i18n/client";
import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { changePassword, login, register } from "@/server/actions/auth";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="identifier">
          {t.auth.identifier}
        </label>
        <input id="identifier" name="identifier" className="input" autoComplete="username" required />
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
        <input id="current" name="current" type="password" className="input" required />
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
