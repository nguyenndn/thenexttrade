
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

    // 1. Static Routes - Main pages
    const mainRoutes = [
        { path: '', priority: 1, frequency: 'daily' as const },
        { path: '/about', priority: 0.8, frequency: 'monthly' as const },
        { path: '/academy', priority: 0.9, frequency: 'weekly' as const },
        { path: '/knowledge', priority: 0.9, frequency: 'daily' as const },
        { path: '/articles', priority: 0.9, frequency: 'daily' as const },
        { path: '/brokers', priority: 0.8, frequency: 'weekly' as const },
        { path: '/tools', priority: 0.9, frequency: 'monthly' as const },
        { path: '/contact', priority: 0.5, frequency: 'yearly' as const },
        { path: '/legal/terms-of-service', priority: 0.3, frequency: 'yearly' as const },
        { path: '/legal/privacy-policy', priority: 0.3, frequency: 'yearly' as const },
        { path: '/legal/cookie-policy', priority: 0.3, frequency: 'yearly' as const },
    ];

    // 1b. Tool sub-pages
    const toolRoutes = [ 
        '/tools/risk-calculator',
        '/tools/position-size-calculator',
        '/tools/pip-value-calculator',
        '/tools/margin-calculator',
        '/tools/profit-loss-calculator',
        '/tools/risk-reward-calculator',
        '/tools/drawdown-calculator',
        '/tools/compounding-calculator',
        '/tools/fibonacci-calculator',
        '/tools/pivot-point-calculator',
        '/tools/leverage-calculator',
        '/tools/risk-of-ruin-calculator',
        '/tools/currency-converter',
        '/tools/currency-heat-map',
        '/tools/correlation-matrix',
        '/tools/live-market-rates',
        '/tools/economic-calendar',
        '/tools/market-hours',
    ];

    const routes = [
        ...mainRoutes.map(r => ({
            url: `${baseUrl}${r.path}`,
            lastModified: new Date(),
            changeFrequency: r.frequency,
            priority: r.priority,
        })),
        ...toolRoutes.map(path => ({
            url: `${baseUrl}${path}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
    ];

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
