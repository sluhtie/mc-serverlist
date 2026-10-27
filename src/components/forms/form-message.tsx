import type { FormState } from "@/lib/form";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-danger">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-xl border border-brand-500/40 bg-brand-500/10 px-3.5 py-2.5 text-sm text-ok">
        {state.success}
      </p>
    );
  }
  return null;
}

export function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state.fieldErrors?.[name];
  return message ? <p className="field-error">{message}</p> : null;
}
