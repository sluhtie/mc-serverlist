import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail plus the matching BreadcrumbList for search results. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Brotkrümelnavigation" className="text-sm text-zinc-400">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.path),
          })),
        }}
      />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-zinc-600">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-zinc-300">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="hover:text-zinc-200">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
