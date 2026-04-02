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
                    <h3 className="font-bold text-gray-900 dark:text-white text-base relative pl-3 before:content-[''] before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-full">
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
                                    <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] text-gray-400">N/A</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                    {article.title}
                                </h4>
                                <span className="text-xs text-gray-400 mt-1 block">
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full">
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-purple-500 before:rounded-full">
                Categories
            </h3>
            <ul className="space-y-2">
                {categories.map(cat => (
                    <li key={cat.id}>
                        <Link href={`/articles/category/${cat.slug}`} className="flex justify-between items-center group">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
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

const getTopBrokers = unstable_cache(
    async () => {
        return await prisma.broker.findMany({
            where: { isVisible: true },
            orderBy: [{ isRecommended: 'desc' }, { order: 'asc' }],
            take: 3,
        });
    },
    ['sidebar-top-brokers'],
    { revalidate: 600, tags: ['brokers'] } // Cache for 10 mins
);

async function TopBrokersWidget() {
    const brokers = await getTopBrokers();

    if (brokers.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Accent top stripe */}
            <div className="h-1 bg-gradient-to-r from-primary to-cyan-400" />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base relative pl-3 before:content-[''] before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-full">
                        Top Brokers
                    </h3>
                    <Link href="/brokers" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors shrink-0 whitespace-nowrap shadow-sm shadow-primary/20">
                        Compare All <ArrowRight size={12} />
                    </Link>
                </div>

                {/* Broker List */}
                <div className="space-y-4">
                    {brokers.map((broker, i) => (
                        <div key={broker.id} className="group">
                            {/* Broker Header Row */}
                            <div className="flex items-start justify-between mb-2.5 gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white flex items-center justify-center overflow-hidden p-[5px] shrink-0 border border-gray-200 dark:border-white/10 shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={broker.logo} alt={broker.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-0.5 truncate group-hover:text-primary transition-colors">{broker.name}</h4>
                                        {broker.isRecommended && (
                                            <span className="inline-block px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap bg-green-100 dark:bg-[#00C888]/10 text-green-600 dark:text-[#00C888]">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 text-[13px] font-bold shrink-0 pt-0.5">
                                    <Star size={12} className="fill-current" />
                                    <span>{broker.rating.toFixed(1)}</span>
                                </div>
                            </div>

                            {/* Info Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {broker.minDeposit != null && (
                                    <div className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 whitespace-nowrap">
                                        <span className="text-gray-900 dark:text-white font-black">${broker.minDeposit}</span> Min Deposit
                                    </div>
                                )}
                                {broker.maxLeverage && (
                                    <div className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 whitespace-nowrap">
                                        <span className="text-gray-900 dark:text-white font-black">{broker.maxLeverage}</span> Leverage
                                    </div>
                                )}
                            </div>

                            {/* Features Checkmarks */}
                            {broker.features.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {broker.features.slice(0, 2).map((feat, j) => (
                                        <div key={j} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-[#00C888]/10 text-[10px] font-bold text-green-600 dark:text-[#00C888] leading-none">
                                            <Check size={10} strokeWidth={3} className="opacity-80 shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {i < brokers.length - 1 && <div className="h-px w-full bg-gray-100 dark:bg-white/5 mt-4"></div>}
                        </div>
                    ))}
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
