const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Get a few articles with thumbnails to see the URL pattern
    const articles = await p.article.findMany({
        where: { thumbnail: { not: null } },
        select: { slug: true, thumbnail: true },
        take: 5,
    });

    console.log('=== Current thumbnail URL patterns ===\n');
    for (const a of articles) {
        console.log(`Slug: ${a.slug}`);
        console.log(`Thumbnail: ${a.thumbnail}`);
        console.log('---');
    }

    // Count articles without thumbnails
    const noThumb = await p.article.count({ where: { thumbnail: null } });
    const withThumb = await p.article.count({ where: { thumbnail: { not: null } } });
    console.log(`\nArticles WITH thumbnail: ${withThumb}`);
    console.log(`Articles WITHOUT thumbnail: ${noThumb}`);
}

main().catch(console.error).finally(() => p.$disconnect());
