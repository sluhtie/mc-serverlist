"use client";

import Script from "next/script";
import { useActionState } from "react";
import type { FormState } from "@/lib/form";
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
  const [state, action, pending] = useActionState(castVote, initial);

  if (state.success) return <FormMessage state={state} />;

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="serverId" value={serverId} />
      <div>
        <label className="label" htmlFor="username">
          Minecraft-Name
        </label>
        <input
          id="username"
          name="username"
          defaultValue={defaultUsername}
          placeholder="Steve"
          className="input font-mono"
          maxLength={16}
          required
        />
        <FieldError state={state} name="username" />
      </div>
      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" />
        </>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Vote wird gesendet…" : "Jetzt voten"}
      </button>
    </form>
  );
}
