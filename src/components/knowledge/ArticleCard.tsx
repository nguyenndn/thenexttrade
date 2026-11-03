import Link from "next/link";
import Image from "next/image";
import { SafeImage } from "@/components/ui/SafeImage";
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
            className="group relative bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 hover:border-amber-500/35 dark:hover:border-gold/30 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-[#151925] border border-gray-200/60 dark:border-white/5">
                {article.thumbnail ? (
                    <SafeImage
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#151925] text-gray-400 dark:text-gray-500">
                        <BookOpen size={40} strokeWidth={1.75} />
                    </div>
                )}
                <div className="absolute top-2.5 left-2.5 bg-gold shadow-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-wider">
                    {article.category?.name || "General"}
                </div>
                {/* Read Time Badge */}
                {article.estimatedTime && (
                    <div className="absolute bottom-2.5 right-2.5 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] tabular-nums font-bold text-white flex items-center gap-1">
                        <Clock size={11} />
                        <span>{article.estimatedTime} min</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-1 pt-3.5 pb-0.5 flex flex-col flex-1">
                <h3 className="mb-2 text-base font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-gold transition-colors line-clamp-2">
                    {article.title}
                </h3>

                {/* Excerpt */}
                <p
                    className={`text-sm line-clamp-2 mb-4 leading-relaxed ${
                        article.excerpt
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-gray-400 dark:text-gray-500"
                    }`}
                >
                    {article.excerpt || "No description available."}
                </p>

                {/* Footer: Author + Stats */}
                <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
                    {/* Author */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-[#151925] border border-gray-200 dark:border-white/10 flex-shrink-0">
                            {article.author?.image ? (
                                <Image
                                    src={article.author.image}
                                    alt={article.author.name || ""}
                                    width={32}
                                    height={32}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                    {article.author?.name?.charAt(0) || "T"}
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                            {article.author?.name || "TheNextTrade"}
                        </span>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs tabular-nums font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                        {article.views !== undefined && (
                            <span className="flex items-center gap-1" title="Views">
                                <Flame
                                    size={14}
                                    strokeWidth={2}
                                    className="text-amber-500 dark:text-gold"
                                />
                                <span>{article.views.toLocaleString()}</span>
                            </span>
                        )}
                        {article._count && (
                            <span className="flex items-center gap-1" title="Comments">
                                <MessageCircle
                                    size={14}
                                    strokeWidth={2}
                                    className="text-amber-500 dark:text-gold"
                                />
                                <span>{article._count.comments}</span>
                            </span>
                        )}
                        {article._count?.votes !== undefined &&
                            article._count.votes > 0 && (
                                <span className="flex items-center gap-1" title="Upvotes">
                                    <ThumbsUp
                                        size={14}
                                        strokeWidth={2}
                                        className="text-amber-500 dark:text-gold"
                                    />
                                    <span>{article._count.votes}</span>
                                </span>
                            )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
