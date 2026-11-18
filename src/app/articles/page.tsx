import { permanentRedirect } from "next/navigation";

/**
 * The Knowledge base index moved from /articles to /knowledge.
 * Preserve old bookmarks / search-engine links with a permanent redirect.
 */
export default function ArticlesIndexPage() {
    permanentRedirect("/knowledge");
}
