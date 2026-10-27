import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import Link from "@/components/link";
import { getDictionary } from "@/lib/i18n/server";

export async function Pagination({
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
  const t = await getDictionary();
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label={t.common.pages}>
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary">
          <ArrowLeftIcon /> {t.common.prev}
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-40">
          <ArrowLeftIcon /> {t.common.prev}
        </span>
      )}
      <span className="rounded-xl border border-line bg-surface px-4 py-2 font-pixel text-muted">
        {t.common.pageOf(page, pageCount)}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="btn-secondary">
          {t.common.next} <ArrowRightIcon />
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-40">
          {t.common.next} <ArrowRightIcon />
        </span>
      )}
    </nav>
  );
}
