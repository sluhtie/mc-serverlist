"use client";

import { useActionState } from "react";
import { REPORT_REASONS } from "@/lib/constants";
import type { FormState } from "@/lib/form";
import { reportServer } from "@/server/actions/servers";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function ReportForm({ serverId }: { serverId: string }) {
  const [state, action, pending] = useActionState(reportServer, initial);
  if (state.success) return <FormMessage state={state} />;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">Server melden</summary>
      <form action={action} className="mt-3 space-y-3">
        <FormMessage state={state} />
        <input type="hidden" name="serverId" value={serverId} />
        <select name="reason" className="input" defaultValue="">
          <option value="" disabled>
            Grund wählen…
          </option>
          {Object.entries(REPORT_REASONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError state={state} name="reason" />
        <textarea name="message" rows={3} maxLength={1000} placeholder="Details (optional)" className="input" />
        <button className="btn-secondary" disabled={pending}>
          Meldung senden
        </button>
      </form>
    </details>
  );
}
