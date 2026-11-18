import { permanentRedirect } from "next/navigation";

/**
 * Redirect /articles/tags/[slug] → /knowledge?tag=[slug]
 * Knowledge page already handles tag filtering via query params.
 */
export default async function TagPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    permanentRedirect(`/knowledge?tag=${encodeURIComponent(slug)}`);
}
