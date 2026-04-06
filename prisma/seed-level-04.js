/**
 * Seed Level 4: Price Action
 * M1: Price Boundaries — Support & Resistance (5 lessons, 10 quiz questions)
 * M2: Candlestick Language (5 lessons, 10 quiz questions)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");
const prisma = new PrismaClient();

const LEVEL_SLUG = "price-action";
const LEVEL_TITLE = "Price Action";
const LEVEL_DESCRIPTION = "Learn to read the market like a pro. Master support & resistance, candlestick patterns, and price action trading — the foundation of every profitable strategy.";
const LEVEL_ORDER = 4;

const MODULES = [
  {
    title: "Price Boundaries — Support & Resistance",
    description: "Support and resistance zones, how to draw them, polarity principle, trend lines, channels, and psychological levels.",
    order: 1,
    folder: "module-01-price-boundaries-support-resistance",
    lessons: [
      { slug: "support-and-resistance-the-only-2-lines-you-actually-need", title: "Support and Resistance — The Only 2 Lines You Actually Need" },
      { slug: "how-to-draw-support-and-resistance-and-stop-guessing", title: "How to Draw Support and Resistance (And Stop Guessing)" },
      { slug: "support-becomes-resistance-the-polarity-principle", title: "Support Becomes Resistance — The Polarity Principle" },
      { slug: "trend-lines-and-channels-riding-the-wave", title: "Trend Lines and Channels — Riding the Wave" },
      { slug: "psychological-levels-why-round-numbers-matter", title: "Psychological Levels — Why Round Numbers Matter" },
    ],
    quiz: {
      title: "Support & Resistance Quiz",
      description: "Test your understanding of S&R zones, drawing techniques, polarity, trend lines, and psychological levels. 10 questions, 75% to pass.",
      questions: [
        { text: "What is a support level?", options: [
          { text: "A price level where selling pressure prevents further decline", isCorrect: false },
          { text: "A price level where buying pressure is strong enough to prevent further decline", isCorrect: true },
          { text: "The highest price a currency has ever reached", isCorrect: false },
          { text: "A moving average on the daily chart", isCorrect: false },
        ]},
        { text: "Should you draw support and resistance as exact lines or zones?", options: [
          { text: "Exact lines — precision is key", isCorrect: false },
          { text: "Zones (5-20 pips wide) — price rarely bounces from the exact same pip", isCorrect: true },
          { text: "It doesn't matter", isCorrect: false },
          { text: "Only zones on lower timeframes, lines on higher ones", isCorrect: false },
        ]},
        { text: "How many touches does a level need to be considered 'strong'?", options: [
          { text: "1", isCorrect: false },
          { text: "2", isCorrect: false },
          { text: "3 or more", isCorrect: true },
          { text: "10 or more", isCorrect: false },
        ]},
        { text: "What is the Polarity Principle?", options: [
          { text: "Support and resistance levels always hold forever", isCorrect: false },
          { text: "Broken support becomes resistance, and broken resistance becomes support", isCorrect: true },
          { text: "Price always reverses at round numbers", isCorrect: false },
          { text: "Trend lines only work in uptrends", isCorrect: false },
        ]},
        { text: "After a support level breaks, what is the best entry strategy?", options: [
          { text: "Buy immediately when support breaks", isCorrect: false },
          { text: "Wait for price to retest the broken support (now resistance) and look for a rejection", isCorrect: true },
          { text: "Place a buy order at the broken level", isCorrect: false },
          { text: "Switch to a completely different currency pair", isCorrect: false },
        ]},
        { text: "How do you draw an uptrend line?", options: [
          { text: "Connect the peaks (swing highs)", isCorrect: false },
          { text: "Connect the valleys (swing lows / higher lows)", isCorrect: true },
          { text: "Draw a horizontal line at the average price", isCorrect: false },
          { text: "Connect the open and close of the first candle", isCorrect: false },
        ]},
        { text: "What angle should a sustainable trend line typically have?", options: [
          { text: "90° (vertical)", isCorrect: false },
          { text: "30-45° (moderate slope)", isCorrect: true },
          { text: "0° (horizontal)", isCorrect: false },
          { text: "70-80° (very steep)", isCorrect: false },
        ]},
        { text: "What does it mean when price breaks below an ascending channel?", options: [
          { text: "The uptrend is accelerating", isCorrect: false },
          { text: "Nothing — channels are unreliable", isCorrect: false },
          { text: "The uptrend may be ending — potential reversal signal", isCorrect: true },
          { text: "You should immediately buy more", isCorrect: false },
        ]},
        { text: "Why do round numbers (like 1.1000) act as support and resistance?", options: [
          { text: "They are calculated by algorithms", isCorrect: false },
          { text: "Banks set them as official levels", isCorrect: false },
          { text: "Human psychology — traders naturally place orders at round numbers, creating self-fulfilling prophecy", isCorrect: true },
          { text: "They are mandated by market regulators", isCorrect: false },
        ]},
        { text: "Why should you NOT place your stop loss exactly at a round number?", options: [
          { text: "It's against broker rules", isCorrect: false },
          { text: "Institutional traders hunt stops clustered at round numbers", isCorrect: true },
          { text: "Round numbers are always bad for trading", isCorrect: false },
          { text: "Stop losses don't work at round numbers", isCorrect: false },
        ]},
      ]
    }
  },
  {
    title: "Candlestick Language",
    description: "Bullish and bearish reversal patterns, indecision candles, price action trading, and combining S&R with candlestick signals.",
    order: 2,
    folder: "module-02-candlestick-language",
    lessons: [
      { slug: "bullish-reversal-candles-hammer-engulfing-morning-star", title: "Bullish Reversal Candles — Hammer, Engulfing, Morning Star" },
      { slug: "bearish-reversal-candles-shooting-star-evening-star-dark-cloud", title: "Bearish Reversal Candles — Shooting Star, Evening Star, Dark Cloud" },
      { slug: "continuation-patterns-doji-spinning-top-and-indecision", title: "Continuation Patterns — Doji, Spinning Top, and Indecision" },
      { slug: "price-action-trading-reading-the-market-without-indicators", title: "Price Action Trading — Reading the Market Without Indicators" },
      { slug: "applying-s-r-and-candlesticks-together-the-power-combo", title: "Applying S&R and Candlesticks Together — The Power Combo" },
    ],
    quiz: {
      title: "Candlestick Language Quiz",
      description: "Test your understanding of reversal patterns, indecision candles, price action, and the S&R + candlestick combo. 10 questions, 75% to pass.",
      questions: [
        { text: "What does a Hammer candlestick indicate?", options: [
          { text: "Strong selling will continue", isCorrect: false },
          { text: "Potential bullish reversal — buyers rejected lower prices", isCorrect: true },
          { text: "The trend is neutral", isCorrect: false },
          { text: "You should sell immediately", isCorrect: false },
        ]},
        { text: "What makes a Bullish Engulfing pattern valid?", options: [
          { text: "A green candle that is smaller than the previous red candle", isCorrect: false },
          { text: "A large green candle that completely engulfs the previous red candle's body", isCorrect: true },
          { text: "Any two green candles in a row", isCorrect: false },
          { text: "A candle with equal upper and lower wicks", isCorrect: false },
        ]},
        { text: "The Morning Star is a ___-candle reversal pattern.", options: [
          { text: "1", isCorrect: false },
          { text: "2", isCorrect: false },
          { text: "3", isCorrect: true },
          { text: "4", isCorrect: false },
        ]},
        { text: "Where should bearish reversal patterns appear for maximum reliability?", options: [
          { text: "In the middle of a downtrend", isCorrect: false },
          { text: "At a key resistance level, at the top of an uptrend", isCorrect: true },
          { text: "At any random price level", isCorrect: false },
          { text: "Only on the M5 timeframe", isCorrect: false },
        ]},
        { text: "What does a Doji candlestick represent?", options: [
          { text: "Strong buying pressure", isCorrect: false },
          { text: "Strong selling pressure", isCorrect: false },
          { text: "Indecision — buyers and sellers are balanced, open ≈ close", isCorrect: true },
          { text: "The market is closed", isCorrect: false },
        ]},
        { text: "A Gravestone Doji at the top of an uptrend suggests:", options: [
          { text: "The uptrend will definitely continue", isCorrect: false },
          { text: "Potential bearish reversal — buyers tried and failed to push higher", isCorrect: true },
          { text: "Nothing — doji candles are meaningless", isCorrect: false },
          { text: "You should add to your long position", isCorrect: false },
        ]},
        { text: "What is the main advantage of price action trading over indicator-based trading?", options: [
          { text: "Price action guarantees 100% win rate", isCorrect: false },
          { text: "Price is the only leading indicator — it shows what's happening NOW, not what already happened", isCorrect: true },
          { text: "Indicators are banned by brokers", isCorrect: false },
          { text: "Price action requires no chart at all", isCorrect: false },
        ]},
        { text: "What does 'confluence' mean in price action trading?", options: [
          { text: "Trading only one currency pair", isCorrect: false },
          { text: "Multiple factors (S&R, pattern, trend, round number) aligning at the same price point", isCorrect: true },
          { text: "Using as many indicators as possible", isCorrect: false },
          { text: "Trading the same direction as the news", isCorrect: false },
        ]},
        { text: "What is the correct sequence for a price action trade?", options: [
          { text: "See pattern → enter immediately → set stop loss later", isCorrect: false },
          { text: "Identify key level → wait for candlestick signal → confirm → enter with proper R:R", isCorrect: true },
          { text: "Enter at any price → hope for profit", isCorrect: false },
          { text: "Follow the news → trade the reaction", isCorrect: false },
        ]},
        { text: "You see a Hammer at support, but the next candle closes red. What should you do?", options: [
          { text: "Buy anyway — the hammer is enough", isCorrect: false },
          { text: "Do nothing — the confirmation candle did not confirm the reversal", isCorrect: true },
          { text: "Sell because it's now bearish", isCorrect: false },
          { text: "Close your trading platform and walk away forever", isCorrect: false },
        ]},
      ]
    }
  }
];

async function main() {
  console.log("🎓 Seeding Level 4: Price Action\n");

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
      const htmlPath = path.join("content/data/level-04-price-action", mod.folder, `${slug}.html`);
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
  console.log("✅ Level 4: Price Action — COMPLETE!");
  console.log("   10 Lessons, 20 Images, 20 Quiz Questions");
  console.log("=".repeat(60));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("Error:", e.message); await prisma.$disconnect(); process.exit(1); });
