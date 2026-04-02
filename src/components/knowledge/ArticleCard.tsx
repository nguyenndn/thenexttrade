import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, Flame, MessageCircle, ThumbsUp } from "lucide-react";

export interface ArticleCardProps {
    article: {
        id: string;
        slug: string;
        title: string;
        excerpt: string | null;
        thumbnail: string | null;
        createdAt: Date;
        views?: number;
        estimatedTime?: number | null;
        category: { name: string } | null;
        author: { name: string | null; image: string | null } | null;
        _count?: { comments: number; votes?: number };
    };
}

export function ArticleCard({ article }: ArticleCardProps) {
    return (
        <Link
            href={`/articles/${article.slug}`}
            className="group relative bg-white dark:bg-[#1E2028] rounded-xl p-2 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-white/10 flex flex-col"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                {article.thumbnail ? (
                    <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <BookOpen size={48} opacity={0.5} />
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-primary to-[#00A570] shadow-lg shadow-black/20 px-3 py-1.5 rounded-lg text-xs font-black text-white uppercase tracking-wide">
                    {article.category?.name || 'General'}
                </div>
                {/* Read Time Badge */}
                {article.estimatedTime && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                        <Clock size={10} />
                        {article.estimatedTime} min
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-2 pt-3 pb-1 flex flex-col flex-1">
                <h3 className="mt-1 mb-2 text-base font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                </h3>

                {/* Excerpt */}
                <p className={`text-sm line-clamp-2 mb-4 leading-relaxed ${article.excerpt ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 italic'}`}>
                    {article.excerpt || "No description available."}
                </p>

                {/* Footer: Author + Stats */}
                <div className="mt-auto pt-4 pb-1 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                    {/* Author */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 flex-shrink-0">
                            {article.author?.image ? (
                                <Image src={article.author.image} alt={article.author.name || ''} width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                                    {article.author?.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{article.author?.name || 'TheNextTrade'}</span>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                        {article.views !== undefined && (
                            <span className="flex items-center gap-1">
                                <Flame size={15} strokeWidth={2.5} className="text-primary" />
                                {article.views}
                            </span>
                        )}
                        {article._count && (
                            <span className="flex items-center gap-1">
                                <MessageCircle size={15} strokeWidth={2.5} className="text-primary" />
                                {article._count.comments}
                            </span>
                        )}
                        {article._count?.votes !== undefined && article._count.votes > 0 && (
                            <span className="flex items-center gap-1">
                                <ThumbsUp size={15} strokeWidth={2.5} className="text-primary" />
                                {article._count.votes}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
