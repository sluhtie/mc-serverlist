"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";

type Props = {
  id: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  rows?: number;
};

/** Textarea with a "Vorschau" tab. The textarea stays mounted so the form always submits its value. */
export function MarkdownEditor({ id, name, defaultValue, maxLength, rows = 10 }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1 text-sm font-medium transition ${
      active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1" role="tablist">
          <button type="button" role="tab" aria-selected={!preview} className={tab(!preview)} onClick={() => setPreview(false)}>
            Schreiben
          </button>
          <button type="button" role="tab" aria-selected={preview} className={tab(preview)} onClick={() => setPreview(true)}>
            Vorschau
          </button>
        </div>
        <span className="text-xs text-zinc-500">
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
        <div className="min-h-40 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-zinc-500">Noch nichts zu sehen.</p>
          )}
        </div>
      )}
      <p className="text-xs text-zinc-500">
        Markdown wird unterstützt: <code>**fett**</code>, <code>*kursiv*</code>, <code># Überschrift</code>,{" "}
        <code>- Liste</code>, <code>[Link](https://…)</code>, <code>![Bild](https://…)</code>, Tabellen. HTML ist nicht erlaubt.
      </p>
    </div>
  );
}
