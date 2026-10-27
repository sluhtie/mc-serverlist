import Link from "@/components/link";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail plus the matching BreadcrumbList for search results. */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <nav aria-label={t.common.breadcrumbs} className="text-sm text-muted">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: absoluteUrl(localizePath(item.path, locale)),
          })),
        }}
      />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden className="text-subtle">
                /
              </span>
            )}
            {i === items.length - 1 ? (
              <span aria-current="page" className="font-medium text-fg">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="transition hover:text-fg">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
