const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function makeFigure(src, alt, caption) {
  return `\n<figure class="lesson-image" style="text-align: center; margin: 2rem auto;">
  <img src="${src}" alt="${alt}" loading="lazy" />
  <figcaption style="text-align: center; font-style: italic; font-size: 0.875rem; color: #6b7280; margin-top: 0.75rem;">${caption}</figcaption>
</figure>\n`;
}

async function applyImages() {
  console.log('🚀 [Academy Images] Applying images to Group A & Group B lessons...');

  // =========================================================================
  // 1. GROUP B: L4.M1 - How to Draw Support and Resistance
  // =========================================================================
  const l4Slug = 'how-to-draw-support-and-resistance-and-stop-guessing';
  const l4 = await prisma.lesson.findUnique({ where: { slug: l4Slug } });
  if (l4) {
    let content = l4.content;

    // Remove any previous figures for these images to remain idempotent
    content = content.replace(/<figure class="lesson-image"[\s\S]*?level-04\/module-01\/(?:support-resistance-basics|drawing-sr-steps|clean-vs-cluttered|bounce-vs-break)\.png[\s\S]*?<\/figure>/gi, '');

    const fig1 = makeFigure(
      '/images/academy/level-04/module-01/support-resistance-basics.png',
      'Support and resistance basics — key price boundaries where market participants react',
      'Support and resistance basics — key price boundaries where market participants react'
    );
    const fig2 = makeFigure(
      '/images/academy/level-04/module-01/clean-vs-cluttered.png',
      'Clean chart vs cluttered chart — the difference between institutional clarity and retail indicator overload',
      'Clean chart vs cluttered chart — the difference between institutional clarity and retail indicator overload'
    );
    const fig3 = makeFigure(
      '/images/academy/level-04/module-01/drawing-sr-steps.png',
      'The 3-step process for drawing institutional support and resistance zones',
      'The 3-step process for drawing institutional support and resistance zones'
    );
    const fig4 = makeFigure(
      '/images/academy/level-04/module-01/bounce-vs-break.png',
      'Bounce vs breakout — identifying zone rejection versus true structural expansion',
      'Bounce vs breakout — identifying zone rejection versus true structural expansion'
    );

    // Insert fig1 after paragraph 1 under first h2
    content = content.replace(
      /(<h2>Stop Drawing Random Lines on Your Chart<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig1}`
    );

    // Insert fig2 after Rule 1 paragraph
    content = content.replace(
      /(<h3>Rule 1: Use Line Charts for Exact Inflection Points<\/h3>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig2}`
    );

    // Insert fig3 after <h2>The 3 Rules of Drawing Institutional Levels</h2>
    content = content.replace(
      /(<h2>The 3 Rules of Drawing Institutional Levels<\/h2>)/i,
      `$1\n${fig3}`
    );

    // Insert fig4 after Rule 3 paragraph
    content = content.replace(
      /(<h3>Rule 3: Zones, Not Thin Lines<\/h3>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig4}`
    );

    await prisma.lesson.update({
      where: { slug: l4Slug },
      data: { content }
    });
    console.log('✅ [L4.M1] Updated 4 images into', l4Slug);
  } else {
    console.log('❌ [L4.M1] Lesson not found:', l4Slug);
  }

  // =========================================================================
  // 2. GROUP B: L9.M1 - Reading the Economic Calendar
  // =========================================================================
  const l9Slug = 'reading-the-economic-calendar-and-reacting-to-the-news';
  const l9 = await prisma.lesson.findUnique({ where: { slug: l9Slug } });
  if (l9) {
    let content = l9.content;

    content = content.replace(/<figure class="lesson-image"[\s\S]*?level-09\/module-01\/(?:economic-calendar-guide|calendar-columns-guide|nfp-cpi-fomc-cheatsheet|weekly-calendar-routine|news-trading-risk|news-reaction-phases)\.png[\s\S]*?<\/figure>/gi, '');

    const fig1 = makeFigure(
      '/images/academy/level-09/module-01/economic-calendar-guide.png',
      'The economic calendar guide — navigating high-impact macroeconomic releases',
      'The economic calendar guide — navigating high-impact macroeconomic releases'
    );
    const fig2 = makeFigure(
      '/images/academy/level-09/module-01/calendar-columns-guide.png',
      'Understanding economic calendar data columns — actual vs forecast vs previous',
      'Understanding economic calendar data columns — actual vs forecast vs previous'
    );
    const fig3 = makeFigure(
      '/images/academy/level-09/module-01/nfp-cpi-fomc-cheatsheet.png',
      'The Tier-1 market shakers cheatsheet — FOMC, NFP, CPI, and GDP impact',
      'The Tier-1 market shakers cheatsheet — FOMC, NFP, CPI, and GDP impact'
    );
    const fig4 = makeFigure(
      '/images/academy/level-09/module-01/weekly-calendar-routine.png',
      'Phase 1: Sunday evening market scan routine for scheduled high-impact events',
      'Phase 1: Sunday evening market scan routine for scheduled high-impact events'
    );
    const fig5 = makeFigure(
      '/images/academy/level-09/module-01/news-trading-risk.png',
      'Phase 2: Spread widening and slippage risk during high-impact news releases',
      'Phase 2: Spread widening and slippage risk during high-impact news releases'
    );
    const fig6 = makeFigure(
      '/images/academy/level-09/module-01/news-reaction-phases.png',
      'Phase 3: The 3 reaction phases of market price action post-news',
      'Phase 3: The 3 reaction phases of market price action post-news'
    );

    // Insert fig1 & fig2 in first section
    content = content.replace(
      /(<h2>The Market's Economic Clock<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig1}`
    );
    content = content.replace(
      /(<p>Sounds perfect[\s\S]*?<\/p>|<p>Before a professional trader[\s\S]*?<\/p>)/i,
      `$1\n${fig2}`
    );

    // Insert fig3 after <h2>The 4 Tier-1 Market Shakers</h2>
    content = content.replace(
      /(<h2>The 4 Tier-1 Market Shakers<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig3}`
    );

    // Insert fig4 after Phase 1
    content = content.replace(
      /(<h3>Phase 1: Sunday Evening Routine \(The Market Scan\)<\/h3>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig4}`
    );

    // Insert fig5 after Phase 2
    content = content.replace(
      /(<h3>Phase 2: 15-Minute Pre-News Lockdown<\/h3>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig5}`
    );

    // Insert fig6 after Phase 3
    content = content.replace(
      /(<h3>Phase 3: The "Wait & React" Strategy<\/h3>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig6}`
    );

    await prisma.lesson.update({
      where: { slug: l9Slug },
      data: { content }
    });
    console.log('✅ [L9.M1] Updated 6 images into', l9Slug);
  } else {
    console.log('❌ [L9.M1] Lesson not found:', l9Slug);
  }

  // =========================================================================
  // 3. GROUP A: L6.M4 - Entry Confirmation — The Trigger Before You Click
  // =========================================================================
  const l6m4_1Slug = 'entry-confirmation-the-trigger-before-you-click';
  const l6m4_1 = await prisma.lesson.findUnique({ where: { slug: l6m4_1Slug } });
  if (l6m4_1) {
    let content = l6m4_1.content;
    content = content.replace(/<figure class="lesson-image"[\s\S]*?level-06\/module-04\/(?:entry-triggers-4types|location-vs-trigger-filter)\.png[\s\S]*?<\/figure>/gi, '');

    const fig1 = makeFigure(
      '/images/academy/level-06/module-04/entry-triggers-4types.png',
      'The 4 high-probability entry confirmation triggers — waiting for objective market evidence before clicking execute',
      'The 4 high-probability entry confirmation triggers — waiting for objective market evidence before clicking execute'
    );
    const fig2 = makeFigure(
      '/images/academy/level-06/module-04/location-vs-trigger-filter.png',
      'The 2-filter execution rule — aligning higher-timeframe location with lower-timeframe trigger confirmation',
      'The 2-filter execution rule — aligning higher-timeframe location with lower-timeframe trigger confirmation'
    );

    content = content.replace(
      /(<h2>The 4 High-Probability Entry Triggers<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig1}`
    );
    content = content.replace(
      /(<h2>The 2-Filter Rule: Location \+ Trigger<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig2}`
    );

    await prisma.lesson.update({
      where: { slug: l6m4_1Slug },
      data: { content }
    });
    console.log('✅ [L6.M4] Updated 2 images into', l6m4_1Slug);
  }

  // =========================================================================
  // 4. GROUP A: L6.M4 - The Confluence Checklist — 4 Layers Before You Trade
  // =========================================================================
  const l6m4_2Slug = 'the-confluence-checklist-4-layers-before-you-trade';
  const l6m4_2 = await prisma.lesson.findUnique({ where: { slug: l6m4_2Slug } });
  if (l6m4_2) {
    let content = l6m4_2.content;
    content = content.replace(/<figure class="lesson-image"[\s\S]*?level-06\/module-04\/(?:confluence-4-layers-model|high-confluence-vs-noise)\.png[\s\S]*?<\/figure>/gi, '');

    const fig1 = makeFigure(
      '/images/academy/level-06/module-04/confluence-4-layers-model.png',
      'The 4-layer confluence matrix — stacking independent technical edges to engineer mathematical expectancy',
      'The 4-layer confluence matrix — stacking independent technical edges to engineer mathematical expectancy'
    );
    const fig2 = makeFigure(
      '/images/academy/level-06/module-04/high-confluence-vs-noise.png',
      'High confluence setup vs single-indicator market noise — comparing win rate, drawdowns, and expectancy',
      'High confluence setup vs single-indicator market noise — comparing win rate, drawdowns, and expectancy'
    );

    content = content.replace(
      /(<h2>The 4-Layer Confluence Matrix<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig1}`
    );
    content = content.replace(
      /(<h2>The Scoring Rule: Never Trade Below 3 Confluence Points<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig2}`
    );

    await prisma.lesson.update({
      where: { slug: l6m4_2Slug },
      data: { content }
    });
    console.log('✅ [L6.M4] Updated 2 images into', l6m4_2Slug);
  }

  // =========================================================================
  // 5. GROUP A: L8.M3 - Entry Placement — Structural SL/TP & Trade Management
  // =========================================================================
  const l8Slug = 'entry-placement-structural-sl-tp-and-trade-management';
  const l8 = await prisma.lesson.findUnique({ where: { slug: l8Slug } });
  if (l8) {
    let content = l8.content;
    content = content.replace(/<figure class="lesson-image"[\s\S]*?level-08\/module-03\/(?:structural-sl-tp-placement|trade-management-be-scaleout)\.png[\s\S]*?<\/figure>/gi, '');

    const fig1 = makeFigure(
      '/images/academy/level-08/module-03/structural-sl-tp-placement.png',
      'Structural stop loss and target placement — anchoring stops behind invalidation wicks rather than arbitrary dollar amounts',
      'Structural stop loss and target placement — anchoring stops behind invalidation wicks rather than arbitrary dollar amounts'
    );
    const fig2 = makeFigure(
      '/images/academy/level-08/module-03/trade-management-be-scaleout.png',
      'Active trade management protocol — executing break-even moves, partial scale-outs, and structural trailing stops',
      'Active trade management protocol — executing break-even moves, partial scale-outs, and structural trailing stops'
    );

    content = content.replace(
      /(<h2>Stop Losses Don't Go Where You Hope — They Go Where the Thesis Fails<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig1}`
    );
    content = content.replace(
      /(<h2>Take Profit Calibration & The 3 Golden Rules of Management<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig2}`
    );

    await prisma.lesson.update({
      where: { slug: l8Slug },
      data: { content }
    });
    console.log('✅ [L8.M3] Updated 2 images into', l8Slug);
  }

  // =========================================================================
  // 6. GROUP A: L10.M1 - Your Complete Trading SOP — From Market Scan to Journal
  // =========================================================================
  const l10Slug = 'your-complete-trading-sop-from-scan-to-journal';
  const l10 = await prisma.lesson.findUnique({ where: { slug: l10Slug } });
  if (l10) {
    let content = l10.content;
    content = content.replace(/<figure class="lesson-image"[\s\S]*?level-10\/module-01\/(?:trading-sop-6-phases|trade-journaling-telemetry)\.png[\s\S]*?<\/figure>/gi, '');

    const fig1 = makeFigure(
      '/images/academy/level-10/module-01/trading-sop-6-phases.png',
      'The 6-phase daily trading SOP — the complete institutional routine from pre-market scan to post-market trade journal',
      'The 6-phase daily trading SOP — the complete institutional routine from pre-market scan to post-market trade journal'
    );
    const fig2 = makeFigure(
      '/images/academy/level-10/module-01/trade-journaling-telemetry.png',
      'The trading telemetry dashboard — tracking objective trade data, R-multiples, and psychological behavioral leaks',
      'The trading telemetry dashboard — tracking objective trade data, R-multiples, and psychological behavioral leaks'
    );

    content = content.replace(
      /(<h2>The 8-Step Daily Execution SOP<\/h2>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig1}`
    );
    content = content.replace(
      /(<h3>Step 8: Post-Trade Journaling & Reflection<\/h3>\s*<p>[\s\S]*?<\/p>)/i,
      `$1\n${fig2}`
    );

    await prisma.lesson.update({
      where: { slug: l10Slug },
      data: { content }
    });
    console.log('✅ [L10.M1] Updated 2 images into', l10Slug);
  }

  console.log('🎉 All 6 lessons updated successfully!');
  await prisma.$disconnect();
}

applyImages().catch(err => {
  console.error(err);
  process.exit(1);
});
