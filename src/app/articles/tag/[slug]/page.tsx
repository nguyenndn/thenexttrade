import { permanentRedirect } from "next/navigation";

/**
 * The old sitemap emitted /articles/tag/[slug] (singular) URLs.
 * Redirect to the Knowledge base tag filter to preserve backlinks.
 */
export default async function ArticleTagPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    permanentRedirect(`/knowledge?tag=${encodeURIComponent(slug)}`);
}
