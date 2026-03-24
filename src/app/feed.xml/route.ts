
import RSS from "rss";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export async function GET() {
    const feed = new RSS({
        title: "The Next Trade",
        description: "Latest insights, analysis, and educational content from The Next Trade.",
        site_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        feed_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feed.xml`,
        language: "en-us",
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}, The Next Trade`,
    });

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
            url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/articles/${article.slug}`,
            guid: article.id,
            date: article.publishedAt || article.createdAt,
            author: article.author.name || "The Next Trade Team",
            categories: [article.category.name],
        });
    });

    return new Response(feed.xml({ indent: true }), {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Cache-Control": "s-maxage=3600, stale-while-revalidate", // Cache for 1 hour
        },
    });
}
