
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkArticle() {
    const slug = 'top-5-gold-analysis-secrets-pro-traders-use-1768540062010-1';
    console.log(`Checking article with slug: ${slug}`);

    const article = await prisma.article.findUnique({
        where: { slug },
    });

    if (article) {
        console.log('✅ Article Found:');
        console.log(JSON.stringify(article, null, 2));
    } else {
        console.log('❌ Article NOT found in database.');

        // Try fuzzy search
        console.log('Attempting fuzzy search...');
        const similar = await prisma.article.findFirst({
            where: {
                slug: { contains: 'top-5-gold' }
            }
        });
        if (similar) {
            console.log('Found similar article:', similar.slug);
        }
    }
}

checkArticle()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
