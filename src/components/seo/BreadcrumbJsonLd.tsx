import { JsonLd } from "./JsonLd";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * Renders a BreadcrumbList JSON-LD script for Google Rich Results.
 * Pass an array of breadcrumb items from root to current page.
 * The last item is treated as the current page (no link in schema).
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";

  return (
    <JsonLd
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: index < items.length - 1 ? `${baseUrl}${item.href}` : undefined,
        })),
      }}
    />
  );
}
