"use client";

import { useActionState } from "react";
import { FlagIcon } from "@/components/icons";
import { REPORT_REASONS } from "@/lib/constants";
import { useT } from "@/lib/i18n/client";
import type { FormState } from "@/lib/form";
import { reportServer } from "@/server/actions/servers";
import { Select } from "@/components/ui/select";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function ReportForm({ serverId }: { serverId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(reportServer, initial);
  if (state.success) return <FormMessage state={state} />;
  return (
    <details className="text-sm">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-subtle transition hover:text-fg [&::-webkit-details-marker]:hidden">
        <FlagIcon className="h-3.5 w-3.5" /> {t.server.reportSummary}
      </summary>
      <form action={action} className="card mt-3 space-y-3 p-4">
        <FormMessage state={state} />
        <input type="hidden" name="serverId" value={serverId} />
        <Select
          name="reason"
          aria-label={t.server.reportReason}
          placeholder={t.server.reportChoose}
          options={REPORT_REASONS.map((value) => ({ value, label: t.reportReasons[value] }))}
        />
        <FieldError state={state} name="reason" />
        <textarea name="message" rows={3} maxLength={1000} placeholder={t.server.reportDetails} className="input" />
        <button className="btn-secondary" disabled={pending}>
          {t.server.reportSend}
        </button>
      </form>
    </details>
  );
}
