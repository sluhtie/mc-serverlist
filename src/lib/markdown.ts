/**
 * Rules for rendering user-written Markdown (server descriptions).
 * Raw HTML is never rendered; only the elements below survive, everything else is unwrapped to text.
 */
export const MARKDOWN_ELEMENTS = [
  "p",
  "br",
  "strong",
  "em",
  "del",
  "a",
  "img",
  "ul",
  "ol",
  "li",
  "input", // GFM task list checkboxes, always rendered disabled
  "blockquote",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
] as const;

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Allow-list for URLs in descriptions. Links may use http(s) or mailto, images only https
 * (no mixed content). Relative URLs and anything else (javascript:, data:, …) are dropped.
 */
export function safeMarkdownUrl(url: string, key: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (key === "src") return parsed.protocol === "https:" ? parsed.href : null;
  return LINK_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
}
