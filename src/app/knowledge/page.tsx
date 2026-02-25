
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Clock, Search, BookOpen, TrendingUp, Filter } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DynamicFirefly as FireflyBackground } from "@/components/ui/DynamicFirefly";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { getAuthUser } from "@/lib/auth-cache";

// Knowledge base can use ISR since content is cacheable
export const revalidate = 300; // 5 minutes

interface LibraryPageProps {
    searchParams?: Promise<{
        q?: string;
        page?: string;
        category?: string;
        tag?: string;
    }>;
}

export default async function LibraryPage(props: LibraryPageProps) {
    const params = await props.searchParams;
    const query = params?.q || "";
    const categorySlug = params?.category;
    const tagSlug = params?.tag;
    const currentPage = Number(params?.page) || 1;
    const ITEMS_PER_PAGE = 6;

    const whereCondition: any = {
        status: 'PUBLISHED',
    };

    if (query) {
        whereCondition.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
        ];
    }

    if (categorySlug) {
        whereCondition.category = {
            slug: categorySlug
        };
    }

    if (tagSlug) {
        whereCondition.tags = {
            some: {
                tag: {
                    slug: tagSlug
                }
            }
        };
    }

    const [user, articles, totalCount, categories] = await Promise.all([
        getAuthUser(),
        prisma.article.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: ITEMS_PER_PAGE,
            skip: (currentPage - 1) * ITEMS_PER_PAGE,
            select: {
                id: true, title: true, slug: true, excerpt: true, thumbnail: true, createdAt: true,
                category: { select: { name: true } },
                author: { select: { name: true, image: true } }
            },
        }),
        prisma.article.count({ where: whereCondition }),
        prisma.category.findMany({ orderBy: { name: 'asc' } }) // Lấy tất cả categories
    ]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#0F1117]">
            {/* Wrapper for Content that needs Firefly Background */}
            <div className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none"></div>
                <FireflyBackground />

                <PublicHeader user={user} />

                {/* Hero Section - Glass Effect */}
                <div className="pt-32 pb-16 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 text-primary font-bold text-xs uppercase tracking-wider mb-6 shadow-lg">
                                    <BookOpen size={16} />
                                    <span>Knowledge Base</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold font-heading text-gray-900 dark:text-white mb-6 leading-tight">
                                    Trading <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Library</span>
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed mb-8">
                                    Deep dive into our premium collection of trading strategies, market analysis, and psychological insights.
                                </p>

                                {/* Search Component */}
                                <SearchInput />
                            </div>

                            {/* Top Categories Pills - Glass */}
                            <div className="flex flex-wrap justify-center md:justify-end gap-3 max-w-lg">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/knowledge?category=${cat.slug}`}
                                        className="px-5 py-2.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/20 hover:border-primary hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-200 hover:-translate-y-0.5"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <SectionHeader
                            title={
                                query ? `Search: "${query}"` :
                                    categorySlug ? `Category: ${categories.find(c => c.slug === categorySlug)?.name || categorySlug}` :
                                        tagSlug ? `Tag: ${tagSlug}` :
                                            "Latest Publications"
                            }
                            align="left"
                        />
                        {(query || categorySlug || tagSlug) && (
                            <Link href="/knowledge" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 text-sm font-bold text-red-500 hover:bg-white/60 transition-all">
                                <span>Clear Filter</span>
                            </Link>
                        )}
                    </div>

                    {articles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {articles.map((article) => (
                                    <Link
                                        key={article.id}
                                        href={`/articles/${article.slug}`}
                                        className="group flex flex-col rounded-xl overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 hover:-translate-y-0.5"
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
                                                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            <h3 className="text-xl font-bold font-heading text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {article.title}
                                            </h3>

                                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                                                {article.excerpt || "Unlock the secrets of the market with this comprehensive guide..."}
                                            </p>

                                            <div className="flex items-center gap-3 pt-4 border-t border-gray-200/50 dark:border-white/5">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20">
                                                    {article.author?.image && (
                                                        <Image
                                                            src={article.author.image}
                                                            alt={article.author.name || 'Author'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {article.author?.name || 'GSN Team'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Author</span>
                                                </div>

                                                <div className="ml-auto w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                    <TrendingUp size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            <Pagination totalPages={totalPages} />
                        </>
                    ) : (
                        <div className="text-center py-32 rounded-xl bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/20 border-dashed">
                            <div className="inline-flex p-6 rounded-full bg-gray-50/50 dark:bg-white/5 mb-6 animate-pulse">
                                <Search size={48} className="text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {query ? `No results for "${query}"` : "Library is Empty"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or check back later.</p>
                        </div>
                    )}
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
