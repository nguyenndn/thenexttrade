
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // Assumes server component usage

interface RelatedArticlesBottomProps {
    categoryId?: string;
    currentArticleId: string;
    initialArticles?: any[];
}

export default async function RelatedArticlesBottom({ categoryId, currentArticleId, initialArticles }: RelatedArticlesBottomProps) {
    const articles = initialArticles || await prisma.article.findMany({
        where: {
            categoryId: categoryId,
            id: { not: currentArticleId },
            status: "PUBLISHED"
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { tags: true }
    });

    if (articles.length === 0) return null;

    return (
        <div className="mt-16 pt-12 border-t border-gray-200 dark:border-white/10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
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
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                            )}
                        </div>

                        <div className="p-4">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-400">
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
