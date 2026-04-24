
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // Assumes server component usage

interface RelatedArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    thumbnail: string | null;
    createdAt: Date;
}

interface RelatedArticlesBottomProps {
    categoryId?: string;
    currentArticleId: string;
    initialArticles?: RelatedArticle[];
}

export default async function RelatedArticlesBottom({ categoryId, currentArticleId, initialArticles }: RelatedArticlesBottomProps) {
    // Strategy: fetch more candidates from same category, then supplement with popular articles
    let articles = initialArticles;
    
    if (!articles) {
        // Primary: same category articles
        const sameCategoryArticles = await prisma.article.findMany({
            where: {
                categoryId: categoryId,
                id: { not: currentArticleId },
                status: "PUBLISHED"
            },
            take: 6, // Fetch extra to have fallback
            orderBy: [
                { views: 'desc' },
                { createdAt: 'desc' }
            ],
            select: {
                id: true, title: true, slug: true, excerpt: true,
                thumbnail: true, createdAt: true,
            }
        });

        if (sameCategoryArticles.length >= 3) {
            articles = sameCategoryArticles.slice(0, 3);
        } else {
            // Fallback: supplement with popular articles from other categories
            const existingIds = [currentArticleId, ...sameCategoryArticles.map(a => a.id)];
            const popular = await prisma.article.findMany({
                where: {
                    id: { notIn: existingIds },
                    status: "PUBLISHED"
                },
                take: 3 - sameCategoryArticles.length,
                orderBy: { views: 'desc' },
                select: {
                    id: true, title: true, slug: true, excerpt: true,
                    thumbnail: true, createdAt: true,
                }
            });
            articles = [...sameCategoryArticles, ...popular];
        }
    }

    if (articles.length === 0) return null;

    return (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
            <h3 className="text-xl font-black text-gray-700 dark:text-white mb-6 tracking-tight text-center relative inline-block pl-3 before:content-[''] before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-full mx-auto block w-fit">
                You Might Also Like
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="group bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                            {article.thumbnail ? (
                                <Image
                                    src={article.thumbnail}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                            )}
                        </div>

                        <div className="p-4">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-100 leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500">
                                <Calendar size={12} />
                                <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
