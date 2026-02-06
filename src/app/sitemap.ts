
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

    // 1. Static Routes
    const routes = [
        '',
        '/about',
        '/academy',
        '/articles',
        '/courses',
        '/economic-calendar',
        '/tools/risk-calculator',
        '/tools/market-hours',
        '/contact',
        '/pricing',
        '/legal/terms-of-service',
        '/legal/privacy-policy',
        '/legal/cookie-policy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // 2. Fetch Articles
    const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: {
            slug: true,
            updatedAt: true,
            category: { select: { slug: true } }
        },
        take: 5000
    });

    const articleUrls = articles.map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // 3. Fetch Academy Lessons
    const lessons = await prisma.lesson.findMany({
        select: {
            slug: true,
            updatedAt: true
        }
    });

    const lessonUrls = lessons.map((lesson) => ({
        url: `${baseUrl}/academy/lesson/${lesson.slug}`,
        lastModified: lesson.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // 4. Fetch Categories
    const categories = await prisma.category.findMany({
        select: { slug: true, updatedAt: true }
    });

    const categoryUrls = categories.map((cat) => ({
        url: `${baseUrl}/articles/category/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // 5. Fetch Tags
    const tags = await prisma.tag.findMany({
        select: { slug: true }
    });

    const tagUrls = tags.map((tag) => ({
        url: `${baseUrl}/articles/tag/${tag.slug}`,
        lastModified: new Date(), // Tags don't have updatedAt, use current date
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [...routes, ...categoryUrls, ...articleUrls, ...lessonUrls, ...tagUrls];
}
