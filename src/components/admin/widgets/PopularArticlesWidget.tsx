"use client";

import { TrendingUp, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Article {
    id: string;
    title: string;
    views: number;
    author: {
        name: string | null;
    };
    createdAt: Date;
}

const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

export function PopularArticlesWidget({ articles }: { articles: Article[] }) {
    const maxViews = Math.max(...articles.map(a => a.views), 1);

    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                Trending News
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {articles.map((article, index) => {
                    const viewWidth = (article.views / maxViews) * 100;
                    return (
                        <motion.div
                            key={article.id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                        >
                            <Link
                                href={`/admin/articles/${article.id}/edit`}
                                className="block p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-emerald-500/30 hover:bg-emerald-50/5 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2 text-sm group-hover:text-emerald-500 transition-colors">
                                        {article.title}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full whitespace-nowrap">
                                        <Eye size={12} aria-hidden="true" />
                                        {article.views.toLocaleString()}
                                    </div>
                                </div>
                                {/* View count bar */}
                                <div className="mt-2 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${viewWidth}%` }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                    />
                                </div>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-600">
                                    by {article.author.name || "Unknown"}
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}

                {articles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">No articles found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
