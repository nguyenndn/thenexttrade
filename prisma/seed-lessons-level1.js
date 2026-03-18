/**
 * Seed Level 1 Lessons via FireCrawl + Gemini AI Rewrite
 * 
 * Usage: node prisma/seed-lessons-level1.js
 * Requires: GEMINI_API_KEY, FIRECRAWL_API_KEY in .env.local
 */

const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Level 1 lessons by module
const LEVEL_1_LESSONS = {
  'Welcome to the Market': [
    { order: 1, title: 'The World of Forex', url: 'https://www.babypips.com/learn/forex/what-is-forex' },
    { order: 2, title: 'Your First Trade — How It Works', url: 'https://www.babypips.com/learn/forex/how-do-you-trade-forex' },
    { order: 3, title: 'The 24-Hour Marketplace', url: 'https://www.babypips.com/learn/forex/when-can-you-trade-forex' },
    { order: 4, title: 'The Players Behind the Market', url: 'https://www.babypips.com/learn/forex/who-trades-forex' },
    { order: 5, title: 'Why Traders Choose Forex', url: 'https://www.babypips.com/learn/forex/why-trade-forex' },
  ],
  'Understanding Margin & Orders': [
    { order: 1, title: 'Margin Trading Explained', url: 'https://www.babypips.com/learn/forex/what-is-margin-trading' },
    { order: 2, title: 'Your Account Balance Breakdown', url: 'https://www.babypips.com/learn/forex/what-is-balance' },
    { order: 3, title: 'Unrealized vs Floating P/L', url: 'https://www.babypips.com/learn/forex/unrealized-pl' },
    { order: 4, title: 'Margin Decoded', url: 'https://www.babypips.com/learn/forex/what-is-margin' },
    { order: 5, title: 'How Required Margin Works', url: 'https://www.babypips.com/learn/forex/what-is-required-margin' },
    { order: 6, title: 'Used Margin in Practice', url: 'https://www.babypips.com/learn/forex/what-is-used-margin' },
    { order: 7, title: 'Free Margin & Buying Power', url: 'https://www.babypips.com/learn/forex/what-is-free-margin' },
    { order: 8, title: 'Margin Level — Your Safety Gauge', url: 'https://www.babypips.com/learn/forex/what-is-margin-level' },
    { order: 9, title: 'When Margin Calls Strike', url: 'https://www.babypips.com/learn/forex/margin-call-explained' },
    { order: 10, title: 'Pips — The Smallest Price Move', url: 'https://www.babypips.com/learn/forex/what-is-a-pip' },
    { order: 11, title: 'Lot Sizes — Controlling Your Position', url: 'https://www.babypips.com/learn/forex/what-is-a-lot' },
    { order: 12, title: 'Spreads — The Hidden Cost', url: 'https://www.babypips.com/learn/forex/what-is-spread' },
    { order: 13, title: 'Bid vs Ask — Know the Difference', url: 'https://www.babypips.com/learn/forex/bid-and-ask-price' },
    { order: 14, title: 'Order Types Every Trader Must Know', url: 'https://www.babypips.com/learn/forex/types-of-orders' },
    { order: 15, title: 'Counting Your Profits & Losses', url: 'https://www.babypips.com/learn/forex/how-to-calculate-profit-loss' },
    { order: 16, title: 'Practice Without Risk — Demo Trading', url: 'https://www.babypips.com/learn/forex/demo-trade' },
    { order: 17, title: 'Realistic Expectations in Trading', url: 'https://www.babypips.com/learn/forex/can-you-get-rich-trading-forex' },
  ],
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

async function scrapeUrl(url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`FireCrawl failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const markdown = data.data?.markdown || '';
  if (!markdown || markdown.length < 100) throw new Error('Not enough content scraped');
  
  // Extract images
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
          title: { type: 'string', description: 'Original lesson title' },
          content: { type: 'string', description: 'Full lesson HTML content' },
        },
        required: ['title', 'content'],
      },
    },
  });

  const imageInstructions = images.length > 0
    ? `\n\nAvailable Images (use these placeholders in your HTML where relevant):\n${images.map(img => `- ${img.placeholder}: "${img.alt}"`).join('\n')}\n\nPlace image placeholders between paragraphs where they best illustrate the content.`
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
- Add ⚠️ Common Mistake boxes where relevant (use <blockquote> with ⚠️ emoji)
- End with a 📝 Quick Recap section
- Keep around 800-1200 words
- Do NOT copy any sentences from source
${imageInstructions}

## Writer Persona:
${persona}

## Source Content:
${scrapedContent}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);

  // Replace image placeholders
  let finalContent = parsed.content || '';
  for (const img of images) {
    if (finalContent.includes(img.placeholder)) {
      finalContent = finalContent.replace(
        img.placeholder,
        `<img src="${img.url}" alt="${img.alt}" style="max-width:100%;border-radius:8px;margin:16px 0" />`
      );
    }
  }

  return { title: parsed.title, content: finalContent };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🌱 Seeding Level 1 Lessons via AI Rewrite...');
  console.log('================================================\n');

  // Load writer persona
  const persona = fs.readFileSync(path.join(process.cwd(), 'content', 'writer-persona.md'), 'utf-8');

  // Find Level 1 and its modules
  const level = await prisma.level.findFirst({
    where: { order: 1 },
    include: { modules: { orderBy: { order: 'asc' } } },
  });

  if (!level) {
    console.error('❌ Level 1 not found in DB!');
    return;
  }

  console.log(`📚 Level: ${level.title} (${level.modules.length} modules)\n`);

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const module of level.modules) {
    const lessons = LEVEL_1_LESSONS[module.title];
    if (!lessons) {
      console.log(`  ⚠️  No lessons defined for module "${module.title}", skipping...\n`);
      continue;
    }

    console.log(`  📂 Module: ${module.title} (${lessons.length} lessons)`);

    for (const lesson of lessons) {
      const slug = slugify(lesson.title);
      
      // Check if already exists
      const existing = await prisma.lesson.findUnique({ where: { slug } });
      if (existing) {
        console.log(`     ⏭️  [${lesson.order}] "${lesson.title}" — already exists, skipping`);
        totalSkipped++;
        continue;
      }

      const MAX_RETRIES = 3;
      let success = false;

      for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          // Step 1: Scrape
          process.stdout.write(`     🔄 [${lesson.order}] Scraping "${lesson.title}"${attempt > 1 ? ` (retry ${attempt})` : ''}...`);
          const { content: scraped, images } = await scrapeUrl(lesson.url);
          process.stdout.write(` ✓ (${scraped.length} chars, ${images.length} imgs)\n`);

          // Step 2: AI Rewrite
          process.stdout.write(`         ✍️  Rewriting with AI...`);
          const { title: aiTitle, content: aiContent } = await rewriteContent(scraped, images, persona);
          process.stdout.write(` ✓ (${aiContent.length} chars)\n`);

          // Step 3: Save to DB
          await prisma.lesson.create({
            data: {
              title: lesson.title,
              slug,
              content: aiContent,
              status: 'published',
              moduleId: module.id,
              order: lesson.order,
            },
          });
          console.log(`         ✅ Saved: "${lesson.title}"\n`);
          totalCreated++;
          success = true;

          // Delay between requests
          await sleep(3000);
        } catch (err) {
          const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
          if (isRateLimit && attempt < MAX_RETRIES) {
            console.log(`\n         ⏳ Rate limited, waiting 35s... (attempt ${attempt}/${MAX_RETRIES})`);
            await sleep(35000);
          } else {
            console.log(`\n         ❌ Failed: ${err.message}\n`);
            totalFailed++;
            await sleep(5000);
          }
        }
      }
    }
  }

  console.log('================================================');
  console.log(`✨ Done! Created: ${totalCreated}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
}

main()
  .catch((e) => { console.error('❌ Fatal:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
