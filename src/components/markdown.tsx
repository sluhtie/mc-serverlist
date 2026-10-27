import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { MARKDOWN_ELEMENTS, safeMarkdownUrl } from "@/lib/markdown";

// Single line breaks are kept (remark-breaks): descriptions used to be plain text with line breaks.
// Headings start one level below the page's section headings, so they are shifted down.
const components: Components = {
  h1: ({ children }) => <h3 className="mt-6 mb-3 text-xl font-display font-bold text-fg first:mt-0">{children}</h3>,
  h2: ({ children }) => <h4 className="mt-6 mb-3 text-lg font-display font-bold text-fg first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mt-5 mb-2 text-base font-semibold text-fg first:mt-0">{children}</h5>,
  h4: ({ children }) => <h6 className="mt-4 mb-2 font-semibold text-fg first:mt-0">{children}</h6>,
  h5: ({ children }) => <h6 className="mt-4 mb-2 font-semibold text-fg first:mt-0">{children}</h6>,
  h6: ({ children }) => <h6 className="mt-4 mb-2 font-semibold text-fg-soft first:mt-0">{children}</h6>,
  p: ({ children }) => <p className="my-3 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  a: ({ href, children }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="text-accent underline decoration-brand-500/40 underline-offset-2 hover:decoration-brand-500"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  img: ({ src, alt }) =>
    typeof src === "string" && src ? (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied hosts are arbitrary
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="my-3 inline-block max-h-[32rem] max-w-full rounded-lg"
      />
    ) : null,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 marker:text-subtle">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-subtle">{children}</ol>,
  li: ({ children, className }) => (
    <li className={className === "task-list-item" ? "-ml-6 list-none" : undefined}>{children}</li>
  ),
  input: ({ checked }) => (
    <input type="checkbox" checked={Boolean(checked)} disabled readOnly className="checkbox mr-2 inline-grid align-[-2px]" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-r-lg border-l-4 border-brand-600/60 bg-surface-2 py-1 pl-4 text-muted">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-line bg-inset p-3 font-mono text-sm text-fg [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-sm">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] text-fg">{children}</code>
  ),
  hr: () => <hr className="my-6 border-line" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th style={style} className="border-b border-line-strong px-3 py-2 font-semibold text-fg">
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td style={style} className="border-b border-line px-3 py-2">
      {children}
    </td>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  del: ({ children }) => <del className="text-subtle">{children}</del>,
};

/** Renders user-written Markdown safely: no raw HTML, allow-listed elements and URLs only. */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`break-words text-fg-soft ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        allowedElements={MARKDOWN_ELEMENTS}
        unwrapDisallowed
        urlTransform={safeMarkdownUrl}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
