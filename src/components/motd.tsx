import { parseMotd } from "@/lib/minecraft/motd";

export function Motd({ value, className = "" }: { value: string | null; className?: string }) {
  if (!value) return null;
  const segments = parseMotd(value);
  return (
    <div
      className={`whitespace-pre-line rounded-xl border border-black/40 bg-[#1b1b1f] px-4 py-3 font-mono text-sm leading-snug text-zinc-300 shadow-inner ${className}`}
    >
      {segments.map((s, i) => (
        <span
          key={i}
          style={{
            color: s.color,
            fontWeight: s.bold ? 700 : undefined,
            fontStyle: s.italic ? "italic" : undefined,
            textDecoration:
              [s.underlined && "underline", s.strikethrough && "line-through"]
                .filter(Boolean)
                .join(" ") || undefined,
          }}
        >
          {s.text}
        </span>
      ))}
    </div>
  );
}
