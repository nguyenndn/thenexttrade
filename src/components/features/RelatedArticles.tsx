
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";

export default async function RelatedArticles({
    categoryId,
    currentArticleId
}: {
    categoryId: string;
    currentArticleId: string;
}) {
    const articles = await prisma.article.findMany({
        where: {
            categoryId,
            id: { not: currentArticleId },
            status: "PUBLISHED"
        },
        take: 3,
        orderBy: { createdAt: "desc" }
    });

    if (articles.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-white/10 p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-gray-400 mb-8 pb-4 relative">
                <span className="relative z-10 bg-white dark:bg-slate-900 px-4">Recent Posts</span>
                <span className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 dark:bg-slate-800 -z-0"></span>
            </h3>

            <div className="space-y-6">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="group flex gap-4 items-start"
                    >
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                            {article.thumbnail ? (
                                <Image
                                    src={article.thumbnail}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:opacity-80 transition-opacity"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-cyan-600 transition-colors mb-1">
                                {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-400">
                                <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
