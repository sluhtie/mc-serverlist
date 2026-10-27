"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { useT } from "@/lib/i18n/client";

export function CopyAddress({
  address,
  large = false,
  compact = false,
}: {
  address: string;
  large?: boolean;
  /** Icon only, for narrow cards where the address needs the room. */
  compact?: boolean;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard can be unavailable (http, permissions); the address stays visible anyway.
        }
      }}
      title={t.common.copyIp}
      className={`group inline-flex max-w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-inset font-mono text-fg transition ${
        copied ? "border-brand-500" : "border-line-strong hover:border-brand-500"
      } ${large ? "px-4 py-2.5 text-base" : "px-3 py-1.5 text-sm"}`}
    >
      <span className="truncate">{address}</span>
      <span
        className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-sans text-xs font-semibold transition ${
          copied ? "bg-brand-500 text-white" : "bg-brand-500/10 text-accent group-hover:bg-brand-500/20"
        }`}
      >
        {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
        <span className={compact ? "sr-only" : undefined}>{copied ? t.common.copied : t.common.copy}</span>
      </span>
    </button>
  );
}
