
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
        <div className="mt-16 pt-16 border-t font-serif border-gray-100 dark:border-white/10">
            <h3 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-8">
                You Might Also Like
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="group flex flex-col"
                    >
                        <div className="relative aspect-[4/3] w-full mb-4 overflow-hidden bg-gray-200 dark:bg-gray-800">
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

                        <div className="flex-1 flex flex-col">
                            <h4 className="font-serif font-bold text-lg text-gray-900 dark:text-gray-100 leading-snug group-hover:text-cyan-600 transition-colors mb-2">
                                {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mt-auto">
                                <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
