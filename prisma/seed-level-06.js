/**
 * Seed Level 6: Pattern Mastery
 * M1: Combining Your Indicators (3 lessons, 10 quiz questions)
 * M2: Chart Patterns That Pay (4 lessons, 10 quiz questions)
 * M3: Pivot Points — Institutional Levels (2 lessons, 10 quiz questions)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");
const prisma = new PrismaClient();

const LEVEL_SLUG = "pattern-mastery";
const LEVEL_TITLE = "Pattern Mastery";
const LEVEL_DESCRIPTION = "Master the art of combining indicators, recognizing powerful chart patterns, and using institutional-grade pivot points. This level transforms your technical tools into a cohesive trading system.";
const LEVEL_ORDER = 6;

const MODULES = [
  {
    title: "Combining Your Indicators",
    description: "Learn the difference between leading and lagging indicators, build a 3-layer indicator stack, and avoid the most common indicator traps that cost traders money.",
    order: 1,
    folder: "module-01-combining-your-indicators",
    lessons: [
      { slug: "leading-vs-lagging-indicators-know-the-difference", title: "Leading vs Lagging Indicators — Know the Difference" },
      { slug: "building-an-indicator-stack-3-tools-1-signal", title: "Building an Indicator Stack — 3 Tools, 1 Signal" },
      { slug: "indicator-traps-why-rsi-divergence-alone-will-lose-you-money", title: "Indicator Traps — Why RSI Divergence Alone Will Lose You Money" },
    ],
    quiz: {
      title: "Combining Indicators Quiz",
      description: "Test your understanding of leading vs lagging indicators, indicator stacks, and common indicator traps. 10 questions, 75% to pass.",
      questions: [
        { text: "Which of the following is a LEADING indicator?", options: [
          { text: "Moving Average (SMA)", isCorrect: false },
          { text: "RSI (Relative Strength Index)", isCorrect: true },
          { text: "MACD", isCorrect: false },
          { text: "Bollinger Bands", isCorrect: false },
        ]},
        { text: "In a TRENDING market, which type of indicator works best?", options: [
          { text: "Leading indicators (RSI, Stochastic)", isCorrect: false },
          { text: "Lagging indicators (Moving Averages, MACD)", isCorrect: true },
          { text: "Both work equally well", isCorrect: false },
          { text: "Neither — don't use indicators in trends", isCorrect: false },
        ]},
        { text: "What is an 'indicator stack'?", options: [
          { text: "Using 5+ indicators from the same category for extra confirmation", isCorrect: false },
          { text: "Combining 3 indicators from 3 different categories (trend, momentum, volatility)", isCorrect: true },
          { text: "Stacking multiple timeframes on one chart", isCorrect: false },
          { text: "Using one indicator with multiple settings", isCorrect: false },
        ]},
        { text: "What is the role of the 'Trend Filter' layer in an indicator stack?", options: [
          { text: "To time your exact entry", isCorrect: false },
          { text: "To determine the overall direction you should trade", isCorrect: true },
          { text: "To set your stop loss distance", isCorrect: false },
          { text: "To measure volatility", isCorrect: false },
        ]},
        { text: "Why is using RSI + Stochastic together considered redundant?", options: [
          { text: "They are both lagging indicators", isCorrect: false },
          { text: "They are both momentum oscillators — they measure the same thing", isCorrect: true },
          { text: "They give opposite signals", isCorrect: false },
          { text: "Neither works in forex", isCorrect: false },
        ]},
        { text: "RSI shows 75 in a strong uptrend. What should you do?", options: [
          { text: "Immediately sell — it's overbought", isCorrect: false },
          { text: "Do nothing — overbought in a trend means strength, not a sell signal", isCorrect: true },
          { text: "Double your position", isCorrect: false },
          { text: "Switch to a lower timeframe", isCorrect: false },
        ]},
        { text: "When does RSI divergence become a HIGH-probability signal?", options: [
          { text: "Whenever divergence appears on any chart", isCorrect: false },
          { text: "When divergence occurs at a key support/resistance level with candlestick confirmation", isCorrect: true },
          { text: "Only on the M5 timeframe", isCorrect: false },
          { text: "When RSI is exactly at 50", isCorrect: false },
        ]},
        { text: "You see a buy signal on M15 but the Daily chart shows a strong downtrend. What should you do?", options: [
          { text: "Take the M15 buy — it's a hidden opportunity", isCorrect: false },
          { text: "Skip the trade — never trade against the higher timeframe trend", isCorrect: true },
          { text: "Enter with a larger position to compensate", isCorrect: false },
          { text: "Wait for the M5 to confirm", isCorrect: false },
        ]},
        { text: "What does an ADX reading below 20 indicate?", options: [
          { text: "Strong uptrend", isCorrect: false },
          { text: "Strong downtrend", isCorrect: false },
          { text: "Market is ranging — use leading indicators (oscillators)", isCorrect: true },
          { text: "Market is extremely volatile", isCorrect: false },
        ]},
        { text: "What is the BEST approach to combining indicators?", options: [
          { text: "Use as many as possible for maximum confirmation", isCorrect: false },
          { text: "Use one indicator from each category: trend + momentum + volatility", isCorrect: true },
          { text: "Only use price action, never indicators", isCorrect: false },
          { text: "Use the same indicator on 3 different timeframes", isCorrect: false },
        ]},
      ]
    }
  },
  {
    title: "Chart Patterns That Pay",
    description: "Master the most profitable chart patterns: Double Top/Bottom, Head & Shoulders, Triangles, Flags, Pennants, and Wedges. Learn to spot them, trade them, and avoid the most common mistakes.",
    order: 2,
    folder: "module-02-chart-patterns-that-pay",
    lessons: [
      { slug: "double-top-and-double-bottom-simple-but-powerful", title: "Double Top and Double Bottom — Simple But Powerful" },
      { slug: "head-and-shoulders-the-pattern-everyone-knows-but-few-trade-right", title: "Head and Shoulders — The Pattern Everyone Knows But Few Trade Right" },
      { slug: "triangles-ascending-descending-and-symmetrical", title: "Triangles — Ascending, Descending, and Symmetrical" },
      { slug: "flags-pennants-and-wedges-continuation-patterns-that-work", title: "Flags, Pennants, and Wedges — Continuation Patterns That Work" },
    ],
    quiz: {
      title: "Chart Patterns Quiz",
      description: "Test your mastery of reversal and continuation chart patterns. 10 questions, 75% to pass.",
      questions: [
        { text: "A Double Top pattern looks like the letter:", options: [
          { text: "W", isCorrect: false },
          { text: "M", isCorrect: true },
          { text: "V", isCorrect: false },
          { text: "N", isCorrect: false },
        ]},
        { text: "When is a Double Top pattern confirmed?", options: [
          { text: "When the second peak forms", isCorrect: false },
          { text: "When price breaks below the neckline", isCorrect: true },
          { text: "When RSI shows overbought", isCorrect: false },
          { text: "When volume increases at the second peak", isCorrect: false },
        ]},
        { text: "In a Head and Shoulders pattern, where should you place your stop loss?", options: [
          { text: "At the top of the head", isCorrect: false },
          { text: "Above the right shoulder", isCorrect: true },
          { text: "At the neckline", isCorrect: false },
          { text: "Below the left shoulder", isCorrect: false },
        ]},
        { text: "How do you calculate the profit target for a Head and Shoulders pattern?", options: [
          { text: "Use a fixed number of pips", isCorrect: false },
          { text: "Measure the distance from head to neckline, project from the breakout point", isCorrect: true },
          { text: "Use double the stop loss distance", isCorrect: false },
          { text: "Target the next round number", isCorrect: false },
        ]},
        { text: "An Ascending Triangle typically has:", options: [
          { text: "Flat support + falling resistance", isCorrect: false },
          { text: "Flat resistance + rising support", isCorrect: true },
          { text: "Both lines sloping upward", isCorrect: false },
          { text: "Both lines converging symmetrically", isCorrect: false },
        ]},
        { text: "How many 'touches' does a valid triangle pattern need?", options: [
          { text: "At least 2", isCorrect: false },
          { text: "At least 3", isCorrect: false },
          { text: "At least 5 (e.g., 3 on one side, 2 on the other)", isCorrect: true },
          { text: "Exactly 10", isCorrect: false },
        ]},
        { text: "Where should the best triangle breakouts occur?", options: [
          { text: "At the apex (where lines meet)", isCorrect: false },
          { text: "In the first 2/3 of the triangle", isCorrect: true },
          { text: "After 30+ candles inside the triangle", isCorrect: false },
          { text: "Only on the first touch of a trendline", isCorrect: false },
        ]},
        { text: "A Rising Wedge is a _____ signal.", options: [
          { text: "Bullish", isCorrect: false },
          { text: "Bearish", isCorrect: true },
          { text: "Neutral", isCorrect: false },
          { text: "It depends on the timeframe", isCorrect: false },
        ]},
        { text: "What precedes a Flag or Pennant pattern?", options: [
          { text: "A long, slow trend", isCorrect: false },
          { text: "A sharp, steep price movement (the flagpole)", isCorrect: true },
          { text: "A period of low volume", isCorrect: false },
          { text: "A sideways consolidation", isCorrect: false },
        ]},
        { text: "How do you calculate the profit target for a Flag pattern?", options: [
          { text: "Width of the flag × 2", isCorrect: false },
          { text: "Height of the flagpole projected from the breakout point", isCorrect: true },
          { text: "Fixed 100 pips", isCorrect: false },
          { text: "Distance from the nearest support level", isCorrect: false },
        ]},
      ]
    }
  },
  {
    title: "Pivot Points — Institutional Levels",
    description: "Discover the support and resistance levels that banks and hedge funds use every day. Learn to calculate pivot points and trade with two powerful strategies: bounce and breakout.",
    order: 3,
    folder: "module-03-pivot-points-institutional-levels",
    lessons: [
      { slug: "pivot-points-the-levels-banks-actually-watch", title: "Pivot Points — The Levels Banks Actually Watch" },
      { slug: "trading-with-pivot-points-a-step-by-step-strategy", title: "Trading with Pivot Points — A Step-by-Step Strategy" },
    ],
    quiz: {
      title: "Pivot Points Quiz",
      description: "Test your understanding of pivot point calculation, daily bias, and trading strategies. 10 questions, 75% to pass.",
      questions: [
        { text: "What is the formula for the central Pivot Point (PP)?", options: [
          { text: "(High + Low) ÷ 2", isCorrect: false },
          { text: "(High + Low + Close) ÷ 3", isCorrect: true },
          { text: "(Open + Close) ÷ 2", isCorrect: false },
          { text: "(High − Low) × Close", isCorrect: false },
        ]},
        { text: "If price opens ABOVE the Pivot Point, what is the daily bias?", options: [
          { text: "Bearish — look for shorts", isCorrect: false },
          { text: "Bullish — look for longs", isCorrect: true },
          { text: "Neutral — wait and see", isCorrect: false },
          { text: "It doesn't matter where price opens", isCorrect: false },
        ]},
        { text: "Which pivot point type is most widely used by institutional traders?", options: [
          { text: "Fibonacci pivots", isCorrect: false },
          { text: "Camarilla pivots", isCorrect: false },
          { text: "Standard (Floor) pivots", isCorrect: true },
          { text: "DeMark pivots", isCorrect: false },
        ]},
        { text: "On a normal trading day, price typically reaches:", options: [
          { text: "R3 or S3 (extreme levels)", isCorrect: false },
          { text: "R1 or S1 (first test levels)", isCorrect: true },
          { text: "Only the PP line", isCorrect: false },
          { text: "All 7 levels", isCorrect: false },
        ]},
        { text: "What makes pivot points 'self-fulfilling'?", options: [
          { text: "They use a secret formula", isCorrect: false },
          { text: "Thousands of traders watch the same levels, so price reacts to them", isCorrect: true },
          { text: "They predict the future with 100% accuracy", isCorrect: false },
          { text: "They are drawn by the broker", isCorrect: false },
        ]},
        { text: "In the Pivot Bounce strategy, what do you look for at S1?", options: [
          { text: "A strong breakout candle through S1", isCorrect: false },
          { text: "A rejection candlestick pattern (hammer, doji) for a buy entry", isCorrect: true },
          { text: "Volume spike and momentum continuation", isCorrect: false },
          { text: "Nothing — S1 is not important", isCorrect: false },
        ]},
        { text: "When should you use the Pivot Breakout strategy instead of the Bounce strategy?", options: [
          { text: "When ADX is below 20 (ranging market)", isCorrect: false },
          { text: "When price closes strongly through a level with high volume (trending)", isCorrect: true },
          { text: "On every trade, regardless of conditions", isCorrect: false },
          { text: "Only on weekly pivots", isCorrect: false },
        ]},
        { text: "If price reaches R3, what should you expect?", options: [
          { text: "Continued strong momentum upward", isCorrect: false },
          { text: "The day's move is likely overextended — expect a pullback or reversal", isCorrect: true },
          { text: "Switch to weekly pivots", isCorrect: false },
          { text: "Close all trades immediately", isCorrect: false },
        ]},
        { text: "What is 'confluence' in pivot point trading?", options: [
          { text: "Using multiple pivot point types at once", isCorrect: false },
          { text: "When a pivot level aligns with another S&R, Fibonacci, or round number", isCorrect: true },
          { text: "Trading all 7 pivot levels in one day", isCorrect: false },
          { text: "The distance between R1 and S1", isCorrect: false },
        ]},
        { text: "Which timeframe is pivot point trading best suited for?", options: [
          { text: "Monthly charts only", isCorrect: false },
          { text: "Intraday (M15 to H1) with daily pivot calculations", isCorrect: true },
          { text: "Weekly charts with yearly pivot calculations", isCorrect: false },
          { text: "Any timeframe — it doesn't matter", isCorrect: false },
        ]},
      ]
    }
  }
];

async function main() {
  console.log("🎓 Seeding Level 6: Pattern Mastery\n");

  // Find or create level
  let level = await prisma.level.findFirst({ where: { title: LEVEL_TITLE } });
  if (!level) {
    level = await prisma.level.create({
      data: { title: LEVEL_TITLE, slug: LEVEL_SLUG, description: LEVEL_DESCRIPTION, order: LEVEL_ORDER }
    });
    console.log(`  ✅ Created Level: ${level.title}`);
  } else {
    console.log(`  📦 Level exists: ${level.title} (${level.id})`);
  }

  for (const mod of MODULES) {
    console.log("=".repeat(60));
    console.log(`📦 Module ${mod.order}: ${mod.title}`);
    console.log("=".repeat(60));

    let module = await prisma.module.findFirst({ where: { title: mod.title, levelId: level.id } });
    if (!module) {
      module = await prisma.module.create({ data: { title: mod.title, description: mod.description, order: mod.order, levelId: level.id } });
      console.log(`  ✅ Created Module: ${module.title}`);
    } else {
      console.log(`  📦 Module exists: ${module.title} (${module.id})`);
    }

    // Lessons
    for (let i = 0; i < mod.lessons.length; i++) {
      const { slug, title } = mod.lessons[i];
      const htmlPath = path.join("content/data/level-06-pattern-mastery", mod.folder, `${slug}.html`);
      let content;
      try { content = await readFile(htmlPath, "utf-8"); } catch { console.log(`  ⚠️ HTML not found: ${slug}`); continue; }

      let lesson = await prisma.lesson.findFirst({ where: { slug } });
      if (lesson) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { content, title, moduleId: module.id, order: i + 1 } });
        console.log(`  📝 Updated: ${title}`);
      } else {
        await prisma.lesson.create({ data: { title, slug, content, order: i + 1, duration: 5, moduleId: module.id } });
        console.log(`  ✅ Created: ${title}`);
      }
    }

    // Quiz
    const existingQuiz = await prisma.quiz.findFirst({ where: { moduleId: module.id } });
    if (existingQuiz) { await prisma.quiz.delete({ where: { id: existingQuiz.id } }); console.log(`  🔄 Replaced existing quiz`); }

    const quiz = await prisma.quiz.create({
      data: {
        title: mod.quiz.title, description: mod.quiz.description, moduleId: module.id,
        questions: { create: mod.quiz.questions.map((q, idx) => ({ text: q.text, order: idx + 1, options: { create: q.options } })) },
      },
      include: { questions: true },
    });
    console.log(`  ✅ Quiz: ${quiz.questions.length} questions (ID: ${quiz.id})\n`);
  }

  console.log("=".repeat(60));
  console.log("✅ Level 6: Pattern Mastery — COMPLETE!");
  console.log("   9 Lessons, 30 Quiz Questions");
  console.log("=".repeat(60));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("Error:", e.message); await prisma.$disconnect(); process.exit(1); });
