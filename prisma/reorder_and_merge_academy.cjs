const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('  ACADEMY PEDAGOGY REORDER & DUPLICATE MERGE MIGRATION');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // STEP 1: RENAME LEVEL 1 MODULE 2
  // -------------------------------------------------------------------------
  console.log('1. Renaming Level 1 Module 2...');
  const l1m2 = await prisma.module.findFirst({
    where: {
      level: { order: 1 },
      order: 2,
    },
  });
  if (l1m2) {
    await prisma.module.update({
      where: { id: l1m2.id },
      data: {
        title: 'Account Mechanics — Lots, Margin & Costs',
        description: 'Understand pips, lots, margin requirements, leverage, and real broker execution costs.',
      },
    });
    console.log(`   ✓ Renamed module ${l1m2.id} -> "Account Mechanics — Lots, Margin & Costs"`);
  }

  // -------------------------------------------------------------------------
  // STEP 2: FIX LEVEL 8 MODULE 4 DRAFT COLLISION & REORDER SCALPING
  // -------------------------------------------------------------------------
  console.log('\n2. Resolving Level 8 Module 4 collision...');
  const draftWave = await prisma.lesson.findUnique({
    where: { slug: 'how-to-count-waves-a-practical-not-theoretical-approach' },
  });
  if (draftWave) {
    await prisma.comment.deleteMany({ where: { lessonId: draftWave.id } });
    await prisma.userProgress.deleteMany({ where: { lessonId: draftWave.id } });
    await prisma.lesson.delete({ where: { id: draftWave.id } });
    console.log(`   ✓ Deleted orphaned draft: "How to Count Waves" (${draftWave.id})`);
  }

  // Set proper order in L8 M4:
  // 1: What is Scalping?
  // 2: Scalping Indicators
  // 3: Scalping Risk Management
  const l8m4Orders = [
    { slug: 'what-is-scalping-making-money-in-minutes', order: 1 },
    { slug: 'scalping-indicators-best-tools-for-1-5-minute-charts', order: 2 },
    { slug: 'scalping-risk-management-speed-kills-if-youre-not-careful', order: 3 },
  ];
  for (const item of l8m4Orders) {
    await prisma.lesson.update({
      where: { slug: item.slug },
      data: { order: item.order },
    });
    console.log(`   ✓ L8 M4: set "${item.slug}" -> order ${item.order}`);
  }

  // -------------------------------------------------------------------------
  // STEP 3: REORDER LEVEL 1 MODULE 1 ("What is Forex?" -> Order 1)
  // -------------------------------------------------------------------------
  console.log('\n3. Reordering Level 1 Module 1...');
  const l1m1Orders = [
    { slug: 'what-is-forex-the-6-6-trillion-market-nobody-explained-properly', order: 1 },
    { slug: 'who-trades-forex-banks-funds-brokers-and-you', order: 2 },
    { slug: 'currency-pairs-explained-base-quote-and-why-they-always-travel-in-twos', order: 3 },
    { slug: 'forex-market-sessions-when-to-trade-and-when-to-sleep', order: 4 },
    { slug: 'forex-vs-stocks-vs-crypto-which-market-is-right-for-you', order: 5 },
  ];
  for (const item of l1m1Orders) {
    await prisma.lesson.update({
      where: { slug: item.slug },
      data: { order: item.order },
    });
    console.log(`   ✓ L1 M1: set "${item.slug}" -> order ${item.order}`);
  }

  // -------------------------------------------------------------------------
  // STEP 4: REORDER LEVEL 1 MODULE 2 ("What is a Pip?" -> Order 1)
  // -------------------------------------------------------------------------
  console.log('\n4. Reordering Level 1 Module 2...');
  const l1m2Orders = [
    { slug: 'what-is-a-pip-and-why-its-worth-more-than-you-think', order: 1 },
    { slug: 'lots-mini-lots-and-micro-lots-size-matters', order: 2 },
    { slug: 'leverage-the-double-edged-sword-nobody-warns-you-about', order: 3 },
    { slug: 'margin-explained-what-it-really-costs-to-open-a-trade', order: 4 },
    { slug: 'order-types-market-limit-stop-and-when-to-use-each', order: 5 },
    { slug: 'spreads-commissions-and-swaps-the-real-cost-of-trading', order: 6 },
  ];
  for (const item of l1m2Orders) {
    await prisma.lesson.update({
      where: { slug: item.slug },
      data: { order: item.order },
    });
    console.log(`   ✓ L1 M2: set "${item.slug}" -> order ${item.order}`);
  }

  // -------------------------------------------------------------------------
  // STEP 5: MERGE LEVEL 4 MODULE 1 S&R DUPLICATE & REORDER
  // -------------------------------------------------------------------------
  console.log('\n5. Merging S&R Duplicate in Level 4 Module 1...');
  const srSource = await prisma.lesson.findUnique({
    where: { slug: 'support-and-resistance-the-only-2-lines-you-actually-need' },
  });
  const srTarget = await prisma.lesson.findUnique({
    where: { slug: 'how-to-draw-support-and-resistance-and-stop-guessing' },
  });

  if (srSource && srTarget) {
    // Merge userProgress
    const sourceProgress = await prisma.userProgress.findMany({ where: { lessonId: srSource.id } });
    for (const p of sourceProgress) {
      const existing = await prisma.userProgress.findUnique({
        where: { userId_lessonId: { userId: p.userId, lessonId: srTarget.id } },
      });
      if (!existing) {
        await prisma.userProgress.create({
          data: {
            userId: p.userId,
            lessonId: srTarget.id,
            isCompleted: p.isCompleted,
            completedAt: p.completedAt,
          },
        });
      }
    }

    // Merge content: Add the "Two Lines You Actually Need" framework to the Target
    const mergedSRContent = `<h2>Stop Drawing Random Lines on Your Chart</h2>

<p>Every beginner's chart looks the same: <strong>dozens of horizontal lines covering every possible level</strong>, turning a clean chart into a colorful mess. The result? Analysis paralysis — you have so many levels that none of them mean anything.</p>

<p>Professional traders don't draw more lines. They draw <strong>fewer, better lines</strong>. Strip away every oscillator and complex overlay, and you're left with the only two structural forces that drive price: <strong>Support</strong> (institutional buying pressure) and <strong>Resistance</strong> (institutional selling pressure).</p>

<hr />

<h2>The Only 2 Lines You Actually Need on Any Timeframe</h2>

<p>If you want clarity, eliminate the clutter. On your execution chart, anchor your bias to just two primary levels:</p>

<ul>
  <li><strong>The Key Structural High (Ceiling)</strong> — The most recent, unbreached swing high that created the last lower low. Until this breaks with displacement, your bias remains bearish.</li>
  <li><strong>The Key Structural Low (Floor)</strong> — The most recent swing low that launched the last higher high. Until this breaches, your bias remains bullish.</li>
</ul>

<p>Everything inside these two boundaries is consolidation noise. Trading in the middle guarantees wide stops and terrible Risk-to-Reward.</p>

<hr />

<h2>The 3 Rules of Drawing Institutional Levels</h2>

<h3>Rule 1: Use Line Charts for Exact Inflection Points</h3>
<p>Wicks create confusion when drawing horizontal levels. Switch to the <strong>Line Chart (Close prices)</strong> to identify where institutions actually accepted price. Draw your line at the sharp 'V' and inverted 'V' vertices, then switch back to candlesticks to encompass the wick extremes into a tight <strong>zone</strong>.</p>

<h3>Rule 2: The 3-Touch Validation</h3>
<p>A level touched once is an idea. A level touched twice is a potential zone. A level touched <strong>three times with clean rejection wicks</strong> is an established liquidity boundary. More than three touches? Beware: retail traders have placed their stop-loss orders directly behind it, creating prime liquidity for a sweep.</p>

<h3>Rule 3: Zones, Not Thin Lines</h3>
<p>Forex is a decentralized auction, not a rigid math equation. Support and resistance are never a single pip price point. Always draw levels as <strong>10 to 20-pip zones</strong> covering both candle bodies and wicks.</p>

<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Boundary Risk-to-Reward Ratio
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    Entering at the extremes of structural boundaries is how you achieve asymmetric payouts. If you buy EUR/USD at key H4 support (1.0820) with an objective stop 15 pips below the zone (1.0805, <strong>$150 risk on a 1.0 lot</strong>) targeting resistance at 1.0880 (+60 pips), your reward is <strong>$600</strong> — a clean <strong>1:4 Risk-to-Reward</strong>. If you enter mid-range at 1.0850, your stop must still be at 1.0805 (45 pips risk) for only 30 pips gain (1:0.66 R:R). Trading mid-range destroys your mathematical expectancy.
  </p>
  <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
    <li>• Account: $10,000 | 1.5% Risk Limit = $150</li>
    <li>• Edge Entry: 15-pip SL = 1.0 Lot size ($150 risk) | Target +60 pips = +$600 (4R)</li>
    <li>• Middle Entry: 45-pip SL = 0.33 Lot size ($150 risk) | Target +30 pips = +$100 (0.66R)</li>
  </ul>
</div>

<div class="tnt-telemetry-box border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
    <span>⚡</span> TheNextTrade Telemetry: Live MT5 Structural Radar
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
    Sync your MT5 trading account with TheNextTrade. Our trade analytics engine measures your entry proximity relative to higher-timeframe boundaries and flags mid-range emotional FOMO entries before they hit your drawdown limit.
  </p>
  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
    ● Live MT5 Trade Telemetry Enabled
  </span>
</div>

<div class="action-step-box border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
    <span>🎯</span> Action Step: Chart Cleanup Sprint
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
    Open your EUR/USD or XAU/USD chart on the H4 timeframe right now. Delete all existing lines. Draw ONLY the most recent Key Structural High and Key Structural Low. Switch to M15 and observe how price behaves specifically when approaching these two boundaries.
  </p>
</div>`;

    await prisma.lesson.update({
      where: { id: srTarget.id },
      data: {
        title: 'How to Draw Support and Resistance (The Only 2 Lines You Need)',
        metaDescription: 'Master how to draw institutional support and resistance zones that actually hold. Learn the 2-boundary rule and eliminate chart clutter.',
        content: mergedSRContent,
      },
    });

    // Delete source lesson
    await prisma.comment.deleteMany({ where: { lessonId: srSource.id } });
    await prisma.userProgress.deleteMany({ where: { lessonId: srSource.id } });
    await prisma.lesson.delete({ where: { id: srSource.id } });
    console.log(`   ✓ Merged "${srSource.slug}" into "${srTarget.slug}" and deleted source lesson.`);
  }

  // Set proper order in L4 M1:
  // 1: Market Structure 101
  // 2: BOS and CHoCH
  // 3: How to Draw Support and Resistance
  // 4: Support Becomes Resistance
  // 5: Trend Lines and Channels
  // 6: Psychological Levels
  const l4m1Orders = [
    { slug: 'market-structure-101-higher-highs-higher-lows-lower-highs-lower-lows', order: 1 },
    { slug: 'bos-and-choch-identifying-trend-continuation-and-early-reversals', order: 2 },
    { slug: 'how-to-draw-support-and-resistance-and-stop-guessing', order: 3 },
    { slug: 'support-becomes-resistance-the-polarity-principle', order: 4 },
    { slug: 'trend-lines-and-channels-riding-the-wave', order: 5 },
    { slug: 'psychological-levels-why-round-numbers-matter', order: 6 },
  ];
  for (const item of l4m1Orders) {
    await prisma.lesson.update({
      where: { slug: item.slug },
      data: { order: item.order },
    });
    console.log(`   ✓ L4 M1: set "${item.slug}" -> order ${item.order}`);
  }

  // -------------------------------------------------------------------------
  // STEP 6: MERGE LEVEL 9 MODULE 1 ECONOMIC CALENDAR DUPLICATE & REORDER
  // -------------------------------------------------------------------------
  console.log('\n6. Merging Economic Calendar Duplicate in Level 9 Module 1...');
  const calSource = await prisma.lesson.findUnique({
    where: { slug: 'the-economic-calendar-your-weekly-cheat-sheet' },
  });
  const calTarget = await prisma.lesson.findUnique({
    where: { slug: 'reading-the-economic-calendar-and-reacting-to-the-news' },
  });

  if (calSource && calTarget) {
    // Merge userProgress
    const sourceProgress = await prisma.userProgress.findMany({ where: { lessonId: calSource.id } });
    for (const p of sourceProgress) {
      const existing = await prisma.userProgress.findUnique({
        where: { userId_lessonId: { userId: p.userId, lessonId: calTarget.id } },
      });
      if (!existing) {
        await prisma.userProgress.create({
          data: {
            userId: p.userId,
            lessonId: calTarget.id,
            isCompleted: p.isCompleted,
            completedAt: p.completedAt,
          },
        });
      }
    }

    const mergedCalContent = `<h2>The Market's Economic Clock</h2>

<p>Every week, government agencies and central banks release economic reports that inject violent volatility into currency and gold markets. Navigating these releases safely separates seasoned funded professionals from reckless gamblers who blow accounts on slippage.</p>

<p>Before a professional trader analyzes a single candlestick on Monday morning, they check one thing: <strong>the economic calendar</strong>. Not to gamble on the data forecast, but to know with absolute certainty <strong>when NOT to be in the market</strong>.</p>

<hr />

<h2>The 4 Tier-1 Market Shakers</h2>

<p>Out of dozens of calendar releases each week, only four categories produce immediate 40 to 120-pip market dislocations:</p>

<ul>
  <li><strong>1. Central Bank Interest Rate Decisions (FOMC, ECB, BOE)</strong> — Determines the fundamental cost of money. A surprise hike or hawkish statement fuels sustained multi-day trends.</li>
  <li><strong>2. Inflation Metrics (CPI & Core PCE)</strong> — The primary steering metric for central bank rate policies. Higher than expected prints spike the domestic currency.</li>
  <li><strong>3. Employment Data (US Non-Farm Payrolls - NFP)</strong> — Released the first Friday of each month. Creates the most severe liquidity voids and spread widening in forex.</li>
  <li><strong>4. Gross Domestic Product (GDP)</strong> — The broader benchmark of national economic health. Drives quarterly portfolio rebalancing by sovereign wealth funds.</li>
</ul>

<hr />

<h2>Your Weekly Economic Calendar Execution Cheat Sheet</h2>

<p>Incorporate this objective 3-step routine into your weekly preparation:</p>

<h3>Phase 1: Sunday Evening Routine (The Market Scan)</h3>
<p>Filter your calendar for <strong>High Impact (Red Folder)</strong> events only. Note the exact dates and times for USD, EUR, GBP, and JPY releases. Mark these time slots directly on your trading journal.</p>

<h3>Phase 2: 15-Minute Pre-News Lockdown</h3>
<p>Stop placing new trade entries 15 minutes before Tier-1 releases. Spreads can widen from 0.8 pips to 9.0 pips on EUR/USD, triggering stops even if price never technically reached your level. Tighten trailing stops to breakeven or lock partial profits.</p>

<h3>Phase 3: The "Wait & React" Strategy</h3>
<p>Never enter during the initial news candle spike. Wait 15 to 30 minutes after the release for the knee-jerk reaction to settle. Look for an institutional liquidity sweep followed by an M5 CHoCH or structural confirmation before taking a trade.</p>

<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Spread Widening & Slippage Protection
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    During NFP or FOMC, institutional liquidity dries up for 2-5 seconds. An account risking 1% ($100 on a $10,000 account) with a 15-pip stop loss can suffer <strong>25 pips of negative slippage</strong> if holding into the event, resulting in a sudden <strong>$266 loss (2.66% drawdown)</strong> instead of $100. Always factor execution friction into high-impact events.
  </p>
  <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
    <li>• Normal Spread: EUR/USD 0.8 pips | Stop-loss execution = Exact ($100 risk)</li>
    <li>• News Spread: EUR/USD 8.5 pips + Slippage | Actual loss = $266.60 (-2.66%)</li>
    <li>• Golden Rule: Zero open positions during Red Folder spikes unless stops are deeply secured at +50 pips profit.</li>
  </ul>
</div>

<div class="tnt-telemetry-box border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
    <span>⚡</span> TheNextTrade Telemetry: News Risk Radar
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
    TheNextTrade connects directly to your MT5 account and cross-references your open positions with live economic calendar releases. Our execution engine alerts you 30 minutes before high-impact news on your active currency pairs.
  </p>
  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
    ● Live MT5 Trade Telemetry Enabled
  </span>
</div>

<div class="action-step-box border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
    <span>🎯</span> Action Step: Set Up Your Weekly Economic Alert
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
    Open the Economic Calendar in your trading dashboard. Filter by high-impact events for the current week. Identify any red-folder events scheduled during your normal trading session, and set an alarm 20 minutes prior to avoid placing new orders.
  </p>
</div>`;

    await prisma.lesson.update({
      where: { id: calTarget.id },
      data: {
        title: 'Reading the Economic Calendar — And Reacting to the News (With Weekly Cheat Sheet)',
        metaDescription: 'Master how to read the forex economic calendar, react to high-impact news safely, and use the weekly preparation cheat sheet.',
        content: mergedCalContent,
      },
    });

    // Delete source lesson
    await prisma.comment.deleteMany({ where: { lessonId: calSource.id } });
    await prisma.userProgress.deleteMany({ where: { lessonId: calSource.id } });
    await prisma.lesson.delete({ where: { id: calSource.id } });
    console.log(`   ✓ Merged "${calSource.slug}" into "${calTarget.slug}" and deleted source lesson.`);
  }

  // Set proper order in L9 M1:
  // 1: Interest Rates
  // 2: Central Banks
  // 3: GDP, Employment, and Inflation
  // 4: Reading the Economic Calendar
  const l9m1Orders = [
    { slug: 'interest-rates-the-number-one-force-moving-currencies', order: 1 },
    { slug: 'central-banks-explained-fed-ecb-boe-boj-and-what-they-control', order: 2 },
    { slug: 'gdp-employment-and-inflation-the-big-three-economic-indicators', order: 3 },
    { slug: 'reading-the-economic-calendar-and-reacting-to-the-news', order: 4 },
  ];
  for (const item of l9m1Orders) {
    await prisma.lesson.update({
      where: { slug: item.slug },
      data: { order: item.order },
    });
    console.log(`   ✓ L9 M1: set "${item.slug}" -> order ${item.order}`);
  }

  // -------------------------------------------------------------------------
  // STEP 7: REORDER LEVEL 10 MODULE 1 ("What is a Trading System?" -> Order 1)
  // -------------------------------------------------------------------------
  console.log('\n7. Reordering Level 10 Module 1...');
  const l10m1Orders = [
    { slug: 'what-is-a-trading-system-rules-not-feelings', order: 1 },
    { slug: 'building-your-trading-system-step-by-step', order: 2 },
    { slug: 'backtesting-does-your-strategy-actually-work', order: 3 },
    { slug: 'forward-testing-from-backtest-to-live-without-blowing-up', order: 4 },
    { slug: 'your-complete-trading-sop-from-scan-to-journal', order: 5 },
  ];
  for (const item of l10m1Orders) {
    await prisma.lesson.update({
      where: { slug: item.slug },
      data: { order: item.order },
    });
    console.log(`   ✓ L10 M1: set "${item.slug}" -> order ${item.order}`);
  }

  console.log('\n================================================================');
  console.log('  ALL MIGRATIONS & REORDERING COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
