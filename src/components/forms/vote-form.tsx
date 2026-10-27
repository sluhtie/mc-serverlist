"use client";

import Script from "next/script";
import { useActionState, useEffect, useState } from "react";
import { PlayerHead } from "@/components/player-head";
import type { FormState } from "@/lib/form";
import { useT } from "@/lib/i18n/client";
import { isValidPlayerName } from "@/lib/minecraft/player";
import { castVote } from "@/server/actions/votes";
import { FieldError, FormMessage } from "./form-message";

const initial: FormState = {};

export function VoteForm({
  serverId,
  turnstileSiteKey,
  defaultUsername,
}: {
  serverId: string;
  turnstileSiteKey: string | null;
  defaultUsername?: string;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(castVote, initial);
  const [name, setName] = useState(defaultUsername ?? "");
  const [previewName, setPreviewName] = useState(name);

  // Debounced, so typing a name does not request a head for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setPreviewName(name.trim()), 400);
    return () => clearTimeout(timer);
  }, [name]);

  const preview = isValidPlayerName(previewName) ? previewName : null;

  if (state.success) {
    return (
      <div className="flex items-center gap-3">
        {preview && <PlayerHead name={preview} size={40} />}
        <div className="flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="serverId" value={serverId} />
      <div>
        <label className="label" htmlFor="username">
          {t.vote.name}
        </label>
        <div className="flex items-center gap-3">
          {preview ? (
            <PlayerHead name={preview} size={44} className="rounded-md ring-1 ring-line" />
          ) : (
            <div aria-hidden className="size-11 shrink-0 rounded-md bg-surface-2 ring-1 ring-line" />
          )}
          <input
            id="username"
            name="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Steve"
            className="input font-mono"
            maxLength={16}
            required
          />
        </div>
        <FieldError state={state} name="username" />
      </div>
      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
        </>
      )}
      <button className="btn-primary w-full py-3 text-base" disabled={pending}>
        {pending ? t.vote.submitting : t.vote.submit}
      </button>
    </form>
  );
}
