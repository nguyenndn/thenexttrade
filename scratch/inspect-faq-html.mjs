import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      content: { contains: 'FAQ' }
    },
    take: 3,
    select: {
      title: true,
      slug: true,
      content: true
    }
  });

  console.log(`🔍 Found ${articles.length} articles with FAQ mention in database.`);

  articles.forEach((a, i) => {
    console.log(`\n========================================`);
    console.log(`Article #${i+1}: ${a.title}`);
    console.log(`Slug: ${a.slug}`);
    console.log(`========================================`);
    
    // Find where FAQ section starts
    const faqIndex = a.content.toLowerCase().indexOf('faq');
    if (faqIndex !== -1) {
      // Print 1500 characters starting from FAQ index
      const snippet = a.content.substring(faqIndex - 50, faqIndex + 1500);
      console.log(snippet);
    } else {
      console.log('FAQ text not found in index search.');
    }
  });

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
