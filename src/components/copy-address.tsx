"use client";

import { useState } from "react";

export function CopyAddress({ address, large = false }: { address: string; large?: boolean }) {
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
      title="IP kopieren"
      className={`group inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 font-mono text-zinc-200 hover:border-brand-500 ${
        large ? "px-4 py-2.5 text-base" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span className="truncate">{address}</span>
      <span className="shrink-0 text-xs font-sans font-semibold text-brand-400">
        {copied ? "Kopiert!" : "Kopieren"}
      </span>
    </button>
  );
}
