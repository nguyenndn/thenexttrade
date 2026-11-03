import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import Link from "next/link";
import {
    Search,
    BookOpen,
    Flame,
    MessageCircle,
    CalendarDays,
    X,
    Layers,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DynamicFirefly as FireflyBackground } from "@/components/ui/DynamicFirefly";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { ArticleCard } from "@/components/knowledge/ArticleCard";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trading Knowledge Base — Articles, Guides & Market Analysis | TheNextTrade",
    description:
        "Articles and guides on forex execution, risk management mathematics, session dynamics, and trading psychology.",
    alternates: {
        canonical: "/knowledge",
    },
    openGraph: {
        title: "Trading Knowledge Base | TheNextTrade",
        description:
            "Articles on forex execution, risk management mathematics, and trading psychology.",
        url: "/knowledge",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Trading Knowledge Base | TheNextTrade",
        description:
            "Articles on forex execution, risk management mathematics, and trading psychology.",
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
    const user = await getAuthUser();
    const params = await props.searchParams;
    const query = params?.q || "";
    const categorySlug = params?.category;
    const tagSlug = params?.tag;
    const currentPage = Number(params?.page) || 1;
    const sortBy = params?.sort || "newest";
    const ITEMS_PER_PAGE = 9;

    // Dynamic orderBy based on sort param (Explicit Prisma types — zero `any`)
    const orderByMap: Record<string, Prisma.ArticleOrderByWithRelationInput> = {
        newest: { createdAt: "desc" },
        popular: { views: "desc" },
        discussed: { comments: { _count: "desc" } },
    };
    const orderBy = orderByMap[sortBy] || orderByMap.newest;

    const whereCondition: Prisma.ArticleWhereInput = {
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
        prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const buildCategoryHref = (slug?: string) => {
        const nextParams = new URLSearchParams();
        if (query) nextParams.set("q", query);
        if (slug) nextParams.set("category", slug);
        if (tagSlug) nextParams.set("tag", tagSlug);
        if (sortBy && sortBy !== "newest") nextParams.set("sort", sortBy);
        const qs = nextParams.toString();
        return `/knowledge${qs ? `?${qs}` : ""}`;
    };

    return (
        <main className="min-h-screen bg-white dark:bg-transparent">
            <div className="relative overflow-hidden">
                {/* Ambient Background Atmosphere */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
                <FireflyBackground />

                <PublicHeader user={user} />

                {/* Hero Section */}
                <div className="pt-28 sm:pt-32 pb-8 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                            <div className="lg:col-span-7 text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-amber-700 dark:text-gold font-black text-xs uppercase tracking-wider mb-5 shadow-xs">
                                    <BookOpen size={14} />
                                    <span>Knowledge Base</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-heading text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
                                    Trading{" "}
                                    <span className="text-gold">Library</span>
                                </h1>
                                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed mb-6">
                                    Battle-tested documentation on execution models, risk management mathematics, session dynamics, and behavioral psychology.
                                </p>

                                {/* Search Input with Explicit Label & Helper Text (Zero Generic Placeholder) */}
                                <div className="w-full max-w-none lg:max-w-md space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            Search Knowledge Base
                                        </span>
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            Filter by execution model, risk math, or strategy
                                        </span>
                                    </div>
                                    <SearchInput className="w-full" />
                                </div>
                            </div>

                            {/* Topic Directory Panel */}
                            <div className="lg:col-span-5 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100 dark:border-white/10">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">
                                        <Layers size={14} className="text-gold" />
                                        <span>Filter by Topic</span>
                                    </span>
                                    <span className="text-[11px] tabular-nums font-bold text-gray-500 dark:text-gray-400">
                                        {categories.length} Topics
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={buildCategoryHref(undefined)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors duration-150 ${
                                            !categorySlug
                                                ? "bg-gold border-gold !text-white shadow-xs"
                                                : "bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gold/40 hover:text-amber-600 dark:hover:text-gold"
                                        }`}
                                    >
                                        All Topics
                                    </Link>
                                    {categories.map((cat) => {
                                        const isSelected =
                                            categorySlug === cat.slug;
                                        return (
                                            <Link
                                                key={cat.id}
                                                href={buildCategoryHref(
                                                    isSelected
                                                        ? undefined
                                                        : cat.slug
                                                )}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors duration-150 ${
                                                    isSelected
                                                        ? "bg-gold border-gold !text-white shadow-xs"
                                                        : "bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gold/40 hover:text-amber-600 dark:hover:text-gold"
                                                }`}
                                            >
                                                {cat.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
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
                            className="!mb-4"
                        />
                        {(query || categorySlug || tagSlug) && (
                            <Link
                                href="/knowledge"
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    }),
                                    "flex items-center gap-1.5 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600 transition-colors rounded-lg mb-4"
                                )}
                            >
                                <X size={15} />
                                <span>Clear Filter</span>
                            </Link>
                        )}
                    </div>

                    {/* Sort Segmented Bar + Tabular Article Count */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-xs">
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
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors duration-150 ${
                                            isActive
                                                ? "bg-gold !text-white shadow-xs"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        <chip.icon size={13} />
                                        <span>{chip.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-xs">
                            <span className="tabular-nums font-black text-gray-900 dark:text-white">
                                {totalCount.toLocaleString()}
                            </span>
                            <span>
                                {totalCount === 1 ? "article" : "articles"}
                            </span>
                        </span>
                    </div>

                    {articles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                                {articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            <Pagination totalPages={totalPages} />
                        </>
                    ) : (
                        <div className="text-center py-20 px-6 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 text-gold">
                                <Search size={22} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1.5">
                                {query
                                    ? `No results for "${query}"`
                                    : "No matching publications"}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-5">
                                Adjust your search term or clear active topic filters to browse the full trading library.
                            </p>
                            {(query || categorySlug || tagSlug) && (
                                <Link
                                    href="/knowledge"
                                    className={buttonVariants({
                                        variant: "gold",
                                        size: "sm",
                                        className: "font-bold",
                                    })}
                                >
                                    <span>Reset All Filters</span>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
