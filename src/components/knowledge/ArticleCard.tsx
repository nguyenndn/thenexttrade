import Link from "next/link";
import Image from "next/image";
import { Clock, TrendingUp, BookOpen } from "lucide-react";

export interface ArticleCardProps {
    article: {
        id: string;
        slug: string;
        title: string;
        excerpt: string | null;
        thumbnail: string | null;
        createdAt: Date;
        category: { name: string } | null;
        author: { name: string | null; image: string | null } | null;
    };
}

export function ArticleCard({ article }: ArticleCardProps) {
    return (
        <Link
            href={`/articles/${article.slug}`}
            className="group flex flex-col rounded-xl overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            {/* Thumbnail */}
            <div className="relative h-56 w-full overflow-hidden">
                {article.thumbnail ? (
                    <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-800 text-gray-400">
                        <BookOpen size={48} opacity={0.5} />
                    </div>
                )}
                {/* Glass Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                        {article.category?.name || 'General'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col relative">
                {/* Decorative gradient glow behind text */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/20 transition-colors"></div>

                <div className="flex items-center gap-2 text-xs font-medium text-primary mb-3">
                    <Clock size={14} />
                    <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <h3 className="text-xl font-bold font-heading text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {article.title}
                </h3>

                <p className={`text-sm line-clamp-3 mb-6 flex-1 leading-relaxed ${article.excerpt ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600 italic'}`}>
                    {article.excerpt || "No description available."}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200/50 dark:border-white/5">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 bg-gray-100 dark:bg-gray-800">
                        {article.author?.image ? (
                            <Image
                                src={article.author.image}
                                alt={article.author.name || 'Author'}
                                fill
                                className="object-cover"
                            />
                        ) : (
                             <div className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-400">
                                {article.author?.name?.charAt(0) || 'G'}
                             </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {article.author?.name || 'TheNextTrade Team'}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Author</span>
                    </div>

                    <div className="ml-auto w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <TrendingUp size={14} />
                    </div>
                </div>
            </div>
        </Link>
    );
}
