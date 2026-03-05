import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

import { MessageSquare, Calendar, Clock, Home, ChevronRight, Share2, Link as LinkIcon } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CommentsFetcher } from "@/components/comments/CommentsFetcher";
import { getAuthUser } from "@/lib/auth-cache";
import SocialShare from "@/components/features/SocialShare";
import RelatedArticlesBottom from "@/components/features/RelatedArticlesBottom";
import SidebarWidgets from "@/components/features/SidebarWidgets";
import { Metadata } from "next";
import ReadingProgressBar from "@/components/features/ReadingProgressBar";
import TableOfContents from "@/components/features/TableOfContents";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ViewCounter } from "@/components/features/ViewCounter";
import { unstable_cache } from "next/cache";
import { JsonLd } from "@/components/seo/JsonLd";
import DOMPurify from "isomorphic-dompurify";

// CACHING: Cache article data for 60 seconds
const getCachedArticle = unstable_cache(
    async (slug: string) => {
        // 1. Fast Path: Strict Slug Lookup (Indexed)
        const article = await prisma.article.findUnique({
            where: { slug },
            include: {
                author: {
                    select: { id: true, name: true, image: true }
                },
                category: true,
                tags: { include: { tag: true } }
            }
        });

        if (article) return article;

        // 2. Fallback: Fuzzy Search (Slower, only acts if slug not found)
        // This handles legacy URLs or title-based slugs if strictly needed
        return await prisma.article.findFirst({
            where: {
                title: { equals: slug.replace(/-/g, ' '), mode: 'insensitive' },
                status: 'PUBLISHED'
            },
            include: {
                author: {
                    select: { id: true, name: true, image: true }
                },
                category: true,
                tags: { include: { tag: true } }
            }
        });
    },
    ['article-by-slug'], // Key parts
    { revalidate: 60, tags: ['articles'] } // Options
);

// SSG: Pre-render the top 50 most recent articles at build time
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const article = await getCachedArticle(slug);

    if (!article) {
        return {
            title: 'Article Not Found | The Next Trade',
        };
    }

    return {
        title: `${article.title} | The Next Trade`,
        description: article.excerpt || `Read ${article.title} on The Next Trade.`,
        openGraph: {
            title: article.title,
            description: article.excerpt || undefined,
            type: 'article',
            images: article.thumbnail ? [article.thumbnail] : undefined,
            publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
            section: article.category.name,
            tags: ['Forex', 'Trading', 'Finance']
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt || undefined,
            images: article.thumbnail ? [article.thumbnail] : undefined,
        }
    };
}


// Helper to generate IDs from text
const generateId = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Parallel Fetching: User, Article & Related Articles (Spec 3.4)
    const [authUser, article, relatedArticles] = await Promise.all([
        getAuthUser(),
        getCachedArticle(slug),
        prisma.article.findMany({
            where: {
                status: 'PUBLISHED',
                slug: { not: slug }
            },
            take: 3,
            orderBy: { views: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                thumbnail: true,
                createdAt: true
            }
        })
    ]);

    let currentUser = null;

    if (authUser) {
        currentUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { id: true, name: true, image: true }
        });
    }

    if (!article) return notFound();

    // Non-blocking view update (we can just fire and forget or await it if we want strict consistency, spec suggests await in flow or after)
    // We'll keep it simple and await it for now, or just not await to be faster? 
    // Spec moved it to after() or kept it after Promise.all. 
    // We will place it here.
    await prisma.article.update({
        where: { id: article.id },
        data: { views: { increment: 1 } }
    });

    const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Inject IDs into H2 and H3 tags for TOC
    const cleanContent = DOMPurify.sanitize(article.content);

    const processedContent = cleanContent.replace(/<h([23])((?: [^>]*)?)>(.*?)<\/h\1>/g, (match, level, attrs, content) => {
        const text = content.replace(/<[^>]*>/g, ''); // Strip tags to get text for ID
        const id = generateId(text);
        return `<h${level} id="${id}" class="scroll-mt-32"${attrs}>${content}</h${level}>`;
    });

    // Get real comment count
    const commentCount = await prisma.comment.count({
        where: { articleId: article.id }
    });

    return (
        <main className="min-h-screen dark:bg-[#0F1117]" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 80px, #f8fafc 400px)' }}>
            <ReadingProgressBar />
            <ViewCounter articleId={article.id} />
            <JsonLd
                type="Article"
                data={{
                    headline: article.title,
                    description: article.excerpt || article.title,
                    image: article.thumbnail ? [article.thumbnail] : [],
                    datePublished: (article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt)).toISOString(),
                    dateModified: new Date(article.updatedAt).toISOString(),
                    author: {
                        name: article.author.name || "GSN Team",
                        url: `${process.env.NEXT_PUBLIC_APP_URL}/author/${article.author.id}`
                    }
                }}
            />

            <PublicHeader user={authUser} />

            {/* ===== HERO SECTION ===== */}
            <div className="relative w-full mt-24">

                {article.thumbnail && (
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-800">
                        <Image
                            src={article.thumbnail}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1280px"
                        />
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        {/* Category badge */}
                        <div className="absolute top-5 left-6">
                            <span className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                                {article.category.name}
                            </span>
                        </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== MAIN CONTENT AREA ===== */}
            <div className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 ${article.thumbnail ? 'mt-8' : 'pt-28 sm:pt-32'}`}>
                
                {/* ===== BREADCRUMB BAR ===== */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-[#00C888]/80 dark:bg-[#00C888]/15 rounded-xl px-5 py-3 ${article.thumbnail ? 'mb-6' : 'mb-8'} shadow-sm border border-[#00C888]/20`}>
                    <div className="flex items-center gap-2 text-sm text-gray-100 dark:text-gray-400 font-medium">
                        <Home size={14} className="shrink-0" />
                        <Link href="/" className="hover:text-white transition-colors shrink-0">Home</Link>
                        <ChevronRight size={14} className="text-white/40 shrink-0" />
                        <Link href="/articles" className="hover:text-white transition-colors shrink-0">Knowledge</Link>
                        <ChevronRight size={14} className="text-white/40 shrink-0" />
                        <span className="text-white font-semibold truncate max-w-[150px] sm:max-w-[300px]">{article.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 bg-white/15 dark:bg-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-sm text-white font-semibold">Share:</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors" title="Share via Social">
                            <Share2 size={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors" title="Copy Link">
                            <LinkIcon size={14} />
                        </button>
                    </div>
                </div>

                {/* ===== ARTICLE HEADER ===== */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-6">
                        {article.title}
                    </h1>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {/* Author */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 ring-2 ring-white dark:ring-[#1E2028] shadow-sm">
                                <Image
                                    src={article.author.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100"}
                                    alt={article.author.name || "Author"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{article.author.name || "GSN Team"}</span>
                        </div>

                        <span className="w-px h-4 bg-gray-200 dark:bg-white/10" />

                        {/* Date */}
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-primary" />
                            <span>{formattedDate}</span>
                        </div>

                        <span className="w-px h-4 bg-gray-200 dark:bg-white/10" />

                        {/* Read time */}
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" />
                            <span>{Math.ceil(article.content.length / 1000)} min read</span>
                        </div>

                        {commentCount > 0 && (
                            <>
                                <span className="w-px h-4 bg-gray-200 dark:bg-white/10" />
                                <a href="#comments" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <MessageSquare size={14} />
                                    <span>{commentCount} Comments</span>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* ===== 2-COLUMN LAYOUT ===== */}
                <div className="flex items-stretch">
                    
                    {/* --- Sticky Social Share (overlaps card left border) --- */}
                    <div className="hidden lg:block shrink-0 z-10 -mr-[26px]">
                        <div className="sticky top-24 pt-8">
                            <SocialShare title={article.title} slug={slug} vertical={true} />
                        </div>
                    </div>

                    {/* --- Main Content Column --- */}
                    <article className="flex-1 min-w-0">
                        {/* Content Card */}
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6 sm:p-8 lg:p-10">
                            <div
                                className="prose dark:prose-invert prose-lg max-w-none 
                                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-white 
                                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-white/5
                                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                                prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                                prose-a:text-primary dark:prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
                                prose-img:rounded-xl prose-img:shadow-md 
                                prose-blockquote:border-l-primary prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-2
                                prose-li:text-gray-600 dark:prose-li:text-gray-300
                                prose-strong:text-gray-900 dark:prose-strong:text-white
                                prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-semibold"
                                dangerouslySetInnerHTML={{ __html: processedContent }}
                            />
                        </div>

                        {/* Tags */}
                        {article.tags.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-2">
                                {article.tags.map(({ tag }) => (
                                    <Link
                                        key={tag.id}
                                        href={`/articles/tags/${tag.slug}`}
                                        className="px-4 py-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                    >
                                        #{tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}



                        {/* Related Articles */}
                        <Suspense fallback={<div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl mt-16" />}>
                            <RelatedArticlesBottom categoryId={article.categoryId} currentArticleId={article.id} initialArticles={relatedArticles} />
                        </Suspense>

                        {/* Comments */}
                        <div id="comments" className="mt-16">
                            <Suspense fallback={
                                <div className="py-12 border-t border-gray-200 dark:border-white/10 space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                                        <div className="h-8 w-40 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
                                    </div>
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5 animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                                                    <div className="h-20 w-full bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            }>
                                <CommentsFetcher articleId={article.id} currentUser={currentUser} />
                            </Suspense>
                        </div>
                    </article>

                    {/* --- Sidebar Column --- */}
                    <aside className="hidden lg:block w-[340px] lg:w-[360px] shrink-0 ml-6 xl:ml-8">
                        <div className="sticky top-24 space-y-6">
                            {/* TOC */}
                            <TableOfContents />
                            {/* Sidebar Widgets */}
                            <Suspense fallback={<div className="space-y-6"><div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl"></div><div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl"></div></div>}>
                                <SidebarWidgets />
                            </Suspense>
                        </div>
                    </aside>
                </div>
            </div>



            <div className="pb-24" />
            <MobileBottomNav />
            <SiteFooter />
        </main>
    );
}
