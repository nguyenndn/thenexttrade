import { redirect } from "next/navigation";

/**
 * Category browsing moved from /articles/category/[slug] to
 * /knowledge?category=[slug]. Preserve old bookmarks / backlinks.
 */
export default async function ArticleCategoryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    redirect(`/knowledge?category=${encodeURIComponent(slug)}`);
}
