/**
 * Seed Levels 4-11 Lessons via FireCrawl + Gemini AI Rewrite
 * Usage: node prisma/seed-lessons-remaining.js
 */
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// ALL remaining lessons organized by Level -> Module -> Lessons
const ALL_LEVELS = {
  4: {
    'Combining Your Indicators': [
      { order: 1, title: 'Building an Indicator Stack', url: 'https://www.babypips.com/learn/forex/combining-indicators' },
      { order: 2, title: 'Leading vs Lagging — Know the Difference', url: 'https://www.babypips.com/learn/forex/leading-vs-lagging-indicators' },
      { order: 3, title: 'Indicator Cheat Sheet', url: 'https://www.babypips.com/learn/forex/indicator-cheat-sheet' },
    ],
    'Chart Patterns That Pay': [
      { order: 1, title: 'Head & Shoulders — The Classic Reversal', url: 'https://www.babypips.com/learn/forex/head-and-shoulders' },
      { order: 2, title: 'Double Top & Bottom — Twin Signals', url: 'https://www.babypips.com/learn/forex/double-top-double-bottom' },
      { order: 3, title: 'Triangles — Compression Before Explosion', url: 'https://www.babypips.com/learn/forex/triangles' },
      { order: 4, title: 'Flags & Pennants — Quick Continuation', url: 'https://www.babypips.com/learn/forex/flags-and-pennants' },
      { order: 5, title: 'Wedges — Narrowing Momentum', url: 'https://www.babypips.com/learn/forex/wedges' },
      { order: 6, title: 'Rectangles — Range-Bound Setups', url: 'https://www.babypips.com/learn/forex/rectangles' },
    ],
    'Pivot Points — Institutional Levels': [
      { order: 1, title: 'What Pivot Points Reveal', url: 'https://www.babypips.com/learn/forex/what-are-pivot-points' },
      { order: 2, title: 'Calculating Pivot Levels', url: 'https://www.babypips.com/learn/forex/how-to-calculate-pivot-points' },
      { order: 3, title: 'Trading with Pivots in Practice', url: 'https://www.babypips.com/learn/forex/trading-with-pivot-points' },
    ],
  },
  5: {
    'Divergence Trading': [
      { order: 1, title: 'Spotting Regular Divergence', url: 'https://www.babypips.com/learn/forex/regular-divergence' },
      { order: 2, title: 'Spotting Hidden Divergence', url: 'https://www.babypips.com/learn/forex/hidden-divergence' },
      { order: 3, title: 'Turning Divergences Into Trades', url: 'https://www.babypips.com/learn/forex/how-to-trade-divergence' },
      { order: 4, title: 'Divergence Quick Reference', url: 'https://www.babypips.com/learn/forex/divergence-cheat-sheet' },
    ],
    'Reading Market Conditions': [
      { order: 1, title: 'Trending vs Sideways — What Are You In?', url: 'https://www.babypips.com/learn/forex/trending-vs-ranging-market' },
      { order: 2, title: 'Pullback or Full Reversal?', url: 'https://www.babypips.com/learn/forex/retracements-or-reversals' },
      { order: 3, title: 'Catching Real Breakouts', url: 'https://www.babypips.com/learn/forex/breakout-trading' },
      { order: 4, title: 'Surviving Fakeouts', url: 'https://www.babypips.com/learn/forex/fakeout-trading' },
    ],
    'The Multi-Timeframe Edge': [
      { order: 1, title: 'Why One Timeframe Isn\'t Enough', url: 'https://www.babypips.com/learn/forex/multiple-time-frame-analysis' },
      { order: 2, title: 'Top-Down Analysis in Action', url: 'https://www.babypips.com/learn/forex/top-down-analysis' },
      { order: 3, title: 'The Best Timeframe Pairings', url: 'https://www.babypips.com/learn/forex/best-time-frame-combos' },
    ],
  },
  6: {
    'What Drives Currencies?': [
      { order: 1, title: 'The Forces Behind Price Movement', url: 'https://www.babypips.com/learn/forex/what-moves-the-forex-market' },
      { order: 2, title: 'Interest Rates — The #1 Driver', url: 'https://www.babypips.com/learn/forex/interest-rates' },
      { order: 3, title: 'Central Bank Policies Decoded', url: 'https://www.babypips.com/learn/forex/monetary-policy' },
      { order: 4, title: 'GDP — Measuring Economic Health', url: 'https://www.babypips.com/learn/forex/gross-domestic-product' },
      { order: 5, title: 'Jobs Data & Market Reactions', url: 'https://www.babypips.com/learn/forex/employment-data' },
      { order: 6, title: 'Inflation — The Silent Currency Killer', url: 'https://www.babypips.com/learn/forex/inflation' },
    ],
    'Trading Around News Events': [
      { order: 1, title: 'Why News Moves Markets', url: 'https://www.babypips.com/learn/forex/news-trading' },
      { order: 2, title: 'Trading with a Forecast Bias', url: 'https://www.babypips.com/learn/forex/directional-bias' },
      { order: 3, title: 'Trading Without Predicting Direction', url: 'https://www.babypips.com/learn/forex/non-directional-bias' },
    ],
    'Measuring the Crowd': [
      { order: 1, title: 'Market Sentiment Explained', url: 'https://www.babypips.com/learn/forex/market-sentiment' },
      { order: 2, title: 'The COT Report Breakdown', url: 'https://www.babypips.com/learn/forex/cot-report' },
      { order: 3, title: 'Extracting Signals from COT Data', url: 'https://www.babypips.com/learn/forex/how-to-use-cot-report' },
    ],
  },
  7: {
    'Cross-Market Connections': [
      { order: 1, title: 'How Markets Talk to Each Other', url: 'https://www.babypips.com/learn/forex/intermarket-analysis' },
      { order: 2, title: 'Gold & the Dollar — The Old Rivalry', url: 'https://www.babypips.com/learn/forex/gold-and-forex' },
      { order: 3, title: 'Oil Prices & Currency Impact', url: 'https://www.babypips.com/learn/forex/oil-and-forex' },
      { order: 4, title: 'Bond Yields — The Smart Money Signal', url: 'https://www.babypips.com/learn/forex/bond-yields-and-forex' },
      { order: 5, title: 'When Stocks Move Currencies', url: 'https://www.babypips.com/learn/forex/stocks-and-forex' },
    ],
    'Beyond Major Pairs — Currency Crosses': [
      { order: 1, title: 'What Are Cross Pairs?', url: 'https://www.babypips.com/learn/forex/currency-crosses' },
      { order: 2, title: 'EUR Cross Opportunities', url: 'https://www.babypips.com/learn/forex/euro-crosses' },
      { order: 3, title: 'JPY Cross Opportunities', url: 'https://www.babypips.com/learn/forex/yen-crosses' },
      { order: 4, title: 'GBP Cross Opportunities', url: 'https://www.babypips.com/learn/forex/pound-crosses' },
    ],
  },
  8: {
    'Designing Your Edge': [
      { order: 1, title: 'Why Every Trader Needs a Plan', url: 'https://www.babypips.com/learn/forex/trading-plan' },
      { order: 2, title: 'Building Your Own Trading System', url: 'https://www.babypips.com/learn/forex/create-your-own-trading-system' },
      { order: 3, title: 'Backtesting — Proving Your System Works', url: 'https://www.babypips.com/learn/forex/backtesting' },
    ],
    'Your Trading Journal': [
      { order: 1, title: 'The Power of Tracking Every Trade', url: 'https://www.babypips.com/learn/forex/trading-journal' },
      { order: 2, title: 'Setting Up Your Journal System', url: 'https://www.babypips.com/learn/forex/setting-up-your-journal' },
      { order: 3, title: 'Learning from Your Own Data', url: 'https://www.babypips.com/learn/forex/reviewing-your-journal' },
    ],
  },
  9: {
    'Protecting Your Capital': [
      { order: 1, title: 'Why Most Traders Blow Their Accounts', url: 'https://www.babypips.com/learn/forex/biggest-cause-of-failure' },
      { order: 2, title: 'Right-Sizing Every Position', url: 'https://www.babypips.com/learn/forex/position-sizing' },
      { order: 3, title: 'Stop Loss Placement That Works', url: 'https://www.babypips.com/learn/forex/stop-loss' },
      { order: 4, title: 'Risk vs Reward — The Math That Matters', url: 'https://www.babypips.com/learn/forex/reward-to-risk-ratio' },
      { order: 5, title: 'Scaling In & Out of Positions', url: 'https://www.babypips.com/learn/forex/scaling-in-and-out' },
      { order: 6, title: 'Currency Correlation & Hidden Risk', url: 'https://www.babypips.com/learn/forex/currency-correlation' },
    ],
  },
  10: {
    'Mastering Your Inner Game': [
      { order: 1, title: 'Building a Winning Mindset', url: 'https://www.babypips.com/learn/forex/trading-mindset' },
      { order: 2, title: 'Taming Fear & Greed', url: 'https://www.babypips.com/learn/forex/fear-and-greed' },
      { order: 3, title: 'Recovering from Losing Streaks', url: 'https://www.babypips.com/learn/forex/losing-streaks' },
      { order: 4, title: 'The Discipline Advantage', url: 'https://www.babypips.com/learn/forex/discipline' },
      { order: 5, title: 'What Separates Winners from Losers', url: 'https://www.babypips.com/learn/forex/traits-of-successful-traders' },
    ],
  },
  11: {
    'Your Pre-Launch Checklist': [
      { order: 1, title: 'Forex Scams — Red Flags to Watch', url: 'https://www.babypips.com/learn/forex/forex-scams' },
      { order: 2, title: 'Mistakes That Cost Real Money', url: 'https://www.babypips.com/learn/forex/common-forex-mistakes' },
      { order: 3, title: 'Prop Firms — Trading Other People\'s Money', url: 'https://www.babypips.com/learn/forex/prop-trading' },
      { order: 4, title: 'Trust the Process, Not the Outcome', url: 'https://www.babypips.com/learn/forex/trust-the-process' },
      { order: 5, title: 'Why There\'s No Perfect System', url: 'https://www.babypips.com/learn/forex/no-holy-grail' },
    ],
  },
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
  console.log(`🌱 Seeding Levels 4-11 Lessons...\n${'='.repeat(50)}\n`);
  const persona = fs.readFileSync(path.join(process.cwd(), 'content', 'writer-persona.md'), 'utf-8');

  let totalCreated = 0, totalSkipped = 0, totalFailed = 0;

  for (const [levelOrder, modules] of Object.entries(ALL_LEVELS)) {
    const level = await prisma.level.findFirst({ where: { order: Number(levelOrder) }, include: { modules: { orderBy: { order: 'asc' } } } });
    if (!level) { console.log(`❌ Level ${levelOrder} not found!`); continue; }
    console.log(`\n📚 Level ${levelOrder}: ${level.title} (${level.modules.length} modules)`);

    for (const mod of level.modules) {
      const lessons = modules[mod.title];
      if (!lessons) { console.log(`  ⚠️  No lessons for "${mod.title}"`); continue; }
      console.log(`  📂 ${mod.title} (${lessons.length} lessons)`);

      for (const lesson of lessons) {
        const slug = slugify(lesson.title);
        if (await prisma.lesson.findUnique({ where: { slug } })) { console.log(`     ⏭️  [${lesson.order}] "${lesson.title}" — exists`); totalSkipped++; continue; }
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
            totalCreated++; success = true; await sleep(3000);
          } catch (err) {
            if ((err.message?.includes('429') || err.message?.includes('quota')) && a < 3) { console.log(`\n         ⏳ Rate limited, waiting 35s...`); await sleep(35000); }
            else { console.log(`\n         ❌ ${err.message}\n`); totalFailed++; await sleep(5000); }
          }
        }
      }
    }
  }
  console.log(`\n${'='.repeat(50)}\n✨ All done! Created: ${totalCreated}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
