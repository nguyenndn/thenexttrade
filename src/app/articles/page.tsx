import { redirect } from "next/navigation";

/**
 * The Knowledge base index moved from /articles to /knowledge.
 * Preserve old bookmarks / search-engine links with a redirect.
 */
export default function ArticlesIndexPage() {
    redirect("/knowledge");
}
