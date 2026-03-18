/**
 * Seed Level 3 Lessons — Chart Reading (5 modules, ~30 lessons)
 * Usage: node prisma/seed-lessons-level3.js
 */
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const LEVEL_ORDER = 3;

const LESSONS_BY_MODULE = {
  'Price Boundaries — Support & Resistance': [
    { order: 1, title: 'Why Price Respects Certain Levels', url: 'https://www.babypips.com/learn/forex/support-and-resistance' },
    { order: 2, title: 'Mapping Key Price Zones', url: 'https://www.babypips.com/learn/forex/drawing-support-and-resistance' },
    { order: 3, title: 'Following the Trend with Lines', url: 'https://www.babypips.com/learn/forex/trend-lines' },
    { order: 4, title: 'Price Channels — Riding the Range', url: 'https://www.babypips.com/learn/forex/channels' },
    { order: 5, title: 'Bounce or Break — Making the Call', url: 'https://www.babypips.com/learn/forex/trading-support-and-resistance' },
    { order: 6, title: 'The Power of Round Numbers', url: 'https://www.babypips.com/learn/forex/psychological-levels' },
  ],
  'Candlestick Language': [
    { order: 1, title: 'Anatomy of a Candlestick', url: 'https://www.babypips.com/learn/forex/what-is-a-japanese-candlestick' },
    { order: 2, title: 'What Body Size Tells You', url: 'https://www.babypips.com/learn/forex/body-size-and-shadows' },
    { order: 3, title: 'Spinning Tops, Marubozu & Doji', url: 'https://www.babypips.com/learn/forex/basic-candlestick-patterns' },
    { order: 4, title: 'One-Candle Signals', url: 'https://www.babypips.com/learn/forex/single-candlestick-patterns' },
    { order: 5, title: 'Two-Candle Setups', url: 'https://www.babypips.com/learn/forex/dual-candlestick-patterns' },
    { order: 6, title: 'Three-Candle Formations', url: 'https://www.babypips.com/learn/forex/triple-candlestick-patterns' },
  ],
  'Fibonacci — The Golden Ratio': [
    { order: 1, title: 'Fibonacci Retracement Zones', url: 'https://www.babypips.com/learn/forex/fibonacci-retracement' },
    { order: 2, title: 'Fibo Meets Support & Resistance', url: 'https://www.babypips.com/learn/forex/fibonacci-and-support-resistance' },
    { order: 3, title: 'Fibo Meets Trend Lines', url: 'https://www.babypips.com/learn/forex/fibonacci-and-trend-lines' },
    { order: 4, title: 'Fibo Meets Candlestick Patterns', url: 'https://www.babypips.com/learn/forex/fibonacci-and-candlesticks' },
    { order: 5, title: 'Extension Levels — Targeting Profits', url: 'https://www.babypips.com/learn/forex/fibonacci-extension' },
    { order: 6, title: 'Using Fibo for Stop Placement', url: 'https://www.babypips.com/learn/forex/fibonacci-as-stop-loss' },
  ],
  'Moving Averages — Following the Flow': [
    { order: 1, title: 'Simple Moving Average (SMA)', url: 'https://www.babypips.com/learn/forex/simple-moving-averages' },
    { order: 2, title: 'Exponential Moving Average (EMA)', url: 'https://www.babypips.com/learn/forex/exponential-moving-averages' },
    { order: 3, title: 'SMA vs EMA — Which to Use?', url: 'https://www.babypips.com/learn/forex/sma-vs-ema' },
    { order: 4, title: 'Moving Averages as Price Magnets', url: 'https://www.babypips.com/learn/forex/using-moving-averages' },
    { order: 5, title: 'The Golden & Death Crossover', url: 'https://www.babypips.com/learn/forex/moving-average-crossover-trading' },
  ],
  'Essential Indicators Toolkit': [
    { order: 1, title: 'Bollinger Bands — Volatility Meter', url: 'https://www.babypips.com/learn/forex/bollinger-bands' },
    { order: 2, title: 'MACD — Momentum & Direction', url: 'https://www.babypips.com/learn/forex/macd' },
    { order: 3, title: 'Parabolic SAR — Trend Stops', url: 'https://www.babypips.com/learn/forex/parabolic-sar' },
    { order: 4, title: 'Stochastic — Overbought & Oversold', url: 'https://www.babypips.com/learn/forex/stochastic' },
    { order: 5, title: 'RSI — Measuring Strength', url: 'https://www.babypips.com/learn/forex/relative-strength-index' },
    { order: 6, title: 'ADX — Is the Trend Strong?', url: 'https://www.babypips.com/learn/forex/average-directional-index' },
    { order: 7, title: 'Ichimoku Cloud — The Complete System', url: 'https://www.babypips.com/learn/forex/ichimoku-kinko-hyo' },
  ],
};

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80); }

async function scrapeUrl(url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  if (!res.ok) throw new Error(`FireCrawl failed (${res.status})`);
  const data = await res.json();
  const md = data.data?.markdown || '';
  if (!md || md.length < 100) throw new Error('Not enough content');
  const images = []; const re = /!\[([^\]]*)\]\(([^)]+)\)/g; let m, i = 0;
  while ((m = re.exec(md)) !== null) { const u = m[2].trim(); if (u.startsWith('data:') || u.includes('1x1')) continue; i++; images.push({ alt: m[1] || `Image ${i}`, url: u, placeholder: `[IMAGE_${i}]` }); }
  return { content: md.substring(0, 8000), images };
}

async function rewriteContent(scraped, images, persona) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview', generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'] } } });
  const imgNote = images.length > 0 ? `\n\nAvailable Images:\n${images.map(i => `- ${i.placeholder}: "${i.alt}"`).join('\n')}` : '';
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
${imgNote}

## Writer Persona:
${persona}

## Source Content:
${scraped}`;
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());
  let content = parsed.content || '';
  for (const img of images) { if (content.includes(img.placeholder)) content = content.replace(img.placeholder, `<img src="${img.url}" alt="${img.alt}" style="max-width:100%;border-radius:8px;margin:16px 0" />`); }
  return { title: parsed.title, content };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`🌱 Seeding Level ${LEVEL_ORDER} Lessons...\n${'='.repeat(50)}\n`);
  const persona = fs.readFileSync(path.join(process.cwd(), 'content', 'writer-persona.md'), 'utf-8');
  const level = await prisma.level.findFirst({ where: { order: LEVEL_ORDER }, include: { modules: { orderBy: { order: 'asc' } } } });
  if (!level) { console.error('❌ Level not found!'); return; }
  console.log(`📚 ${level.title} (${level.modules.length} modules)\n`);
  let created = 0, skipped = 0, failed = 0;

  for (const mod of level.modules) {
    const lessons = LESSONS_BY_MODULE[mod.title];
    if (!lessons) { console.log(`  ⚠️  No lessons for "${mod.title}"\n`); continue; }
    console.log(`  📂 ${mod.title} (${lessons.length} lessons)`);
    for (const lesson of lessons) {
      const slug = slugify(lesson.title);
      if (await prisma.lesson.findUnique({ where: { slug } })) { console.log(`     ⏭️  [${lesson.order}] "${lesson.title}" — exists`); skipped++; continue; }
      let success = false;
      for (let a = 1; a <= 3 && !success; a++) {
        try {
          process.stdout.write(`     🔄 [${lesson.order}] "${lesson.title}"${a > 1 ? ` (retry ${a})` : ''}...`);
          const { content: s, images } = await scrapeUrl(lesson.url);
          process.stdout.write(` scraped ✓`);
          const { content: ai } = await rewriteContent(s, images, persona);
          process.stdout.write(` → AI ✓ (${ai.length} chars)\n`);
          await prisma.lesson.create({ data: { title: lesson.title, slug, content: ai, status: 'published', moduleId: mod.id, order: lesson.order } });
          console.log(`         ✅ Saved!\n`);
          created++; success = true; await sleep(3000);
        } catch (err) {
          if ((err.message?.includes('429') || err.message?.includes('quota')) && a < 3) { console.log(`\n         ⏳ Rate limited, waiting 35s...`); await sleep(35000); }
          else { console.log(`\n         ❌ ${err.message}\n`); failed++; await sleep(5000); }
        }
      }
    }
  }
  console.log(`${'='.repeat(50)}\n✨ Done! Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
