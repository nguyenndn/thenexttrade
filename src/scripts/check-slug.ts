

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const titlePart = "Mastering Risk";
    console.log(`Searching for article with title containing "${titlePart}"...`);

    const articles = await prisma.article.findMany({
        where: {
            title: { contains: titlePart }
        }
    });

    if (articles.length === 0) {
        console.log("No articles found!");
    } else {
        articles.forEach(a => {
            console.log("Found Article:");
            console.log(" - ID:", a.id);
            console.log(" - Title:", a.title);
            console.log(" - Slug:", a.slug);
            console.log(" - Encoded Slug (URI):", encodeURIComponent(a.slug));
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
