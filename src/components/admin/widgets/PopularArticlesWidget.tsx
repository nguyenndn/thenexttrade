import { TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

interface Article {
    id: string;
    title: string;
    views: number;
    author: {
        name: string | null;
    };
    createdAt: Date;
}

export function PopularArticlesWidget({ articles }: { articles: Article[] }) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Trending News
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                {articles.map((article, index) => (
                    <Link
                        href={`/admin/articles/${article.id}/edit`}
                        key={article.id}
                        className="block p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-emerald-500 transition-colors">
                                {article.title}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full whitespace-nowrap">
                                <Eye size={12} />
                                {article.views.toLocaleString()}
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                            <span>Author: {article.author.name || "Unknown"}</span>
                            <span className="font-mono text-[10px] opacity-70">#{index + 1}</span>
                        </div>
                    </Link>
                ))}

                {articles.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No articles found</div>
                )}
            </div>
        </div>
    );
}
