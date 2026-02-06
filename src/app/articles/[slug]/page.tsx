import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

import { MessageSquare, Calendar, Clock } from "lucide-react";
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

    return (
        <main className="min-h-screen">
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
                        url: `${process.env.NEXT_PUBLIC_APP_URL}/author/${article.author.id}` // Placeholder URL
                    }
                }}
            />

            <div className="bg-slate-50 dark:bg-[#0F1117] min-h-screen pb-24">
                <PublicHeader user={authUser} />

                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
                    <div className="bg-white dark:bg-[#1E2028] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">

                        {/* Featured Image Section */}
                        {article.thumbnail && (
                            <div className="relative w-full aspect-[21/9] md:aspect-[21/8] bg-gray-200 dark:bg-gray-800">
                                <Image
                                    src={article.thumbnail}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                                />
                                <div className="absolute top-6 left-6 z-10">
                                    <span className="bg-[#FF2E5B] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                        {article.category.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="max-w-[1300px] mx-auto px-6 py-10 lg:px-12 lg:py-14">
                            {/* Article Header */}
                            <div className="border-b border-gray-100 dark:border-white/5 pb-8 mb-10">
                                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                            <Image
                                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100"
                                                alt="Author"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">{article.author.name || "Jonathan Doe"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-[#00C888]" />
                                        <span>{formattedDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-[#FF2E5B]" />
                                        <span>{Math.ceil(article.content.length / 1000)} min read</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} className="text-blue-500" />
                                        <span>12 Comments</span>
                                    </div>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {article.title}
                                </h1>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Left Sticky Share & TOC (2 cols) */}
                                <div className="hidden lg:block lg:col-span-2">
                                    <div className="sticky top-32 space-y-8">
                                        <TableOfContents />
                                        <div className="h-px bg-gray-100 dark:bg-white/10 w-1/2 mx-auto"></div>
                                        <SocialShare title={article.title} slug={slug} vertical={true} />
                                    </div>
                                </div>

                                {/* Main Content (7 cols) */}
                                <div className="lg:col-span-7">
                                    <div
                                        className="prose dark:prose-invert prose-lg max-w-none 
                                        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white 
                                        prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-8
                                        prose-a:text-[#00C888] dark:prose-a:text-[#00C888] prose-img:rounded-2xl prose-blockquote:border-l-[#00C888]"
                                        dangerouslySetInnerHTML={{ __html: processedContent }}
                                    />

                                    {/* Tags */}
                                    {article.tags.length > 0 && (
                                        <div className="mt-12 flex flex-wrap gap-2">
                                            {article.tags.map(({ tag }) => (
                                                <Link
                                                    key={tag.id}
                                                    href={`/articles/tags/${tag.slug}`}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-[#00C888] hover:text-white transition-colors"
                                                >
                                                    #{tag.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Related Articles Bottom Grid (Suspended) */}
                                    <Suspense fallback={<div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl mt-16" />}>
                                        <RelatedArticlesBottom categoryId={article.categoryId} currentArticleId={article.id} initialArticles={relatedArticles} />
                                    </Suspense>

                                    {/* Comments (Streamed) */}
                                    <div id="comments" className="mt-16">
                                        <Suspense fallback={
                                            <div className="py-12 border-t border-gray-100 dark:border-white/5 space-y-8">
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
                                </div>

                                {/* Right Sidebar (3 cols) - Suspended */}
                                <aside className="lg:col-span-3">
                                    <Suspense fallback={<div className="space-y-8 sticky top-24"><div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl"></div><div className="h-64 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl"></div></div>}>
                                        <SidebarWidgets />
                                    </Suspense>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MobileBottomNav />
            <SiteFooter />
        </main>
    );
}
