import { jsonLd } from "@/lib/seo";

/**
 * Structured data for search engines (schema.org). A script body cannot be rendered as text,
 * so this is the one place that uses dangerouslySetInnerHTML; `jsonLd` escapes the payload.
 */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
