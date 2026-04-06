/**
 * Seed Level 5: Technical Tools
 * M1: Fibonacci — The Golden Ratio (3 lessons, 10 quiz questions)
 * M2: Moving Averages — Following the Flow (3 lessons, 10 quiz questions)
 * M3: Essential Indicators Toolkit (6 lessons, 10 quiz questions)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");
const prisma = new PrismaClient();

const LEVEL_SLUG = "technical-tools";
const LEVEL_TITLE = "Technical Tools";
const LEVEL_DESCRIPTION = "Master the essential technical indicators that professional traders rely on. From Fibonacci to Ichimoku, learn how to use each tool — and more importantly, when NOT to use them.";
const LEVEL_ORDER = 5;

const MODULES = [
  {
    title: "Fibonacci — The Golden Ratio",
    description: "Learn the mathematical framework behind market pullbacks and profit targets. Master Fibonacci retracement, extension, and the power of confluence zones.",
    order: 1,
    folder: "module-01-fibonacci-the-golden-ratio",
    lessons: [
      { slug: "fibonacci-retracement-finding-where-price-will-bounce", title: "Fibonacci Retracement — Finding Where Price Will Bounce" },
      { slug: "fibonacci-extension-knowing-where-to-take-profit", title: "Fibonacci Extension — Knowing Where to Take Profit" },
      { slug: "combining-fibonacci-with-support-and-resistance-confluence-zones", title: "Combining Fibonacci with Support and Resistance — Confluence Zones" },
    ],
    quiz: {
      title: "Fibonacci Quiz",
      description: "Test your understanding of Fibonacci retracement, extension, and confluence zones. 10 questions, 75% to pass.",
      questions: [
        { text: "What is the 'Golden Ratio' in Fibonacci?", options: [
          { text: "23.6%", isCorrect: false },
          { text: "50.0%", isCorrect: false },
          { text: "61.8%", isCorrect: true },
          { text: "78.6%", isCorrect: false },
        ]},
        { text: "How do you draw Fibonacci Retracement in an uptrend?", options: [
          { text: "From Swing High to Swing Low", isCorrect: false },
          { text: "From Swing Low to Swing High", isCorrect: true },
          { text: "From the middle of the chart to the end", isCorrect: false },
          { text: "It doesn't matter which direction", isCorrect: false },
        ]},
        { text: "What is the main purpose of Fibonacci Retracement?", options: [
          { text: "To predict the exact future price", isCorrect: false },
          { text: "To identify where pullbacks are likely to end", isCorrect: true },
          { text: "To measure volume", isCorrect: false },
          { text: "To calculate profit targets", isCorrect: false },
        ]},
        { text: "How many points do you need to draw a Fibonacci Extension?", options: [
          { text: "1 (just the entry)", isCorrect: false },
          { text: "2 (swing low + swing high)", isCorrect: false },
          { text: "3 (A + B + C)", isCorrect: true },
          { text: "5 (all Fibonacci levels)", isCorrect: false },
        ]},
        { text: "Which Fibonacci Extension level is the most-watched for take profit?", options: [
          { text: "100%", isCorrect: false },
          { text: "127.2%", isCorrect: false },
          { text: "161.8%", isCorrect: true },
          { text: "200%", isCorrect: false },
        ]},
        { text: "What is a 'confluence zone' in trading?", options: [
          { text: "A zone where only one indicator gives a signal", isCorrect: false },
          { text: "A price area where multiple independent tools agree at the same level", isCorrect: true },
          { text: "A zone where the market always reverses", isCorrect: false },
          { text: "The area between two moving averages", isCorrect: false },
        ]},
        { text: "Which confluence combination is considered high probability?", options: [
          { text: "Fibonacci 61.8% + a random indicator", isCorrect: false },
          { text: "Fibonacci 61.8% + horizontal S&R + candlestick pattern", isCorrect: true },
          { text: "Just the Fibonacci level alone", isCorrect: false },
          { text: "Two different Fibonacci drawings overlapping", isCorrect: false },
        ]},
        { text: "Should you trade based solely on a Fibonacci level without confirmation?", options: [
          { text: "Yes — Fibonacci is always accurate", isCorrect: false },
          { text: "No — always wait for a candlestick signal or additional confluence", isCorrect: true },
          { text: "Only on higher timeframes", isCorrect: false },
          { text: "Only with the 61.8% level", isCorrect: false },
        ]},
        { text: "If price deeply retraces to the 61.8% level, which extension target is most realistic?", options: [
          { text: "200% (full expansion)", isCorrect: false },
          { text: "161.8% (aggressive target)", isCorrect: false },
          { text: "127.2% (conservative target)", isCorrect: true },
          { text: "300% (extreme extension)", isCorrect: false },
        ]},
        { text: "In which market condition does Fibonacci work best?", options: [
          { text: "Choppy/ranging markets", isCorrect: false },
          { text: "Trending markets", isCorrect: true },
          { text: "During news events only", isCorrect: false },
          { text: "It works equally well in all conditions", isCorrect: false },
        ]},
      ]
    }
  },
  {
    title: "Moving Averages — Following the Flow",
    description: "Understand SMA vs EMA, master Golden Cross and Death Cross crossovers, and learn to use moving averages as dynamic support and resistance.",
    order: 2,
    folder: "module-02-moving-averages-following-the-flow",
    lessons: [
      { slug: "sma-vs-ema-which-moving-average-should-you-use", title: "SMA vs EMA — Which Moving Average Should You Use?" },
      { slug: "moving-average-crossovers-golden-cross-and-death-cross", title: "Moving Average Crossovers — Golden Cross and Death Cross" },
      { slug: "using-moving-averages-as-dynamic-support-and-resistance", title: "Using Moving Averages as Dynamic Support and Resistance" },
    ],
    quiz: {
      title: "Moving Averages Quiz",
      description: "Test your understanding of SMA vs EMA, crossover signals, and dynamic support and resistance. 10 questions, 75% to pass.",
      questions: [
        { text: "What is the main difference between SMA and EMA?", options: [
          { text: "SMA is more accurate than EMA", isCorrect: false },
          { text: "EMA gives more weight to recent prices, making it faster to react", isCorrect: true },
          { text: "They are exactly the same thing", isCorrect: false },
          { text: "SMA is only used for stocks, EMA for forex", isCorrect: false },
        ]},
        { text: "Which moving average is best for avoiding fakeouts?", options: [
          { text: "EMA (faster, more responsive)", isCorrect: false },
          { text: "SMA (smoother, fewer false signals)", isCorrect: true },
          { text: "Neither — they both give the same number of fakeouts", isCorrect: false },
          { text: "A 5-period moving average", isCorrect: false },
        ]},
        { text: "What is a Golden Cross?", options: [
          { text: "When the 200 MA crosses above the 50 MA", isCorrect: false },
          { text: "When the 50 MA crosses above the 200 MA", isCorrect: true },
          { text: "When two EMA lines touch each other", isCorrect: false },
          { text: "When price touches the 50 MA", isCorrect: false },
        ]},
        { text: "Moving averages are _____ indicators.", options: [
          { text: "Leading (they predict the future)", isCorrect: false },
          { text: "Lagging (they react to price that already happened)", isCorrect: true },
          { text: "Real-time (they show the current price exactly)", isCorrect: false },
          { text: "Forward-looking", isCorrect: false },
        ]},
        { text: "How should you use a Golden/Death Cross signal?", options: [
          { text: "As an instant buy/sell trigger — enter immediately", isCorrect: false },
          { text: "To set your directional bias, then use price action for the actual entry", isCorrect: true },
          { text: "Ignore it — crossovers don't work", isCorrect: false },
          { text: "Only trade it on the M1 timeframe", isCorrect: false },
        ]},
        { text: "In an uptrend, a moving average acts as:", options: [
          { text: "Dynamic resistance", isCorrect: false },
          { text: "Dynamic support — price bounces off the MA from above", isCorrect: true },
          { text: "A fixed horizontal line", isCorrect: false },
          { text: "It has no S&R function", isCorrect: false },
        ]},
        { text: "What is the 'MA Zone' strategy?", options: [
          { text: "Using a single MA as a signal", isCorrect: false },
          { text: "Using the area between two MAs (like 10 EMA + 20 EMA) as a dynamic S&R zone", isCorrect: true },
          { text: "Drawing horizontal lines at MA values", isCorrect: false },
          { text: "Only using the 200 SMA", isCorrect: false },
        ]},
        { text: "Which MA is considered the most important institutional level?", options: [
          { text: "10 EMA", isCorrect: false },
          { text: "20 SMA", isCorrect: false },
          { text: "200 SMA", isCorrect: true },
          { text: "5 EMA", isCorrect: false },
        ]},
        { text: "When a moving average that was support breaks, it becomes:", options: [
          { text: "Irrelevant — ignore it", isCorrect: false },
          { text: "Resistance — watch for a retest and rejection", isCorrect: true },
          { text: "Double support — even stronger", isCorrect: false },
          { text: "A trend line", isCorrect: false },
        ]},
        { text: "Dynamic S&R from moving averages works best in:", options: [
          { text: "Ranging/sideways markets", isCorrect: false },
          { text: "Trending markets — MAs flatten in ranges and become useless", isCorrect: true },
          { text: "Only during news events", isCorrect: false },
          { text: "It works equally in all conditions", isCorrect: false },
        ]},
      ]
    }
  },
  {
    title: "Essential Indicators Toolkit",
    description: "Master RSI, MACD, Stochastic, Bollinger Bands, Ichimoku Cloud, ADX, CCI, and Parabolic SAR. Learn when to use each indicator — and when NOT to.",
    order: 3,
    folder: "module-03-essential-indicators-toolkit",
    lessons: [
      { slug: "rsi-overbought-oversold-and-the-signals-in-between", title: "RSI — Overbought, Oversold, and the Signals in Between" },
      { slug: "macd-momentum-made-visual", title: "MACD — Momentum Made Visual" },
      { slug: "stochastic-oscillator-fast-vs-slow-and-when-it-works-best", title: "Stochastic Oscillator — Fast vs Slow and When It Works Best" },
      { slug: "bollinger-bands-measuring-volatility-like-a-pro", title: "Bollinger Bands — Measuring Volatility Like a Pro" },
      { slug: "ichimoku-cloud-the-all-in-one-indicator-simplified", title: "Ichimoku Cloud — The All-in-One Indicator Simplified" },
      { slug: "adx-cci-and-parabolic-sar-the-supporting-cast", title: "ADX, CCI, and Parabolic SAR — The Supporting Cast" },
    ],
    quiz: {
      title: "Essential Indicators Quiz",
      description: "Test your mastery of RSI, MACD, Stochastic, Bollinger Bands, Ichimoku, ADX, CCI, and Parabolic SAR. 10 questions, 75% to pass.",
      questions: [
        { text: "What does an RSI reading above 70 indicate?", options: [
          { text: "The market will definitely reverse", isCorrect: false },
          { text: "The market is overbought — be cautious, not automatic sell", isCorrect: true },
          { text: "The market is oversold", isCorrect: false },
          { text: "You should immediately buy more", isCorrect: false },
        ]},
        { text: "What is RSI Divergence?", options: [
          { text: "RSI and price both going up together", isCorrect: false },
          { text: "RSI and price moving in opposite directions — warning of a potential reversal", isCorrect: true },
          { text: "RSI crossing the 50 level", isCorrect: false },
          { text: "RSI staying at exactly 0", isCorrect: false },
        ]},
        { text: "What are the 3 components of the MACD?", options: [
          { text: "Price, Volume, Trend", isCorrect: false },
          { text: "MACD Line, Signal Line, Histogram", isCorrect: true },
          { text: "Upper Band, Middle Band, Lower Band", isCorrect: false },
          { text: "Tenkan, Kijun, Cloud", isCorrect: false },
        ]},
        { text: "Where do the best Stochastic crossover signals occur?", options: [
          { text: "At the 50 level", isCorrect: false },
          { text: "Inside the extreme zones — below 20 or above 80", isCorrect: true },
          { text: "At any level — they're all equal", isCorrect: false },
          { text: "Only at 0 or 100", isCorrect: false },
        ]},
        { text: "What does a Bollinger Band 'squeeze' indicate?", options: [
          { text: "The market is about to close", isCorrect: false },
          { text: "Volatility is very low — a big move (breakout) is coming", isCorrect: true },
          { text: "The trend is very strong", isCorrect: false },
          { text: "You should sell immediately", isCorrect: false },
        ]},
        { text: "In a ranging market, how do you trade Bollinger Bands?", options: [
          { text: "Always buy at the upper band", isCorrect: false },
          { text: "Buy at lower band, sell at upper band — target the middle band", isCorrect: true },
          { text: "Ignore Bollinger Bands in ranges", isCorrect: false },
          { text: "Trade only when bands are expanding", isCorrect: false },
        ]},
        { text: "In Ichimoku, what does it mean when price is INSIDE the cloud?", options: [
          { text: "Strong buy signal", isCorrect: false },
          { text: "Strong sell signal", isCorrect: false },
          { text: "No trade — wait for a breakout above or below the cloud", isCorrect: true },
          { text: "You should use smaller position sizes", isCorrect: false },
        ]},
        { text: "What does the ADX indicator measure?", options: [
          { text: "Trend direction (up or down)", isCorrect: false },
          { text: "Trend strength (how strong, not which direction)", isCorrect: true },
          { text: "Overbought/oversold levels", isCorrect: false },
          { text: "Volume", isCorrect: false },
        ]},
        { text: "How does Parabolic SAR work as a trailing stop?", options: [
          { text: "Place your stop at the opposite side of the chart", isCorrect: false },
          { text: "Move your stop to each new SAR dot — exit when dots flip", isCorrect: true },
          { text: "Keep your stop fixed and never move it", isCorrect: false },
          { text: "SAR cannot be used as a trailing stop", isCorrect: false },
        ]},
        { text: "How many indicators should you use on your chart at the same time?", options: [
          { text: "As many as possible — more = better", isCorrect: false },
          { text: "Maximum 2-3, each from a different category (trend, momentum, volatility)", isCorrect: true },
          { text: "Exactly 1 — only one indicator is needed", isCorrect: false },
          { text: "At least 10 for confirmation", isCorrect: false },
        ]},
      ]
    }
  }
];

async function main() {
  console.log("🎓 Seeding Level 5: Technical Tools\n");

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
      const htmlPath = path.join("content/data/level-05-technical-tools", mod.folder, `${slug}.html`);
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
  console.log("✅ Level 5: Technical Tools — COMPLETE!");
  console.log("   12 Lessons, 24 Images, 30 Quiz Questions");
  console.log("=".repeat(60));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("Error:", e.message); await prisma.$disconnect(); process.exit(1); });
