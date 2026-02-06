

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing article slugs...");
    const articles = await prisma.article.findMany();

    for (const article of articles) {
        const originalSlug = article.slug;
        // Replace colons and other special chars with hyphens or remove them
        // Logic: 
        // 1. Lowercase
        // 2. Replace : with empty string (or hyphen if it separates words, but usually : follows a word)
        // 3. Replace multiple hyphens with single hyphen
        // 4. Remove other non-alphanumeric chars (except hyphen)

        let newSlug = originalSlug.toLowerCase();
        newSlug = newSlug.replace(/:/g, ''); // Remove colons entirely (Key to Longevity -> Key to Longevity)

        // If user prefers replacing with hyphen:
        // newSlug = newSlug.replace(/:/g, '-'); 

        // My previous manual fix was replacing : with - which resulted in double hyphen if space existed?
        // "Management: The" -> "management-the" (if I remove colon and trim spaces)
        // "Management: The" -> "management--the" (if I replace : with - and space with -)

        // Better slugify logic:
        // 1. decodeURI (just in case)
        // 2. remove special chars
        // 3. space to hyphen

        // Ideally we assume the title is the source of truth if the slug is bad.
        // But let's just sanitize the existing slug to be safe.

        // Simple robust fix for the reported issue: Remove ':'
        newSlug = newSlug.replace(/:/g, '');
        // Replace multiple spaces/hyphens with single hyphen
        newSlug = newSlug.replace(/[\s-]+/g, '-');
        // Remove leading/trailing hyphens
        newSlug = newSlug.replace(/^-+|-+$/g, '');

        if (newSlug !== originalSlug) {
            console.log(`Fixing: "${originalSlug}" -> "${newSlug}"`);
            try {
                await prisma.article.update({
                    where: { id: article.id },
                    data: { slug: newSlug }
                });
                console.log("  Success.");
            } catch (err) {
                console.error("  Failed (probably duplicate slug):", (err as any).message);
            }
        }
    }
    console.log("Finished sanitization.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
