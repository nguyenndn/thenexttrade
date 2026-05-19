const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Find articles with "Vietnam" or standalone "VN" in title, content, excerpt, or slug
    const articles = await prisma.article.findMany({
        where: {
            OR: [
                { title: { contains: 'Vietnam', mode: 'insensitive' } },
                { content: { contains: 'Vietnam', mode: 'insensitive' } },
                { excerpt: { contains: 'Vietnam', mode: 'insensitive' } },
                { slug: { contains: 'vietnam', mode: 'insensitive' } },
                // VN as standalone word (will be filtered by regex below)
                { title: { contains: 'VN', mode: 'insensitive' } },
                { content: { contains: 'VN', mode: 'insensitive' } },
                { excerpt: { contains: 'VN', mode: 'insensitive' } },
            ],
        },
    });

    console.log(`Found ${articles.length} candidate articles. Processing...\n`);

    let updatedCount = 0;

    for (const article of articles) {
        const original = {
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
        };

        // Replace "Vietnam" → "Southeast Asia" (case-insensitive)
        let newTitle = article.title.replace(/Vietnam/gi, 'Southeast Asia');
        let newContent = article.content.replace(/Vietnam/gi, 'Southeast Asia');
        let newExcerpt = (article.excerpt || '').replace(/Vietnam/gi, 'Southeast Asia');
        let newSlug = article.slug.replace(/vietnam/gi, 'southeast-asia');

        // Replace " Vietnamese " → " Southeast Asian " (adjective form)
        newTitle = newTitle.replace(/Vietnamese/gi, 'Southeast Asian');
        newContent = newContent.replace(/Vietnamese/gi, 'Southeast Asian');
        newExcerpt = newExcerpt.replace(/Vietnamese/gi, 'Southeast Asian');

        // Remove standalone "VN" — word boundary match only
        // Matches: "in VN", "VN traders", " VN " but NOT "VNIndex", "ENV", "SVN"
        const vnRegex = /\bVN\b/g;
        newTitle = newTitle.replace(vnRegex, '').replace(/\s{2,}/g, ' ').trim();
        newContent = newContent.replace(vnRegex, '').replace(/  +/g, ' ');
        newExcerpt = newExcerpt.replace(vnRegex, '').replace(/  +/g, ' ').trim();

        // Check if anything actually changed
        const hasChanges =
            newTitle !== original.title ||
            newSlug !== original.slug ||
            newContent !== original.content ||
            newExcerpt !== original.excerpt;

        if (!hasChanges) {
            console.log(`[SKIP] "${article.title}" — no actual Vietnam/VN references found`);
            continue;
        }

        // Log what changed
        console.log(`\n[UPDATE] Article ID: ${article.id}`);
        if (newTitle !== original.title) {
            console.log(`  Title: "${original.title}" → "${newTitle}"`);
        }
        if (newSlug !== original.slug) {
            console.log(`  Slug: "${original.slug}" → "${newSlug}"`);
        }
        if (newExcerpt !== original.excerpt) {
            console.log(`  Excerpt changed: YES`);
        }
        if (newContent !== original.content) {
            // Count replacements
            const vietnamCount = (original.content.match(/Vietnam/gi) || []).length;
            const vnCount = (original.content.match(/\bVN\b/g) || []).length;
            console.log(`  Content: ${vietnamCount} "Vietnam" + ${vnCount} "VN" replacements`);
        }

        // Execute update
        await prisma.article.update({
            where: { id: article.id },
            data: {
                title: newTitle,
                slug: newSlug,
                content: newContent,
                excerpt: newExcerpt || null,
            },
        });

        updatedCount++;
        console.log(`  ✅ Updated successfully`);
    }

    console.log(`\n=== Done. Updated ${updatedCount} of ${articles.length} articles ===`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
