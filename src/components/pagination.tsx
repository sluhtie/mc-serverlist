import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  params,
  basePath = "/",
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="mt-6 flex items-center justify-center gap-2 text-sm" aria-label="Seiten">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary">
          ← Zurück
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-40">← Zurück</span>
      )}
      <span className="px-3 text-zinc-400">
        Seite {page} von {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="btn-secondary">
          Weiter →
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-40">Weiter →</span>
      )}
    </nav>
  );
}
