

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const oldSlug = "mastering-risk-management:-the-key-to-longevity";
    const newSlug = "mastering-risk-management-the-key-to-longevity"; // Removed colon

    console.log(`Renaming slug from "${oldSlug}" to "${newSlug}"...`);

    // Update Article
    const update1 = await prisma.article.updateMany({
        where: { slug: oldSlug },
        data: { slug: newSlug }
    });

    if (update1.count > 0) {
        console.log("Article Updated!");
    } else {
        console.log("Article not found with old slug. Checking new slug...");
        const check = await prisma.article.findUnique({ where: { slug: newSlug } });
        if (check) console.log("Article already has new slug.");
        else console.log("Article still missing!");
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
