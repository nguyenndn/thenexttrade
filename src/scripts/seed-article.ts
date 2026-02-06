

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const slug = "mastering-risk-management:-the-key-to-longevity"; // URL user tried
    // Clean slug to match what code might look for (URL typically encodes :, but let's be safe)
    // The code in ArticlePage does: slug.replace(/-/g, ' ') for title search

    console.log("Checking for article...");

    // Ensure we have a user and category first
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users found! Please login first to create a user.");
        return;
    }

    let category = await prisma.category.findFirst({ where: { slug: "education" } });
    if (!category) {
        category = await prisma.category.create({
            data: { name: "Education", slug: "education" }
        });
    }

    const article = await prisma.article.findFirst({
        where: { slug: slug }
    });

    if (article) {
        console.log("Article already exists:", article.title);
    } else {
        console.log("Creating demo article...");
        await prisma.article.create({
            data: {
                title: "Mastering Risk Management: The Key to Longevity",
                slug: slug,
                content: `
# Mastering Risk Management

Risk management is the single most important factor in your trading success.

## The 2% Rule
Never risk more than **1-2%** of your account on a single trade.

## Psychology
Fear and greed are your enemies. Stick to your plan.
            `,
                excerpt: "Why 90% of traders fail and how proper position sizing can keep you in the 10%.",
                authorId: user.id,
                categoryId: category.id,
                status: "PUBLISHED",
                thumbnail: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2664&auto=format&fit=crop"
            }
        });
        console.log("Article created successfully!");
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
