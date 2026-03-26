
import RSS from "rss";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const feed = new RSS({
        title: "The Next Trade",
        description: "Latest insights, analysis, and educational content from The Next Trade.",
        site_url: baseUrl,
        feed_url: `${baseUrl}/feed.xml`,
        language: "en-us",
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}, The Next Trade`,
    });

    // 1. Articles
    const articles = await prisma.article.findMany({
        where: {
            status: "PUBLISHED",
        },
        orderBy: [
            { publishedAt: "desc" },
            { createdAt: "desc" }
        ],
        take: 50,
        include: {
            author: true,
            category: true,
        },
    });

    articles.forEach((article) => {
        feed.item({
            title: article.title,
            description: article.excerpt || article.content.substring(0, 160) + "...",
            url: `${baseUrl}/articles/${article.slug}`,
            guid: article.id,
            date: article.publishedAt || article.createdAt,
            author: article.author.name || "The Next Trade Team",
            categories: [article.category.name],
        });
    });

    // 2. Public Academy Lessons (freemium content for SEO)
    const publicLessons = await prisma.lesson.findMany({
        where: {
            module: {
                level: {
                    accessLevel: "PUBLIC",
                },
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
            id: true,
            title: true,
            slug: true,
            updatedAt: true,
            module: {
                select: {
                    title: true,
                    level: { select: { title: true } },
                },
            },
        },
    });

    publicLessons.forEach((lesson) => {
        feed.item({
            title: `[Academy] ${lesson.title}`,
            description: `Free lesson from ${lesson.module.level.title} — ${lesson.module.title}. Start learning forex trading with TheNextTrade Academy.`,
            url: `${baseUrl}/academy/lesson/${lesson.slug}`,
            guid: `academy-${lesson.id}`,
            date: lesson.updatedAt,
            author: "The Next Trade Academy",
            categories: ["Academy", lesson.module.level.title],
        });
    });

    return new Response(feed.xml({ indent: true }), {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Cache-Control": "s-maxage=3600, stale-while-revalidate", // Cache for 1 hour
        },
    });
}
