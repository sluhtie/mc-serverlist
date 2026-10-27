"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { changePassword, login, register } from "@/server/actions/auth";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="identifier">
          E-Mail oder Benutzername
        </label>
        <input id="identifier" name="identifier" className="input" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Passwort
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
        {pending ? "Anmelden…" : "Anmelden"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        Noch kein Account?{" "}
        <Link href="/register" className="text-brand-400 hover:underline">
          Registrieren
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">
          E-Mail
        </label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label className="label" htmlFor="username">
          Benutzername
        </label>
        <input id="username" name="username" className="input" autoComplete="username" required />
        <FieldError state={state} name="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Passwort
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
        {pending ? "Account wird erstellt…" : "Account erstellen"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        Schon registriert?{" "}
        <Link href="/login" className="text-brand-400 hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="current">
          Aktuelles Passwort
        </label>
        <input id="current" name="current" type="password" className="input" required />
        <FieldError state={state} name="current" />
      </div>
      <div>
        <label className="label" htmlFor="new-password">
          Neues Passwort
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
        Passwort ändern
      </button>
    </form>
  );
}
