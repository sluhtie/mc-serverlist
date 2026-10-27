/**
 * Turns a Minecraft text component (JSON) or a legacy "§"-formatted string
 * into flat, styled segments that React can render safely.
 */

export type MotdSegment = {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
};

const COLORS: Record<string, string> = {
  black: "#000000",
  dark_blue: "#0000AA",
  dark_green: "#00AA00",
  dark_aqua: "#00AAAA",
  dark_red: "#AA0000",
  dark_purple: "#AA00AA",
  gold: "#FFAA00",
  gray: "#AAAAAA",
  dark_gray: "#555555",
  blue: "#5555FF",
  green: "#55FF55",
  aqua: "#55FFFF",
  red: "#FF5555",
  light_purple: "#FF55FF",
  yellow: "#FFFF55",
  white: "#FFFFFF",
};

const LEGACY_CODES: Record<string, string> = {
  "0": "black",
  "1": "dark_blue",
  "2": "dark_green",
  "3": "dark_aqua",
  "4": "dark_red",
  "5": "dark_purple",
  "6": "gold",
  "7": "gray",
  "8": "dark_gray",
  "9": "blue",
  a: "green",
  b: "aqua",
  c: "red",
  d: "light_purple",
  e: "yellow",
  f: "white",
};

type Style = Omit<MotdSegment, "text">;

function resolveColor(color: unknown): string | undefined {
  if (typeof color !== "string") return undefined;
  if (COLORS[color]) return COLORS[color];
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return undefined;
}

function parseLegacy(text: string, base: Style, out: MotdSegment[]) {
  let style: Style = { ...base };
  let current = "";
  const push = () => {
    if (current) out.push({ text: current, ...style });
    current = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ((ch === "§" || ch === "&") && i + 1 < text.length) {
      const code = text[i + 1].toLowerCase();
      if (LEGACY_CODES[code]) {
        push();
        style = { ...base, color: COLORS[LEGACY_CODES[code]] };
        i++;
        continue;
      }
      if ("klmnor".includes(code)) {
        push();
        if (code === "l") style = { ...style, bold: true };
        if (code === "m") style = { ...style, strikethrough: true };
        if (code === "n") style = { ...style, underlined: true };
        if (code === "o") style = { ...style, italic: true };
        if (code === "r") style = { ...base };
        i++;
        continue;
      }
    }
    current += ch;
  }
  push();
}

function walk(node: unknown, inherited: Style, out: MotdSegment[], depth: number) {
  if (depth > 32 || node === null || node === undefined) return;
  if (typeof node === "string" || typeof node === "number") {
    parseLegacy(String(node), inherited, out);
    return;
  }
  if (Array.isArray(node)) {
    // In arrays the first element is the parent of the following ones.
    const [first, ...rest] = node;
    walk(first, inherited, out, depth + 1);
    const parentStyle =
      first && typeof first === "object" && !Array.isArray(first)
        ? mergeStyle(inherited, first as Record<string, unknown>)
        : inherited;
    for (const child of rest) walk(child, parentStyle, out, depth + 1);
    return;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const style = mergeStyle(inherited, obj);
    if (typeof obj.text === "string" || typeof obj.text === "number") {
      parseLegacy(String(obj.text), style, out);
    } else if (typeof obj.translate === "string") {
      parseLegacy(obj.translate, style, out);
    }
    if (Array.isArray(obj.extra)) {
      for (const child of obj.extra) walk(child, style, out, depth + 1);
    }
  }
}

function mergeStyle(base: Style, obj: Record<string, unknown>): Style {
  const style: Style = { ...base };
  const color = resolveColor(obj.color);
  if (color) style.color = color;
  for (const key of ["bold", "italic", "underlined", "strikethrough"] as const) {
    if (typeof obj[key] === "boolean") style[key] = obj[key] as boolean;
  }
  return style;
}

export function parseMotd(motd: unknown): MotdSegment[] {
  let value = motd;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        // Not JSON, treat as legacy text.
      }
    }
  }
  const out: MotdSegment[] = [];
  walk(value, {}, out, 0);
  return out;
}

export function motdToPlainText(motd: unknown): string {
  return parseMotd(motd)
    .map((s) => s.text)
    .join("");
}
