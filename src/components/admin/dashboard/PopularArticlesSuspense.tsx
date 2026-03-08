import { prisma } from "@/lib/prisma";
import { PopularArticlesWidget } from "@/components/admin/widgets/PopularArticlesWidget";

export async function PopularArticlesSuspense() {
    try {
        const popularArticles = await prisma.article.findMany({
            take: 5,
            orderBy: { views: 'desc' },
            include: { author: { select: { name: true } } }
        });

        return <PopularArticlesWidget articles={popularArticles} />;
    } catch {
        return <PopularArticlesWidget articles={[]} />;
    }
}
