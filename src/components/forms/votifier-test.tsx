"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/form";
import { useT } from "@/lib/i18n/client";
import { testVotifier } from "@/server/actions/votes";
import { FormMessage } from "./form-message";

/**
 * Lives inside the server form and sends whatever is typed there right now, so owners can
 * test before saving. A nested <form> is not allowed, hence a plain button.
 */
export function VotifierTest() {
  const t = useT();
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3 border-t border-line pt-4 sm:col-span-3">
      <div>
        <p className="font-display font-bold">{t.votifierTest.title}</p>
        <p className="text-xs text-subtle">{t.votifierTest.hint}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <label className="label" htmlFor="votifierTestName">
            {t.votifierTest.name}
          </label>
          <input
            id="votifierTestName"
            name="votifierTestName"
            placeholder={t.votifierTest.namePlaceholder}
            maxLength={16}
            className="input font-mono"
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className="btn-secondary px-4 py-2.5"
          disabled={pending}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            const formData = new FormData(form);
            startTransition(async () => setState(await testVotifier(formData)));
          }}
        >
          {pending ? t.votifierTest.sending : t.votifierTest.button}
        </button>
      </div>
      <div aria-live="polite">
        <FormMessage state={state} />
      </div>
    </div>
  );
}
