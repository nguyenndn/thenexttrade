const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const topics = [
    {
      key: 'Market structure',
      terms: ['market structure', 'higher high', 'higher low', 'break of structure', 'bos', 'choch'],
      requiredLevel: 'Level 4'
    },
    {
      key: 'Key level & Zones',
      terms: ['support and resistance', 'key level', 'supply and demand', 'demand zone', 'psychological levels'],
      requiredLevel: 'Level 4 & 5'
    },
    {
      key: 'Entry Confirmation',
      terms: ['entry confirmation', 'confirmation', 'reversal candle', 'trigger', 'liquidity sweep'],
      requiredLevel: 'Level 4, 5, 8'
    },
    {
      key: 'Confluence (Trendline, Fibo, Orderblock)',
      terms: ['confluence', 'trend line', 'trendline', 'fibonacci', 'order block', 'indicator stack'],
      requiredLevel: 'Level 5 & 6'
    },
    {
      key: 'Entry, SL, TP',
      terms: ['stop loss', 'take profit', 'entry, stop', 'position sizing', 'risk-reward', '1:2'],
      requiredLevel: 'Level 1, 3, 8'
    },
    {
      key: 'Complete Trading SOP',
      terms: ['trading system', 'trading plan', 'playbook', 'checklist', 'routine', 'sop'],
      requiredLevel: 'Level 10'
    },
  ];

  const lessons = await prisma.lesson.findMany({
    include: { module: { include: { level: true } } },
    orderBy: [{ module: { level: { order: 'asc' } } }, { module: { order: 'asc' } }, { order: 'asc' }]
  });

  console.log('=== TOPIC COVERAGE AUDIT ===');
  for (const t of topics) {
    const matches = lessons.filter(l => {
      const full = (l.title + ' ' + (l.rawContent || '') + ' ' + (l.content || '')).toLowerCase();
      return t.terms.some(term => full.includes(term.toLowerCase()));
    });
    console.log(`\n📌 TOPIC: ${t.key} (Expected: ${t.requiredLevel}) -> Matches: ${matches.length} lessons`);
    matches.slice(0, 6).forEach(m => {
      console.log(`   - [Level ${m.module.level.order}] ${m.title}`);
    });
    if (matches.length > 6) {
      console.log(`   ... and ${matches.length - 6} more lessons.`);
    }
  }

  console.log('\n================ FLAGSHIP CORE TOPIC LESSONS ================');
  const coreSyllabus = [
    {
      topic: '1. Market Structure',
      keys: ['Market Structure 101', 'BOS and CHoCH'],
    },
    {
      topic: '2. Key Level & Zones',
      keys: ['Support and Resistance — The Only 2 Lines', 'How to Draw Support and Resistance', 'Support Becomes Resistance', 'Supply and Demand Zones'],
    },
    {
      topic: '3. Entry Confirmation',
      keys: ['Bullish Reversal Candles', 'Bearish Reversal Candles', 'Liquidity Sweeps & Stop Hunts', 'Price Action Trading — Reading the Market'],
    },
    {
      topic: '4. Confluence (Trendline, Fibo, Orderblock)',
      keys: ['Trend Lines and Channels', 'Fibonacci Retracement', 'Combining Fibonacci with Support and Resistance', 'Order Blocks & Fair Value Gaps', 'Building an Indicator Stack'],
    },
    {
      topic: '5. Entry, SL, TP Execution',
      keys: ['Stop Loss — The Seatbelt', 'Take Profit — When to Close', 'Risk-Reward Ratio — The 1:2 Rule', 'Position Sizing — The Exact Formula'],
    },
    {
      topic: '6. Complete Trading SOP',
      keys: ['What is a Trading System? — Rules, Not Feelings', 'Building Your Trading System — Step by Step', 'Your Complete Trading Plan Template', 'Building a Trading Routine — Your Daily Checklist', 'Risk Management Checklist — 10 Rules'],
    },
  ];

  for (const cs of coreSyllabus) {
    console.log(`\n🎯 ${cs.topic}:`);
    for (const k of cs.keys) {
      const match = lessons.find(l => l.title.toLowerCase().includes(k.toLowerCase()));
      if (match) {
        console.log(`   ✅ [Level ${match.module.level.order} - Mod ${match.module.order}] ${match.title}`);
        console.log(`      Slug: /academy/lesson/${match.slug}`);
      } else {
        console.log(`   ❌ [MISSING] ${k}`);
      }
    }
  }

  await prisma.$disconnect();
}

check().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
