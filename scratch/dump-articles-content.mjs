import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function extractInlineImages(content) {
  const images = [];

  // HTML <img src="...">
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgTagRegex.exec(content)) !== null) {
    const src = match[0];
    const srcUrl = match[1];
    if (srcUrl && !srcUrl.startsWith('data:') && srcUrl.length > 5) {
      images.push({ tag: src, url: srcUrl, type: 'HTML' });
    }
  }

  // Markdown ![alt](url)
  const mdRegex = /(!\[([^\]]*)\]\(([^)]+)\))/g;
  while ((match = mdRegex.exec(content)) !== null) {
    const fullTag = match[1];
    const altText = match[2];
    const srcUrl = match[3];
    if (srcUrl && !srcUrl.startsWith('data:') && srcUrl.length > 5) {
      images.push({ tag: fullTag, url: srcUrl, alt: altText, type: 'Markdown' });
    }
  }

  return images;
}

function getHeadingsAndOutline(content) {
  const headings = [];
  const headingRegex = /<h([2-3])[^>]*>([^<]+)<\/h[2-3]>/gi;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ level: parseInt(match[1]), text: match[2].trim() });
  }

  // Fallback to markdown headings if HTML ones aren't found
  if (headings.length === 0) {
    const mdHeadingRegex = /^(##|###)\s+(.+)$/gm;
    while ((match = mdHeadingRegex.exec(content)) !== null) {
      headings.push({ level: match[1].length, text: match[2].trim() });
    }
  }

  return headings;
}

async function main() {
  console.log('⚡ Querying published articles from database...');
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      content: true,
      excerpt: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📊 Found ${articles.length} published articles.`);

  const results = articles.map(a => {
    const inlineImages = extractInlineImages(a.content);
    const headings = getHeadingsAndOutline(a.content);
    
    // Get brief word count
    const wordCount = a.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;

    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category?.name || 'N/A',
      thumbnail: a.thumbnail,
      excerpt: a.excerpt || '',
      wordCount,
      headings: headings.slice(0, 8), // top 8 headings for outline
      inlineImages,
    };
  });

  const outputPath = path.join(process.cwd(), 'scratch', 'articles-content-summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`✅ Saved article content summaries to: ${outputPath}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
