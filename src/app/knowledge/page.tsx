import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
    Clock,
    Search,
    BookOpen,
    TrendingUp,
    Filter,
    Flame,
    MessageCircle,
    CalendarDays,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DynamicFirefly as FireflyBackground } from "@/components/ui/DynamicFirefly";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { ArticleCard } from "@/components/knowledge/ArticleCard";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trading Knowledge Base — Articles, Guides & Market Analysis | TheNextTrade",
    description:
        "Explore our premium collection of forex trading articles, in-depth market analysis, strategy guides, and trading psychology insights. Updated regularly by experienced traders.",
    alternates: {
        canonical: "/knowledge",
    },
    openGraph: {
        title: "Trading Knowledge Base | TheNextTrade",
        description:
            "Deep-dive articles on forex strategies, technical analysis, and trading psychology.",
        url: "/knowledge",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Trading Knowledge Base | TheNextTrade",
        description:
            "Deep-dive articles on forex strategies, technical analysis, and trading psychology.",
    },
};

// Knowledge base can use ISR since content is cacheable
export const revalidate = 300; // 5 minutes

interface LibraryPageProps {
    searchParams?: Promise<{
        q?: string;
        page?: string;
        category?: string;
        tag?: string;
        sort?: string;
    }>;
}

export default async function LibraryPage(props: LibraryPageProps) {
    const params = await props.searchParams;
    const query = params?.q || "";
    const categorySlug = params?.category;
    const tagSlug = params?.tag;
    const currentPage = Number(params?.page) || 1;
    const sortBy = params?.sort || "newest";
    const ITEMS_PER_PAGE = 9;

    // Dynamic orderBy based on sort param
    const orderByMap: Record<string, any> = {
        newest: { createdAt: "desc" },
        popular: { views: "desc" },
        discussed: { comments: { _count: "desc" } },
    };
    const orderBy = orderByMap[sortBy] || orderByMap.newest;

    const whereCondition: any = {
        status: "PUBLISHED",
    };

    if (query) {
        whereCondition.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
        ];
    }

    if (categorySlug) {
        whereCondition.category = {
            slug: categorySlug,
        };
    }

    if (tagSlug) {
        whereCondition.tags = {
            some: {
                tag: {
                    slug: tagSlug,
                },
            },
        };
    }

    const [articles, totalCount, categories] = await Promise.all([
        prisma.article.findMany({
            where: whereCondition,
            orderBy,
            take: ITEMS_PER_PAGE,
            skip: (currentPage - 1) * ITEMS_PER_PAGE,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                thumbnail: true,
                createdAt: true,
                views: true,
                estimatedTime: true,
                category: { select: { name: true } },
                author: { select: { name: true, image: true } },
                _count: { select: { comments: true, votes: true } },
            },
        }),
        prisma.article.count({ where: whereCondition }),
        prisma.category.findMany({ orderBy: { name: "asc" } }), // Lấy tất cả categories
    ]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-transparent">
            {/* Wrapper for Content that needs Firefly Background */}
            <div className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold)/0.15)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.25] dark:opacity-[0.15] pointer-events-none"></div>
                <FireflyBackground />

                <PublicHeader />

                {/* Hero Section - Glass Effect */}
                <div className="pt-32 pb-10 sm:pb-6 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-10">
                            <div className="w-full lg:flex-1 text-left">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold font-black text-xs uppercase tracking-wider mb-6 shadow-sm">
                                    <BookOpen size={15} />
                                    <span>Knowledge Base</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-heading text-gray-800 dark:text-white mb-6 leading-tight tracking-tight">
                                    Trading{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500">
                                        Library
                                    </span>
                                </h1>
                                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed mb-6 lg:mb-8 font-semibold">
                                    Battle-tested documentation on execution models, risk management mathematics, session dynamics, and behavioral psychology.
                                </p>

                                {/* Search Component - fullwidth on tablet/mobile, max-w-md on desktop lg */}
                                <div className="w-full max-w-none lg:max-w-md mb-2 lg:mb-0">
                                    <SearchInput className="w-full" />
                                </div>
                            </div>

                            {/* Top Categories Pills - Glass */}
                            <div className="flex flex-wrap justify-start lg:justify-end gap-2.5 w-full lg:max-w-lg">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/knowledge?category=${cat.slug}`}
                                        className={`px-4 py-2 rounded-xl backdrop-blur-md border cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md ${categorySlug === cat.slug
                                            ? "bg-gradient-to-r from-gold to-amber-600 border-gold/40 text-white shadow-md shadow-gold/20"
                                            : "bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:border-gold/35 hover:text-gold hover:shadow-md hover:shadow-gold/[0.05]"
                                            }`}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <SectionHeader
                            title={
                                query
                                    ? `Search: "${query}"`
                                    : categorySlug
                                        ? `Category: ${categories.find((c) => c.slug === categorySlug)?.name || categorySlug}`
                                        : tagSlug
                                            ? `Tag: ${tagSlug}`
                                            : "Latest Publications"
                            }
                            align="left"
                        />
                        {(query || categorySlug || tagSlug) && (
                            <Link href="/knowledge">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600 transition-all rounded-xl"
                                >
                                    <X size={16} />
                                    <span>Clear Filter</span>
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Sort Chips + Count */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            {[
                                {
                                    key: "newest",
                                    label: "Newest",
                                    icon: CalendarDays,
                                },
                                {
                                    key: "popular",
                                    label: "Most Read",
                                    icon: Flame,
                                },
                                {
                                    key: "discussed",
                                    label: "Most Discussed",
                                    icon: MessageCircle,
                                },
                            ].map((chip) => {
                                const isActive = sortBy === chip.key;
                                // Build URL preserving existing params
                                const chipParams = new URLSearchParams();
                                if (query) chipParams.set("q", query);
                                if (categorySlug)
                                    chipParams.set("category", categorySlug);
                                if (tagSlug) chipParams.set("tag", tagSlug);
                                if (chip.key !== "newest")
                                    chipParams.set("sort", chip.key);
                                const chipHref = `/knowledge${chipParams.toString() ? `?${chipParams.toString()}` : ""}`;
                                return (
                                    <Link
                                        key={chip.key}
                                        href={chipHref}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${isActive
                                            ? "bg-gradient-to-r from-gold to-amber-600 border border-gold/40 text-white shadow-md shadow-gold/20"
                                            : "bg-white/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gold/40 hover:text-gold backdrop-blur-md shadow-sm"
                                            }`}
                                    >
                                        <chip.icon size={13} />
                                        {chip.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {totalCount}{" "}
                            {totalCount === 1 ? "article" : "articles"}
                        </span>
                    </div>

                    {articles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article as any}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            <Pagination totalPages={totalPages} />
                        </>
                    ) : (
                        <div className="text-center py-32 rounded-xl bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/20 border-dashed">
                            <div className="inline-flex p-6 rounded-full bg-gray-50/50 dark:bg-white/5 mb-6 animate-pulse">
                                <Search size={48} className="text-gray-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 dark:text-white mb-2">
                                {query
                                    ? `No results for "${query}"`
                                    : "Library is Empty"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Try adjusting your search or check back later.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
