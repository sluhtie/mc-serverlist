"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { useT } from "@/lib/i18n/client";

type Props = {
  id: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  rows?: number;
};

/** Textarea with a preview tab. The textarea stays mounted so the form always submits its value. */
export function MarkdownEditor({ id, name, defaultValue, maxLength, rows = 10 }: Props) {
  const t = useT();
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  const tab = (active: boolean) =>
    `cursor-pointer rounded-lg px-3 py-1 text-sm font-medium transition ${
      active ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1" role="tablist">
          <button type="button" role="tab" aria-selected={!preview} className={tab(!preview)} onClick={() => setPreview(false)}>
            {t.markdown.write}
          </button>
          <button type="button" role="tab" aria-selected={preview} className={tab(preview)} onClick={() => setPreview(true)}>
            {t.markdown.preview}
          </button>
        </div>
        <span className="font-pixel text-xs text-subtle">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        hidden={preview}
        className="input font-mono"
      />
      {preview && (
        <div className="min-h-40 rounded-xl border border-line-strong bg-inset px-4 py-3 text-sm">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-subtle">{t.markdown.empty}</p>
          )}
        </div>
      )}
      <p className="text-xs text-subtle">
        {t.markdown.supported} <code>{t.markdown.bold}</code>, <code>{t.markdown.italic}</code>,{" "}
        <code>{t.markdown.heading}</code>, <code>{t.markdown.list}</code>, <code>{t.markdown.link}</code>,{" "}
        <code>{t.markdown.image}</code>, {t.markdown.tables}
      </p>
    </div>
  );
}
