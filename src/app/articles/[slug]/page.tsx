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
import { unstable_cache } from "next/cache";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { parseHowToSteps, minutesToIsoDuration } from "@/lib/parseHowToSteps";
import { parseFaq } from "@/lib/parseFaq";
import { splitArticleTitle } from "@/lib/utils";

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
        // Only PUBLISHED articles are ever served — the fallback below already
        // filters status, so the fast path must agree or draft slugs would
        // render publicly with full content + JSON-LD.
        let article = await prisma.article.findUnique({
            where: { slug, status: "PUBLISHED" },
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
            title: "Article Not Found | TheNextTrade",
            robots: { index: false, follow: false },
        };
    }

    return {
        title: `${article.title} | TheNextTrade`,
        description:
            article.excerpt || `Read ${article.title} on TheNextTrade.`,
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
    const { mainTitle, subtitle } = splitArticleTitle(article.title);

    // Get real comment count + vote count
    const [commentCount, voteCount] = await Promise.all([
        prisma.comment.count({ where: { articleId: article.id } }),
        prisma.articleVote.count({ where: { articleId: article.id } }),
    ]);

    return (
        <main className="min-h-screen bg-slate-50/50 dark:bg-transparent">
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

            {/* ===== MAIN CONTAINER (Max-w-7xl for optimal reading hierarchy) ===== */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
                {/* ===== 1. ARTICLE HEADER (Center-Aligned) ===== */}
                <header className="mb-8 sm:mb-10 text-center">
                    {/* Slim Full-Width Breadcrumb Bar with Article Title (Centered) */}
                    <nav
                        className="w-full mb-5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/80 dark:bg-card/50 border border-gold/20 dark:border-white/10 flex items-center justify-center min-w-0 text-xs text-gray-500 dark:text-gray-400 overflow-hidden"
                        aria-label="Breadcrumb"
                    >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                            <Link
                                href="/"
                                className="text-gray-600 dark:text-gray-300 hover:text-gold transition-colors flex items-center gap-1 shrink-0"
                            >
                                <Home size={13} className="text-gold" />
                                <span>Home</span>
                            </Link>
                            <ChevronRight
                                size={11}
                                className="text-gray-300 dark:text-gray-600 shrink-0"
                            />
                            <Link
                                href="/knowledge"
                                className="text-gray-600 dark:text-gray-300 hover:text-gold transition-colors shrink-0"
                            >
                                Knowledge
                            </Link>
                            <ChevronRight
                                size={11}
                                className="text-gray-300 dark:text-gray-600 shrink-0"
                            />
                            <Link
                                href={`/knowledge?category=${article.category.slug}`}
                                className="text-gray-700 dark:text-gray-300 hover:text-gold transition-colors shrink-0 font-medium"
                            >
                                {article.category.name}
                            </Link>
                            <ChevronRight
                                size={11}
                                className="text-gray-300 dark:text-gray-600 shrink-0"
                            />
                            <span
                                className="text-gold font-medium truncate max-w-[240px] sm:max-w-md lg:max-w-xl"
                                title={article.title}
                            >
                                {mainTitle}
                            </span>
                        </div>
                    </nav>

                    {/* Center-Aligned H1 Title (Punchy, balanced main headline) */}
                    <h1
                        className={`text-2xl sm:text-3xl lg:text-[34px] font-black text-gray-900 dark:text-white leading-[1.25] tracking-tight text-center mx-auto max-w-4xl [text-wrap:balance] ${
                            subtitle ? "mb-3" : "mb-6"
                        }`}
                    >
                        {mainTitle}
                    </h1>

                    {/* Editorial Subtitle (Centered, conversational hook / question) */}
                    {subtitle && (
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 font-normal leading-relaxed text-center mx-auto max-w-3xl [text-wrap:balance] mb-6">
                            {subtitle}
                        </p>
                    )}
                </header>

                {/* ===== 2. HERO IMAGE (Full containment, never cropped) ===== */}
                {article.thumbnail && (
                    <div className="mb-5">
                        <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-dashboard dark:border-white/10 bg-slate-100/70 dark:bg-card/50 p-2 sm:p-4">
                            <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] max-h-[620px] rounded-xl overflow-hidden flex items-center justify-center">
                                <SafeImage
                                    src={article.thumbnail}
                                    alt={article.title}
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1280px"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI1MTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzk0YTNiOCIvPjwvc3ZnPg=="
                                />
                            </div>
                        </div>
                        {/* Decorative gradient line */}
                        <div className="h-0.5 mt-1 rounded-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                    </div>
                )}

                {/* ===== 3. EDITORIAL BYLINE BAR (Immediately below hero image, Center-Aligned) ===== */}
                <div className="mb-6 sm:mb-7 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 ring-1 ring-gold/40 shadow-sm shrink-0">
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
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {article.author.name || "TheNextTrade Team"}
                            </span>
                        </div>

                        <span className="text-gray-300 dark:text-gray-700">
                            ·
                        </span>

                        {/* Date */}
                        <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gold" />
                            <span>{formattedDate}</span>
                        </div>

                        <span className="text-gray-300 dark:text-gray-700">
                            ·
                        </span>

                        {/* Read time */}
                        <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-gold" />
                            <span>
                                {Math.ceil(article.content.length / 1000)}{" "}
                                min read
                            </span>
                        </div>

                        <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">
                            ·
                        </span>

                        {/* Views */}
                        <div className="flex items-center gap-1.5">
                            <Flame size={13} className="text-gold" />
                            <span>
                                {article.views.toLocaleString()} views
                            </span>
                        </div>

                        {/* Comments count */}
                        {commentCount > 0 && (
                            <>
                                <span className="text-gray-300 dark:text-gray-700">
                                    ·
                                </span>
                                <a
                                    href="#comments"
                                    className="flex items-center gap-1.5 hover:text-gold transition-colors"
                                >
                                    <MessageSquare
                                        size={13}
                                        className="text-gold"
                                    />
                                    <span>{commentCount} comments</span>
                                </a>
                            </>
                        )}

                        {/* Helpful votes */}
                        {voteCount > 0 && (
                            <>
                                <span className="text-gray-300 dark:text-gray-700">
                                    ·
                                </span>
                                <div className="flex items-center gap-1.5 text-gold font-medium">
                                    <ThumbsUp
                                        size={13}
                                        className="fill-gold/30"
                                    />
                                    <span>{voteCount} helpful</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ===== 3. TWO-COLUMN ARTICLE BODY ===== */}
                <div className="flex items-start">
                    {/* --- Left Floating Social Rail (xl screens, zero overlap) --- */}
                    <div className="hidden xl:block shrink-0 w-12 mr-6">
                        <div className="sticky top-28">
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
                        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-dashboard px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5 lg:px-10 lg:pb-10 lg:pt-6">
                            <div
                                className="article-content prose dark:prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-700 dark:prose-headings:text-white prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-dashboard dark:prose-h2:border-white/5 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-gold dark:prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-a:font-semibold prose-img:rounded-2xl prose-img:shadow-md prose-blockquote:border-l-gold prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-2 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-strong:text-gray-700 dark:prose-strong:text-white prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-5 prose-pre:text-sm prose-pre:leading-relaxed prose-pre:overflow-x-auto prose-pre:shadow-inner prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-semibold prose-code:text-gray-800 dark:prose-code:text-gray-200 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_pre_code]:font-mono [&>*:first-child]:!mt-0 [&>h2:first-child]:!mt-0 [&>h3:first-child]:!mt-0 [&>p:first-child]:!mt-0 [&>div:first-child]:!mt-0"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                        processedContent
                                    ),
                                }}
                            />
                        </div>



                        {/* Editorial Disclaimer Footnote */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic text-center px-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
                            <span>
                                Editorial Note: Illustrations and diagrams are
                                educational visualizations and do not constitute
                                financial advice or live broker telemetry.
                            </span>
                        </div>

                        {/* Tags */}
                        {article.tags.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-2">
                                {article.tags.map(({ tag }) => (
                                    <Link
                                        key={tag.id}
                                        href={`/knowledge?tag=${tag.slug}`}
                                        className="px-4 py-2 bg-white dark:bg-card border border-dashboard rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gold hover:text-white hover:border-gold hover:shadow-md hover:shadow-gold/20 transition-all shadow-sm"
                                    >
                                        #{tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Mobile / Inline Social Share (Below article card) */}
                        <div className="mt-8 xl:hidden">
                            <SocialShare
                                title={article.title}
                                slug={slug}
                                vertical={false}
                                articleId={article.id}
                            />
                        </div>

                        {/* Helpful Vote (mobile only — desktop uses sidebar) */}
                        <div className="mt-6 flex items-center gap-3 lg:hidden">
                            <HelpfulButton articleId={article.id} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Did you find this article helpful?
                            </span>
                        </div>

                        {/* Related Articles */}
                        <Suspense
                            fallback={
                                <div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl mt-16" />
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
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-white/5 rounded-2xl animate-pulse" />
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
                                                        <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
                                                        <div className="h-20 w-full bg-gray-200 dark:bg-white/5 rounded-2xl animate-pulse" />
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
                                        <div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl" />
                                        <div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl" />
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
