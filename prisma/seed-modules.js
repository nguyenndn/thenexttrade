const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Modules mapped by level order
const modulesByLevel = {
  1: [
    { order: 1, title: 'Welcome to the Market', description: 'What forex is, how it works, and who participates.' },
    { order: 2, title: 'Understanding Margin & Orders', description: 'Margin mechanics, pips, lots, spreads, and order types.' },
  ],
  2: [
    { order: 1, title: 'Choosing Your Broker', description: 'How to pick the right broker and execution models.' },
    { order: 2, title: 'The Three Lenses of Analysis', description: 'Technical, fundamental, and sentiment analysis overview.' },
    { order: 3, title: 'Your First Charts', description: 'Line, bar, and candlestick chart basics.' },
  ],
  3: [
    { order: 1, title: 'Price Boundaries — Support & Resistance', description: 'Key price zones, trend lines, channels, and psychological levels.' },
    { order: 2, title: 'Candlestick Language', description: 'Candlestick anatomy, body sizes, and reversal/continuation patterns.' },
    { order: 3, title: 'Fibonacci — The Golden Ratio', description: 'Retracements, extensions, and combining Fibo with other tools.' },
    { order: 4, title: 'Moving Averages — Following the Flow', description: 'SMA, EMA, crossovers, and using MAs as dynamic S&R.' },
    { order: 5, title: 'Essential Indicators Toolkit', description: 'Bollinger Bands, MACD, RSI, Stochastic, Ichimoku, and more.' },
  ],
  4: [
    { order: 1, title: 'Combining Your Indicators', description: 'Building indicator stacks and leading vs lagging signals.' },
    { order: 2, title: 'Chart Patterns That Pay', description: 'Head & shoulders, double tops/bottoms, triangles, flags, wedges.' },
    { order: 3, title: 'Pivot Points — Institutional Levels', description: 'Calculating and trading with pivot point levels.' },
  ],
  5: [
    { order: 1, title: 'Divergence Trading', description: 'Regular and hidden divergences for entries and exits.' },
    { order: 2, title: 'Reading Market Conditions', description: 'Trending vs ranging, breakouts, fakeouts, and reversals.' },
    { order: 3, title: 'The Multi-Timeframe Edge', description: 'Top-down analysis and best timeframe combinations.' },
  ],
  6: [
    { order: 1, title: 'What Drives Currencies?', description: 'Interest rates, GDP, employment, inflation, and monetary policy.' },
    { order: 2, title: 'Trading Around News Events', description: 'Directional and non-directional news trading strategies.' },
    { order: 3, title: 'Measuring the Crowd', description: 'Market sentiment, COT report, and crowd positioning.' },
  ],
  7: [
    { order: 1, title: 'Cross-Market Connections', description: 'Gold, oil, bonds, stocks and their impact on forex.' },
    { order: 2, title: 'Beyond Major Pairs — Currency Crosses', description: 'EUR, JPY, and GBP cross pair opportunities.' },
  ],
  8: [
    { order: 1, title: 'Designing Your Edge', description: 'Building and backtesting your own trading system.' },
    { order: 2, title: 'Your Trading Journal', description: 'Tracking trades, reviewing performance, and learning from data.' },
  ],
  9: [
    { order: 1, title: 'Protecting Your Capital', description: 'Position sizing, stop losses, risk-reward ratio, and scaling.' },
  ],
  10: [
    { order: 1, title: 'Mastering Your Inner Game', description: 'Fear, greed, discipline, and traits of successful traders.' },
  ],
  11: [
    { order: 1, title: 'Your Pre-Launch Checklist', description: 'Avoiding scams, common mistakes, prop firms, and going live.' },
  ],
};

async function main() {
  console.log('🌱 Seeding 26 Academy Modules...\n');

  // Fetch all levels from DB
  const levels = await prisma.level.findMany({ orderBy: { order: 'asc' } });
  const levelMap = {};
  for (const level of levels) {
    levelMap[level.order] = level;
  }

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const [levelOrder, modules] of Object.entries(modulesByLevel)) {
    const level = levelMap[Number(levelOrder)];
    if (!level) {
      console.log(`  ⚠️  Level ${levelOrder} not found in DB, skipping...`);
      continue;
    }

    console.log(`  📂 Level ${levelOrder}: ${level.title}`);

    for (const mod of modules) {
      // Check if module with same title + levelId exists
      const existing = await prisma.module.findFirst({
        where: { levelId: level.id, order: mod.order },
      });

      if (existing) {
        await prisma.module.update({
          where: { id: existing.id },
          data: { title: mod.title, description: mod.description },
        });
        console.log(`     ♻️  Updated M${mod.order}: ${mod.title}`);
        totalUpdated++;
      } else {
        await prisma.module.create({
          data: {
            title: mod.title,
            description: mod.description,
            order: mod.order,
            levelId: level.id,
          },
        });
        console.log(`     ✅ Created M${mod.order}: ${mod.title}`);
        totalCreated++;
      }
    }
  }

  console.log(`\n✨ Done! ${totalCreated} created, ${totalUpdated} updated.`);
}

main()
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
