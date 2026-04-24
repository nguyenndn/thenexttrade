import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { TrendingUp, Landmark, ArrowRight, Star, Check } from 'lucide-react';

// CACHED DATA FETCHERS
const getRecentPosts = unstable_cache(
    async () => {
        return await prisma.article.findMany({
            take: 4,
            orderBy: { createdAt: 'desc' },
            where: { status: 'PUBLISHED' }
        });
    },
    ['sidebar-recent'],
    { revalidate: 300, tags: ['articles'] } // Cache for 5 mins
);

const getTagCloud = unstable_cache(
    async () => {
        return await prisma.tag.findMany({ take: 10 });
    },
    ['sidebar-tags'],
    { revalidate: 3600, tags: ['tags'] } // Cache for 1 hour
);

const getCategories = unstable_cache(
    async () => {
        return await prisma.category.findMany({
            include: { _count: { select: { articles: true } } }
        });
    },
    ['sidebar-categories'],
    { revalidate: 3600, tags: ['categories'] }
);

async function RecentPostsWidget() {
    const articles = await getRecentPosts();

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Accent top stripe */}
            <div className="h-1 bg-gradient-to-r from-primary to-cyan-400" />

            <div className="p-5">
                {/* Header with accent bar */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-700 dark:text-white text-base relative pl-3 before:content-[''] before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-full">
                        Recent Posts
                    </h3>
                </div>

                {/* List */}
                <div className="space-y-1">
                    {articles.map(article => (
                        <Link key={article.id} href={`/articles/${article.slug}`} className="flex gap-3 group items-center p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="relative w-14 h-14 overflow-hidden rounded-full border-2 border-gray-100 dark:border-white/10 group-hover:border-primary transition-all shrink-0 shadow-sm">
                                {article.thumbnail ? (
                                    <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] text-gray-500">N/A</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                    {article.title}
                                </h4>
                                <span className="text-xs text-gray-500 mt-1 block">
                                    {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

async function TagCloudWidget() {
    const tags = await getTagCloud();

    if (tags.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="font-bold text-gray-700 dark:text-white mb-6 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full">
                Tag Cloud
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                    <Link
                        key={tag.id}
                        href={`/articles/tag/${tag.slug}`}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-80 block
                            ${i % 3 === 0 ? 'bg-[#FF2E5B] shadow-[#FF2E5B]/20' :
                                i % 3 === 1 ? 'bg-primary shadow-primary/20' :
                                    'bg-[#673AB7] shadow-[#673AB7]/20'} shadow-lg`}
                    >
                        #{tag.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

async function CategoriesWidget() {
    const categories = await getCategories();

    return (
        <div className="mb-8">
            <h3 className="font-bold text-gray-700 dark:text-white mb-6 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-purple-500 before:rounded-full">
                Categories
            </h3>
            <ul className="space-y-2">
                {categories.map(cat => (
                    <li key={cat.id}>
                        <Link href={`/articles/category/${cat.slug}`} className="flex justify-between items-center group">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-500 group-hover:text-primary transition-colors">
                                {cat.name}
                            </span>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 px-2 py-0.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                {cat._count.articles}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

import partnersData from '@/config/partners.json';

const BADGE_STYLES: Record<string, string> = {
    gold: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
    green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    blue: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20",
};

function TopBrokersWidget() {
    const brokers = partnersData.brokers.items.filter((b: any) => b.active !== false).slice(0, 3);

    if (brokers.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Accent top stripe */}
            <div className="h-1 bg-gradient-to-r from-primary to-cyan-400" />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-700 dark:text-white text-base relative pl-3 before:content-[''] before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-full">
                        Top Brokers
                    </h3>
                    <Link href="/brokers" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors shrink-0 whitespace-nowrap shadow-sm shadow-primary/20">
                        Compare All <ArrowRight size={12} />
                    </Link>
                </div>

                {/* Broker List */}
                <div className="space-y-4">
                    {brokers.map((broker: any, i: number) => {
                        const hasUrl = broker.url && broker.url !== "#";
                        return (
                            <div key={broker.name} className="group">
                                {/* Badge */}
                                {broker.badge && (
                                    <div className={`text-center py-1 mb-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${BADGE_STYLES[broker.badgeType || "green"]}`}>
                                        {broker.badge}
                                    </div>
                                )}

                                {/* Broker Header Row */}
                                <div className="flex items-start justify-between mb-2.5 gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white flex items-center justify-center overflow-hidden p-[5px] shrink-0 border border-gray-200 dark:border-white/10 shadow-sm">
                                            {broker.logo ? (
                                                <Image src={broker.logo} alt={broker.name} width={32} height={32} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-500">{broker.initials}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-gray-700 dark:text-white leading-tight truncate group-hover:text-primary transition-colors">{broker.name}</h4>
                                        </div>
                                    </div>
                                    {broker.rating && (
                                        <div className="flex items-center gap-1 text-amber-500 text-[13px] font-bold shrink-0 pt-0.5">
                                            <Star size={12} className="fill-current" />
                                            <span>{broker.rating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Specs Bar — matches /brokers page */}
                                {(broker.minDeposit || broker.maxLeverage || broker.regulation) && (
                                    <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 mb-2.5">
                                        {broker.minDeposit && (
                                            <div className="bg-white dark:bg-[#1E2028] py-2 text-center">
                                                <div className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">Deposit</div>
                                                <div className="text-[11px] font-bold text-gray-700 dark:text-white mt-0.5">{broker.minDeposit}</div>
                                            </div>
                                        )}
                                        {broker.maxLeverage && (
                                            <div className="bg-white dark:bg-[#1E2028] py-2 text-center">
                                                <div className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">Leverage</div>
                                                <div className="text-[11px] font-bold text-gray-700 dark:text-white mt-0.5">{broker.maxLeverage}</div>
                                            </div>
                                        )}
                                        {broker.regulation && (
                                            <div className="bg-white dark:bg-[#1E2028] py-2 text-center">
                                                <div className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">Regulation</div>
                                                <div className="text-[11px] font-bold text-gray-700 dark:text-white mt-0.5 truncate px-1">{broker.regulation}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Features Checkmarks */}
                                {broker.features && broker.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {broker.features.slice(0, 2).map((feat: string, j: number) => (
                                            <div key={j} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-[#00C888]/10 text-[10px] font-bold text-green-600 dark:text-[#00C888] leading-none">
                                                <Check size={10} strokeWidth={3} className="opacity-80 shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* CTA Button */}
                                {hasUrl && (
                                    <a
                                        href={broker.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-[11px] hover:opacity-90 transition-all shadow-sm shadow-primary/20 hover:shadow-primary/30"
                                    >
                                        Open Account
                                        <ArrowRight size={11} />
                                    </a>
                                )}
                                
                                {i < brokers.length - 1 && <div className="h-px w-full bg-gray-100 dark:bg-white/5 mt-4"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function SidebarWidgets() {
    return (
        <div className="space-y-8 sticky top-24">
            <RecentPostsWidget />
            <TopBrokersWidget />
            <TagCloudWidget />
        </div>
    );
}
