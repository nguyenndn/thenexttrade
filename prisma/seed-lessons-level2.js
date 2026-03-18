/**
 * Seed Level 2 Lessons via FireCrawl + Gemini AI Rewrite
 * Usage: node prisma/seed-lessons-level2.js
 */
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const LEVEL_ORDER = 2;

const LESSONS_BY_MODULE = {
  'Choosing Your Broker': [
    { order: 1, title: 'How to Pick the Right Broker', url: 'https://www.babypips.com/learn/forex/how-to-pick-a-forex-broker' },
    { order: 2, title: 'Where Broker Profits Come From', url: 'https://www.babypips.com/learn/forex/how-do-forex-brokers-make-money' },
    { order: 3, title: 'Inside the B-Book Model', url: 'https://www.babypips.com/learn/forex/what-is-b-book-broker' },
    { order: 4, title: 'Inside the A-Book Model', url: 'https://www.babypips.com/learn/forex/what-is-a-book-broker' },
    { order: 5, title: 'STP — Straight Through Processing', url: 'https://www.babypips.com/learn/forex/what-is-stp-broker' },
  ],
  'The Three Lenses of Analysis': [
    { order: 1, title: 'Reading Charts — Technical Analysis', url: 'https://www.babypips.com/learn/forex/what-is-technical-analysis' },
    { order: 2, title: 'Reading the Economy — Fundamental Analysis', url: 'https://www.babypips.com/learn/forex/what-is-fundamental-analysis' },
    { order: 3, title: 'Reading the Crowd — Sentiment Analysis', url: 'https://www.babypips.com/learn/forex/what-is-sentiment-analysis' },
    { order: 4, title: 'Finding Your Best Approach', url: 'https://www.babypips.com/learn/forex/which-type-of-analysis-is-best' },
  ],
  'Your First Charts': [
    { order: 1, title: 'The Line Chart — Simplicity First', url: 'https://www.babypips.com/learn/forex/line-chart' },
    { order: 2, title: 'The Bar Chart — More Detail', url: 'https://www.babypips.com/learn/forex/bar-chart' },
    { order: 3, title: 'The Candlestick Chart — The Trader\'s Favorite', url: 'https://www.babypips.com/learn/forex/candlestick-chart' },
  ],
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

async function scrapeUrl(url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  if (!res.ok) throw new Error(`FireCrawl failed (${res.status})`);
  const data = await res.json();
  const markdown = data.data?.markdown || '';
  if (!markdown || markdown.length < 100) throw new Error('Not enough content scraped');
  const images = [];
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match, idx = 0;
  while ((match = imgRegex.exec(markdown)) !== null) {
    const imgUrl = match[2].trim();
    if (imgUrl.startsWith('data:') || imgUrl.includes('1x1') || imgUrl.includes('pixel')) continue;
    idx++;
    images.push({ alt: match[1] || `Image ${idx}`, url: imgUrl, placeholder: `[IMAGE_${idx}]` });
  }
  return { content: markdown.substring(0, 8000), images };
}

async function rewriteContent(scrapedContent, images, persona) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['title', 'content'],
      },
    },
  });
  const imageInstructions = images.length > 0
    ? `\n\nAvailable Images:\n${images.map(img => `- ${img.placeholder}: "${img.alt}"`).join('\n')}`
    : '';
  const prompt = `You are "Captain TheNextTrade", a professional forex trading educator. Read the source article and create a COMPLETELY NEW lesson.

Requirements:
- Create a new, original TITLE
- Write fully rewritten CONTENT covering the same concepts
- Use completely different structure, order, and wording
- Follow the Writer Persona guidelines exactly
- Format in clean HTML (h2, h3, p, ul, li, strong, em, table, etc.)
- Include practical Gold (XAU/USD) examples where relevant
- Add 💡 Key Takeaway boxes (use <blockquote> with 💡 emoji)
- Add ⚠️ Common Mistake boxes where relevant
- End with a 📝 Quick Recap section
- Keep around 800-1200 words
- Do NOT copy any sentences from source
${imageInstructions}

## Writer Persona:
${persona}

## Source Content:
${scrapedContent}`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());
  let finalContent = parsed.content || '';
  for (const img of images) {
    if (finalContent.includes(img.placeholder)) {
      finalContent = finalContent.replace(img.placeholder, `<img src="${img.url}" alt="${img.alt}" style="max-width:100%;border-radius:8px;margin:16px 0" />`);
    }
  }
  return { title: parsed.title, content: finalContent };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log(`🌱 Seeding Level ${LEVEL_ORDER} Lessons...\n${'='.repeat(50)}\n`);
  const persona = fs.readFileSync(path.join(process.cwd(), 'content', 'writer-persona.md'), 'utf-8');
  const level = await prisma.level.findFirst({ where: { order: LEVEL_ORDER }, include: { modules: { orderBy: { order: 'asc' } } } });
  if (!level) { console.error('❌ Level not found!'); return; }
  console.log(`📚 Level: ${level.title} (${level.modules.length} modules)\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const mod of level.modules) {
    const lessons = LESSONS_BY_MODULE[mod.title];
    if (!lessons) { console.log(`  ⚠️  No lessons for "${mod.title}", skipping...\n`); continue; }
    console.log(`  📂 ${mod.title} (${lessons.length} lessons)`);

    for (const lesson of lessons) {
      const slug = slugify(lesson.title);
      if (await prisma.lesson.findUnique({ where: { slug } })) {
        console.log(`     ⏭️  [${lesson.order}] "${lesson.title}" — exists`);
        skipped++; continue;
      }

      let success = false;
      for (let attempt = 1; attempt <= 3 && !success; attempt++) {
        try {
          process.stdout.write(`     🔄 [${lesson.order}] "${lesson.title}"${attempt > 1 ? ` (retry ${attempt})` : ''}...`);
          const { content: scraped, images } = await scrapeUrl(lesson.url);
          process.stdout.write(` scraped ✓`);
          const { content: aiContent } = await rewriteContent(scraped, images, persona);
          process.stdout.write(` → AI ✓ (${aiContent.length} chars)\n`);
          await prisma.lesson.create({ data: { title: lesson.title, slug, content: aiContent, status: 'published', moduleId: mod.id, order: lesson.order } });
          console.log(`         ✅ Saved!\n`);
          created++; success = true;
          await sleep(3000);
        } catch (err) {
          const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
          if (isRateLimit && attempt < 3) { console.log(`\n         ⏳ Rate limited, waiting 35s...`); await sleep(35000); }
          else { console.log(`\n         ❌ ${err.message}\n`); failed++; await sleep(5000); }
        }
      }
    }
  }
  console.log(`${'='.repeat(50)}\n✨ Done! Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
