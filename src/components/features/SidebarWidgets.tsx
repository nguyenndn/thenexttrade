import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

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
        <div className="mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-[#00C888] before:rounded-full">
                Recent Posts
            </h3>
            <div className="space-y-4">
                {articles.map(article => (
                    <Link key={article.id} href={`/articles/${article.slug}`} className="flex gap-4 group items-center">
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-transparent group-hover:border-[#00C888] transition-all">
                            {article.thumbnail ? (
                                <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">No Img</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#00C888] transition-colors line-clamp-2">
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
                        className={`text-xs font-bold px-3 py-1.5 rounded-full text-white transition-transform hover:-translate-y-1 block
                            ${i % 3 === 0 ? 'bg-[#FF2E5B] shadow-[#FF2E5B]/20' :
                                i % 3 === 1 ? 'bg-[#00C888] shadow-[#00C888]/20' :
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
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-[#00C888] transition-colors">
                                {cat.name}
                            </span>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded-full group-hover:bg-[#00C888] group-hover:text-white transition-colors">
                                {cat._count.articles}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const brokers = [
    { name: "Exness", rating: 5.0, logo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Exness_logo.png", url: "#" },
    { name: "IC Markets", rating: 4.9, logo: "https://yt3.googleusercontent.com/ytc/AIdro_n4n7l3q8J9I1z5Z5Q6t8k7mL8n9o0p1q2r3s4t=s900-c-k-c0x00ffffff-no-rj", url: "#" },
    { name: "XM", rating: 4.8, logo: "https://yt3.googleusercontent.com/ytc/AIdro_kX4j5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0=s900-c-k-c0x00ffffff-no-rj", url: "#" },
];

function TrustedBrokersWidget() {
    return (
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-lg mb-8">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-yellow-400 mb-4 border border-white/10">
                    <span>★</span>
                    <span>Verified Partners</span>
                </div>

                <h3 className="text-xl font-bold mb-2 leading-tight">
                    Find the Best <br />
                    <span className="text-[#00C888]">Forex Broker</span>
                </h3>

                <p className="text-sm text-gray-300 mb-6 font-medium">
                    Compare spreads, fees & features from top regulated brokers.
                </p>

                <Link
                    href="/brokers"
                    className="inline-block w-full text-center py-3 bg-[#00C888] hover:bg-[#00B078] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00C888]/25 hover:shadow-[#00C888]/40 transform group-hover:-translate-y-0.5"
                >
                    Compare Now
                </Link>
            </div>
        </div>
    );
}

export default function SidebarWidgets() {
    return (
        <div className="space-y-8 sticky top-24">
            <RecentPostsWidget />
            {/* Categories Widget Removed */}
            <TrustedBrokersWidget />
            <TagCloudWidget />
        </div>
    );
}
