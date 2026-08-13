import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SafeImage } from "@/components/ui/SafeImage";
import DOMPurify from "isomorphic-dompurify";

import {
    MessageSquare,
    Calendar,
    Clock,
    Home,
    ChevronRight,
    ThumbsUp,
    Flame,
    BookOpen,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CommentsFetcher } from "@/components/comments/CommentsFetcher";
import SocialShare from "@/components/features/SocialShare";
import RelatedArticlesBottom from "@/components/features/RelatedArticlesBottom";
import SidebarWidgets from "@/components/features/SidebarWidgets";
import { Metadata } from "next";
import ReadingProgressBar from "@/components/features/ReadingProgressBar";
import TableOfContents from "@/components/features/TableOfContents";
import ScrollToTopButton from "@/components/features/ScrollToTopButton";
import { ViewCounter } from "@/components/features/ViewCounter";
import { HelpfulButton } from "@/components/features/HelpfulButton";
import { BreadcrumbShareButtons } from "@/components/features/BreadcrumbShareButtons";
import { unstable_cache } from "next/cache";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { parseHowToSteps, minutesToIsoDuration } from "@/lib/parseHowToSteps";
import { parseFaq } from "@/lib/parseFaq";

// CACHING: Cache article data + processed content for 60 seconds
const generateId = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};

const getCachedArticle = unstable_cache(
    async (slug: string) => {
        // 1. Fast Path: Strict Slug Lookup (Indexed)
        let article = await prisma.article.findUnique({
            where: { slug },
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
                category: true,
                tags: { include: { tag: true } },
            },
        });

        if (!article) {
            // 2. Fallback: Fuzzy Search (Slower, only acts if slug not found)
            article = await prisma.article.findFirst({
                where: {
                    title: {
                        equals: slug.replace(/-/g, " "),
                        mode: "insensitive",
                    },
                    status: "PUBLISHED",
                },
                include: {
                    author: {
                        select: { id: true, name: true, image: true },
                    },
                    category: true,
                    tags: { include: { tag: true } },
                },
            });
        }

        if (!article) return null;

        // C8: Pre-compute processedContent — regex runs once per cache cycle (60s)
        const processedContent = article.content.replace(
            /<h([23])((?:\s[^>]*)?)>(.*?)<\/h\1>/g,
            (_match: string, level: string, attrs: string, content: string) => {
                const text = content.replace(/<[^>]*>/g, "");
                const id = generateId(text);
                return `<h${level} id="${id}" class="scroll-mt-32"${attrs}>${content}</h${level}>`;
            }
        );

        return { ...article, processedContent };
    },
    ["article-by-slug"],
    { revalidate: 60, tags: ["articles"] }
);

// SSG: Pre-render the top 50 most recent articles at build time
/*
export async function generateStaticParams() {
 const articles = await prisma.article.findMany({
 take: 50,
 select: { slug: true },
 orderBy: { createdAt: 'desc' }
 });

 return articles.map((article) => ({
 slug: article.slug,
 }));
}
*/

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = await getCachedArticle(slug);

    if (!article) {
        return {
            title: "Article Not Found | The Next Trade",
            robots: { index: false, follow: false },
        };
    }

    return {
        title: `${article.title} | The Next Trade`,
        description:
            article.excerpt || `Read ${article.title} on The Next Trade.`,
        openGraph: {
            title: article.title,
            description: article.excerpt || undefined,
            type: "article",
            images: article.thumbnail ? [article.thumbnail] : undefined,
            publishedTime: article.publishedAt
                ? new Date(article.publishedAt).toISOString()
                : undefined,
            section: article.category.name,
            tags: ["Forex", "Trading", "Finance"],
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.excerpt || undefined,
            images: article.thumbnail ? [article.thumbnail] : undefined,
        },
        alternates: {
            canonical: `/articles/${slug}`,
        },
    };
}

export const revalidate = 3600;

export default async function ArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Parallel Fetching: Article & Related Articles (Spec 3.4)
    const [article, relatedArticles] = await Promise.all([
        getCachedArticle(slug),
        prisma.article.findMany({
            where: {
                status: "PUBLISHED",
                slug: { not: slug },
            },
            take: 3,
            orderBy: { views: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                thumbnail: true,
                createdAt: true,
            },
        }),
    ]);

    if (!article) {
        notFound();
    }

    const formattedDate = new Date(article.createdAt).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );

    // C8: processedContent is pre-computed inside getCachedArticle (runs once per 60s)
    const { processedContent } = article;

    // Get real comment count + vote count
    const [commentCount, voteCount] = await Promise.all([
        prisma.comment.count({ where: { articleId: article.id } }),
        prisma.articleVote.count({ where: { articleId: article.id } }),
    ]);

    return (
        <main className="min-h-screen bg-white bg-[linear-gradient(to_bottom,#ffffff_0%,#ffffff_120px,#f0fdf4_300px,#f8fafc_600px,#ffffff_1200px)] dark:bg-transparent dark:bg-none">
            <ReadingProgressBar />
            <ViewCounter articleId={article.id} />
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", href: "/" },
                    { name: "Knowledge", href: "/knowledge" },
                    {
                        name: article.category.name,
                        href: `/knowledge?category=${article.category.slug}`,
                    },
                    { name: article.title, href: `/articles/${slug}` },
                ]}
            />
            <JsonLd
                type="Article"
                data={{
                    headline: article.title,
                    description: article.excerpt || article.title,
                    image: article.thumbnail ? [article.thumbnail] : [],
                    datePublished: (article.publishedAt
                        ? new Date(article.publishedAt)
                        : new Date(article.createdAt)
                    ).toISOString(),
                    dateModified: new Date(article.updatedAt).toISOString(),
                    author: {
                        name: article.author.name || "TheNextTrade Team",
                        url: `${process.env.NEXT_PUBLIC_APP_URL}/author/${article.author.id}`,
                    },
                    citation: article.sourceUrls || [],
                }}
            />
            {article.schemaType === "HOWTO" &&
                (() => {
                    const howTo = parseHowToSteps(article.content);
                    return (
                        <JsonLd
                            type="HowTo"
                            data={{
                                name: article.title,
                                description:
                                    article.excerpt || howTo.description,
                                image: article.thumbnail || undefined,
                                ...(article.estimatedTime
                                    ? {
                                          totalTime: minutesToIsoDuration(
                                              article.estimatedTime
                                          ),
                                      }
                                    : {}),
                                step: howTo.steps,
                            }}
                        />
                    );
                })()}
            {(() => {
                const faqList = parseFaq(article.content);
                if (faqList.length === 0) return null;
                return (
                    <JsonLd
                        type="FAQPage"
                        data={{
                            mainEntity: faqList.map((item) => ({
                                "@type": "Question",
                                name: item.question,
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: item.answer,
                                },
                            })),
                        }}
                    />
                );
            })()}

            <PublicHeader />

            <div className="pt-[84px]" />

            {/* ===== HERO IMAGE ===== */}
            {article.thumbnail && (
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg bg-gray-900">
                        <SafeImage
                            src={article.thumbnail}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1280px"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI1MTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzk0YTNiOCIvPjwvc3ZnPg=="
                        />
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    </div>
                    {/* Decorative gradient line */}
                    <div className="h-1 mt-0 rounded-b-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                </div>
            )}

            {/* ===== MAIN CONTENT AREA ===== */}
            <div
                className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 ${article.thumbnail ? "mt-8" : "mt-6"}`}
            >
                {/* ===== ARTICLE HEADER ===== */}
                <div className="mb-10">
                    {/* Breadcrumb */}
                    <div className="flex justify-center mb-5">
                        <nav className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/15 text-[13px] font-medium">
                            <Home size={13} className="shrink-0 text-primary" />
                            <Link
                                href="/"
                                className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors shrink-0"
                            >
                                Home
                            </Link>
                            <ChevronRight
                                size={12}
                                className="text-gray-300 dark:text-gray-600 shrink-0"
                            />
                            <Link
                                href="/knowledge"
                                className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors shrink-0"
                            >
                                Knowledge
                            </Link>
                            <ChevronRight
                                size={12}
                                className="text-gray-300 dark:text-gray-600 shrink-0"
                            />
                            <span className="text-primary font-bold truncate max-w-[200px] sm:max-w-[400px]">
                                {article.title}
                            </span>
                        </nav>
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-700 dark:text-white leading-[1.2] tracking-tight mb-6 text-center">
                        {article.title}
                    </h1>

                    {/* Meta info row */}
                    <div className="flex justify-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-white/[0.04] border border-primary/30 dark:border-primary/20 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-sm font-medium text-gray-500 dark:text-gray-400">
                            {/* Author */}
                            <div className="flex items-center gap-2">
                                <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                                    {article.author.image ? (
                                        <Image
                                            src={article.author.image}
                                            alt={
                                                article.author.name || "Author"
                                            }
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                            {article.author.name?.charAt(0) ||
                                                "?"}
                                        </div>
                                    )}
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                    {article.author.name || "TheNextTrade Team"}
                                </span>
                            </div>

                            <span className="text-gray-300 dark:text-gray-600">
                                ·
                            </span>

                            {/* Date */}
                            <div className="flex items-center gap-1.5">
                                <Calendar
                                    size={14}
                                    strokeWidth={2.5}
                                    className="text-primary"
                                />
                                <span>{formattedDate}</span>
                            </div>

                            <span className="text-gray-300 dark:text-gray-600">
                                ·
                            </span>

                            {/* Views */}
                            <div className="flex items-center gap-1.5">
                                <Flame
                                    size={14}
                                    strokeWidth={2.5}
                                    className="text-primary"
                                />
                                <span>{article.views.toLocaleString()}</span>
                            </div>

                            <span className="text-gray-300 dark:text-gray-600">
                                ·
                            </span>

                            {/* Read time */}
                            <div className="flex items-center gap-1.5">
                                <Clock
                                    size={14}
                                    strokeWidth={2.5}
                                    className="text-primary"
                                />
                                <span>
                                    {Math.ceil(article.content.length / 1000)}{" "}
                                    min read
                                </span>
                            </div>

                            {/* Comments */}
                            {commentCount > 0 && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">
                                        ·
                                    </span>
                                    <a
                                        href="#comments"
                                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                                    >
                                        <MessageSquare
                                            size={14}
                                            strokeWidth={2.5}
                                            className="text-primary"
                                        />
                                        <span>{commentCount}</span>
                                    </a>
                                </>
                            )}

                            {/* Helpful votes */}
                            {voteCount > 0 && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">
                                        ·
                                    </span>
                                    <div className="flex items-center gap-1.5 text-primary">
                                        <ThumbsUp
                                            size={14}
                                            strokeWidth={2.5}
                                            className="fill-primary/50"
                                        />
                                        <span>
                                            {voteCount}{" "}
                                            {voteCount === 1
                                                ? "trader"
                                                : "traders"}{" "}
                                            found helpful
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== 2-COLUMN LAYOUT ===== */}
                <div className="flex items-stretch">
                    {/* --- Sticky Social Share (overlaps card left border) --- */}
                    <div className="hidden lg:block shrink-0 z-10 -mr-[26px]">
                        <div className="sticky top-24 pt-8">
                            <SocialShare
                                title={article.title}
                                slug={slug}
                                vertical={true}
                                articleId={article.id}
                            />
                        </div>
                    </div>

                    {/* --- Main Content Column --- */}
                    <article className="flex-1 min-w-0">
                        {/* Content Card */}
                        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-dashboard p-6 sm:p-8 lg:p-10">
                            <div
                                className="article-content prose dark:prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-700 dark:prose-headings:text-white prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-dashboard dark:prose-h2:border-white/5 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-primary dark:prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-semibold prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-primary prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-2 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-strong:text-gray-700 dark:prose-strong:text-white prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-5 prose-pre:text-sm prose-pre:leading-relaxed prose-pre:overflow-x-auto prose-pre:shadow-inner prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-semibold prose-code:text-gray-800 dark:prose-code:text-gray-200 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_pre_code]:font-mono"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                        processedContent
                                    ),
                                }}
                            />
                        </div>

                        {/* References & Sources */}
                        {article.sourceUrls &&
                            article.sourceUrls.length > 0 && (
                                <div className="mt-8 p-6 bg-slate-50 dark:bg-white/[0.015] border border-dashboard rounded-2xl">
                                    <h4 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
                                        <BookOpen
                                            size={14}
                                            className="text-primary"
                                        />
                                        <span>References & Sources</span>
                                    </h4>
                                    <ul className="space-y-3">
                                        {article.sourceUrls.map(
                                            (url: string, index: number) => {
                                                let domain = url;
                                                try {
                                                    domain = new URL(url)
                                                        .hostname;
                                                } catch (e) {}
                                                return (
                                                    <li
                                                        key={index}
                                                        className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                        <span className="font-semibold text-gray-500">
                                                            [{index + 1}]
                                                        </span>
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline font-bold truncate transition-colors"
                                                        >
                                                            {domain}
                                                        </a>
                                                        <span className="text-gray-400 dark:text-gray-600 truncate max-w-[200px] sm:max-w-[400px] hidden sm:inline">
                                                            ({url})
                                                        </span>
                                                    </li>
                                                );
                                            }
                                        )}
                                    </ul>
                                </div>
                            )}

                        {/* AI Image Disclaimer */}
                        <div className="mt-6 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200 dark:border-amber-500/15 text-center">
                            <span className="text-amber-600 dark:text-amber-400/80 text-sm leading-relaxed italic">
                                Disclaimer: Educational illustrations are
                                AI-generated and do not represent real market
                                data.
                            </span>
                        </div>

                        {/* Tags */}
                        {article.tags.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-2">
                                {article.tags.map(({ tag }) => (
                                    <Link
                                        key={tag.id}
                                        href={`/knowledge?tag=${tag.slug}`}
                                        className="px-4 py-2 bg-white dark:bg-card border border-dashboard rounded-full text-sm font-bold text-gray-600 dark:text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                    >
                                        #{tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Helpful Vote (mobile only — desktop uses sidebar) */}
                        <div className="mt-8 flex items-center gap-3 lg:hidden">
                            <HelpfulButton articleId={article.id} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Did you find this article helpful?
                            </span>
                        </div>

                        {/* Related Articles */}
                        <Suspense
                            fallback={
                                <div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl mt-16" />
                            }
                        >
                            <RelatedArticlesBottom
                                categoryId={article.categoryId}
                                currentArticleId={article.id}
                                initialArticles={relatedArticles}
                            />
                        </Suspense>

                        {/* Comments */}
                        <div id="comments" className="mt-8">
                            <Suspense
                                fallback={
                                    <div className="py-12 border-t border-dashboard space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                                            <div className="h-8 w-40 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
                                        </div>
                                        <div className="space-y-6">
                                            {[1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-4"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5 animate-pulse" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                                                        <div className="h-20 w-full bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                }
                            >
                                <CommentsFetcher articleId={article.id} />
                            </Suspense>
                        </div>
                    </article>

                    {/* --- Sidebar Column --- */}
                    <aside className="hidden lg:block w-[340px] lg:w-[360px] shrink-0 ml-6 xl:ml-8">
                        <div className="sticky top-24 space-y-6">
                            {/* TOC */}
                            <TableOfContents />
                            {/* Sidebar Widgets */}
                            <Suspense
                                fallback={
                                    <div className="space-y-6">
                                        <div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl"></div>
                                        <div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl"></div>
                                    </div>
                                }
                            >
                                <SidebarWidgets />
                            </Suspense>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="pb-12" />
            <ScrollToTopButton />
            <SiteFooter />
        </main>
    );
}
