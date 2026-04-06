/**
 * Save Level 2 lesson content to DB + Generate quizzes for all 3 modules
 * 
 * Usage: node prisma/seed-level-02.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");

const prisma = new PrismaClient();

const LEVEL_SLUG = "the-foundation";
const CONTENT_BASE = "content/data/level-02-the-foundation";

const MODULES = [
  {
    folder: "module-01-choosing-your-broker",
    title: "Choosing Your Broker",
    lessons: [
      "how-to-choose-a-forex-broker-the-only-checklist-you-need",
      "ecn-vs-market-maker-vs-stp-what-your-broker-doesnt-tell-you",
      "demo-account-your-free-playground-and-how-to-use-it-right"
    ],
    quiz: {
      title: "Choosing Your Broker Quiz",
      description: "Test your knowledge of broker selection, execution models, and demo account usage. 10 questions, 75% to pass.",
      questions: [
        {
          text: "What is the MOST important factor when choosing a forex broker?",
          options: [
            { text: "High leverage", isCorrect: false },
            { text: "Regulation by a Tier-1 authority", isCorrect: true },
            { text: "Lowest minimum deposit", isCorrect: false },
            { text: "Best trading bonus", isCorrect: false }
          ]
        },
        {
          text: "Which regulator is considered Tier-1?",
          options: [
            { text: "An offshore regulator with no audits", isCorrect: false },
            { text: "FCA (UK Financial Conduct Authority)", isCorrect: true },
            { text: "Any regulator that offers 1:1000 leverage", isCorrect: false },
            { text: "None — regulation doesn't matter", isCorrect: false }
          ]
        },
        {
          text: "What should you do before depositing a large amount with a broker?",
          options: [
            { text: "Check their social media followers", isCorrect: false },
            { text: "Test with a small withdrawal first", isCorrect: true },
            { text: "Ask a friend for their opinion", isCorrect: false },
            { text: "Look at the broker's website design", isCorrect: false }
          ]
        },
        {
          text: "What type of broker sends your order directly to a liquidity pool?",
          options: [
            { text: "Market Maker", isCorrect: false },
            { text: "ECN (Electronic Communication Network)", isCorrect: true },
            { text: "Dealing Desk broker", isCorrect: false },
            { text: "Offshore broker", isCorrect: false }
          ]
        },
        {
          text: "What is the main disadvantage of a Market Maker broker?",
          options: [
            { text: "They charge commission on every trade", isCorrect: false },
            { text: "They may have a conflict of interest since they take the other side of your trade", isCorrect: true },
            { text: "They offer the fastest execution", isCorrect: false },
            { text: "They only work on weekends", isCorrect: false }
          ]
        },
        {
          text: "What does STP stand for in broker execution?",
          options: [
            { text: "Standard Trading Protocol", isCorrect: false },
            { text: "Straight Through Processing", isCorrect: true },
            { text: "Secure Trade Platform", isCorrect: false },
            { text: "Simple Trading Process", isCorrect: false }
          ]
        },
        {
          text: "What is the biggest mistake beginners make with demo accounts?",
          options: [
            { text: "Using them for too short a time", isCorrect: false },
            { text: "Trading with unrealistic capital that doesn't match their live plan", isCorrect: true },
            { text: "Practicing risk management", isCorrect: false },
            { text: "Using the same strategy they plan to use live", isCorrect: false }
          ]
        },
        {
          text: "How long should you typically stay on a demo account before going live?",
          options: [
            { text: "1 day", isCorrect: false },
            { text: "4-8 weeks", isCorrect: true },
            { text: "At least 2 years", isCorrect: false },
            { text: "You should never use demo — go straight to live", isCorrect: false }
          ]
        },
        {
          text: "What is the best way to transition from demo to live trading?",
          options: [
            { text: "Deposit $10,000 and trade standard lots immediately", isCorrect: false },
            { text: "Start with a micro account ($50-$200) and the smallest position sizes", isCorrect: true },
            { text: "Wait until you never lose on demo", isCorrect: false },
            { text: "Copy someone else's trades", isCorrect: false }
          ]
        },
        {
          text: "Which is a red flag when evaluating a broker?",
          options: [
            { text: "They offer a demo account", isCorrect: false },
            { text: "They are regulated by FCA or ASIC", isCorrect: false },
            { text: "They promise 'guaranteed profits'", isCorrect: true },
            { text: "They charge commission on ECN accounts", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    folder: "module-02-the-three-lenses-of-analysis",
    title: "The Three Lenses of Analysis",
    lessons: [
      "technical-analysis-reading-the-chart-like-a-pro",
      "fundamental-analysis-trading-the-news-behind-the-news",
      "sentiment-analysis-following-the-crowd-or-fading-it",
      "which-analysis-style-fits-you-finding-your-edge"
    ],
    quiz: {
      title: "The Three Lenses of Analysis Quiz",
      description: "Test your understanding of technical, fundamental, and sentiment analysis. 10 questions, 75% to pass.",
      questions: [
        {
          text: "What is the core question technical analysis tries to answer?",
          options: [
            { text: "Why is the price moving?", isCorrect: false },
            { text: "What is the price doing, and what's it likely to do next?", isCorrect: true },
            { text: "What do other traders think?", isCorrect: false },
            { text: "What will the central bank do next?", isCorrect: false }
          ]
        },
        {
          text: "Which is NOT one of the three core principles of technical analysis?",
          options: [
            { text: "Price discounts everything", isCorrect: false },
            { text: "Price moves in trends", isCorrect: false },
            { text: "History repeats itself", isCorrect: false },
            { text: "Price always goes up in the long run", isCorrect: true }
          ]
        },
        {
          text: "What is the #1 economic factor that drives currency values?",
          options: [
            { text: "Stock market performance", isCorrect: false },
            { text: "Interest rates set by central banks", isCorrect: true },
            { text: "Social media sentiment", isCorrect: false },
            { text: "Weather patterns", isCorrect: false }
          ]
        },
        {
          text: "What does the market react to most when economic data is released?",
          options: [
            { text: "The actual number itself", isCorrect: false },
            { text: "The surprise — actual vs. forecast", isCorrect: true },
            { text: "The previous month's data", isCorrect: false },
            { text: "How the news anchor reports it", isCorrect: false }
          ]
        },
        {
          text: "What does sentiment analysis measure?",
          options: [
            { text: "Economic growth rates", isCorrect: false },
            { text: "Chart patterns and indicators", isCorrect: false },
            { text: "The overall attitude/positioning of market participants", isCorrect: true },
            { text: "Central bank meeting minutes", isCorrect: false }
          ]
        },
        {
          text: "When 80%+ of retail traders are positioned one way, what does this typically signal?",
          options: [
            { text: "The trend will definitely continue", isCorrect: false },
            { text: "A strong contrarian reversal signal", isCorrect: true },
            { text: "Nothing — retail positioning doesn't matter", isCorrect: false },
            { text: "Time to copy the majority", isCorrect: false }
          ]
        },
        {
          text: "What is the COT (Commitment of Traders) report?",
          options: [
            { text: "A daily stock market summary", isCorrect: false },
            { text: "A weekly report showing how institutional traders are positioned", isCorrect: true },
            { text: "A broker's financial statement", isCorrect: false },
            { text: "A list of the most traded currency pairs", isCorrect: false }
          ]
        },
        {
          text: "Which analysis mix is best for a day trader who watches charts all day?",
          options: [
            { text: "100% Fundamental", isCorrect: false },
            { text: "90% Technical + 5% Fundamental + 5% Sentiment", isCorrect: true },
            { text: "100% Sentiment", isCorrect: false },
            { text: "50% Fundamental + 50% Sentiment", isCorrect: false }
          ]
        },
        {
          text: "What is 'convergence' in trading analysis?",
          options: [
            { text: "When all three analysis types (TA, FA, SA) align on the same direction", isCorrect: true },
            { text: "When two moving averages cross", isCorrect: false },
            { text: "When price reaches zero", isCorrect: false },
            { text: "When the market is closed", isCorrect: false }
          ]
        },
        {
          text: "What should beginners do during high-impact news releases?",
          options: [
            { text: "Trade aggressively to catch the move", isCorrect: false },
            { text: "Avoid trading until they're experienced enough to handle volatility", isCorrect: true },
            { text: "Always go long", isCorrect: false },
            { text: "Remove their stop losses", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    folder: "module-03-your-first-charts",
    title: "Your First Charts",
    lessons: [
      "chart-types-line-bar-and-candle-and-why-candles-win",
      "timeframes-explained-m1-to-monthly-and-what-each-one-shows",
      "reading-a-candlestick-body-wick-and-what-theyre-telling-you",
      "your-first-trade-on-a-demo-a-step-by-step-walkthrough"
    ],
    quiz: {
      title: "Your First Charts Quiz",
      description: "Test your knowledge of chart types, timeframes, candlestick reading, and trade execution. 10 questions, 75% to pass.",
      questions: [
        {
          text: "Why do most professional traders prefer candlestick charts?",
          options: [
            { text: "They use less screen space", isCorrect: false },
            { text: "They show Open, High, Low, Close in an easy-to-read format", isCorrect: true },
            { text: "They are the only chart type that works", isCorrect: false },
            { text: "They were invented by Wall Street", isCorrect: false }
          ]
        },
        {
          text: "What does a line chart show?",
          options: [
            { text: "Open, High, Low, and Close prices", isCorrect: false },
            { text: "Only the closing price of each period", isCorrect: true },
            { text: "Volume data", isCorrect: false },
            { text: "Indicator values", isCorrect: false }
          ]
        },
        {
          text: "Which timeframe is best recommended for beginners?",
          options: [
            { text: "M1 (1 minute)", isCorrect: false },
            { text: "H1 or H4 (1 hour or 4 hour)", isCorrect: true },
            { text: "MN (Monthly)", isCorrect: false },
            { text: "M5 (5 minutes)", isCorrect: false }
          ]
        },
        {
          text: "What does a long lower wick on a candlestick indicate?",
          options: [
            { text: "Strong selling pressure throughout the period", isCorrect: false },
            { text: "Buyers pushed price back up — buying pressure/rejection of lower prices", isCorrect: true },
            { text: "The market is closed", isCorrect: false },
            { text: "The candle is broken/invalid", isCorrect: false }
          ]
        },
        {
          text: "What is a 'Doji' candlestick?",
          options: [
            { text: "A large green candle showing strong buying", isCorrect: false },
            { text: "A candle where open and close are nearly identical — indicating indecision", isCorrect: true },
            { text: "A candlestick that only appears on the daily chart", isCorrect: false },
            { text: "A Japanese trading platform", isCorrect: false }
          ]
        },
        {
          text: "In multi-timeframe analysis, what is the purpose of the higher timeframe?",
          options: [
            { text: "To find the exact entry point", isCorrect: false },
            { text: "To identify the overall trend direction", isCorrect: true },
            { text: "To calculate pip values", isCorrect: false },
            { text: "To determine the lot size", isCorrect: false }
          ]
        },
        {
          text: "What lot size should beginners use for their first trades?",
          options: [
            { text: "1.00 (standard lot)", isCorrect: false },
            { text: "0.10 (mini lot)", isCorrect: false },
            { text: "0.01 (micro lot)", isCorrect: true },
            { text: "10.00 (ten lots)", isCorrect: false }
          ]
        },
        {
          text: "What risk-reward ratio should you aim for as a minimum?",
          options: [
            { text: "1:0.5 (risk more than you can gain)", isCorrect: false },
            { text: "1:1 (equal risk and reward)", isCorrect: false },
            { text: "1:2 (reward is twice the risk)", isCorrect: true },
            { text: "Risk doesn't matter if you're right", isCorrect: false }
          ]
        },
        {
          text: "What should you NEVER do once you've placed a trade with a stop loss?",
          options: [
            { text: "Check the trade result later", isCorrect: false },
            { text: "Record it in your journal", isCorrect: false },
            { text: "Move the stop loss further away when price goes against you", isCorrect: true },
            { text: "Set a take profit", isCorrect: false }
          ]
        },
        {
          text: "What is the primary goal of your first 20 trades?",
          options: [
            { text: "Make as much profit as possible", isCorrect: false },
            { text: "Building correct habits — position sizing, stop losses, journaling", isCorrect: true },
            { text: "Testing as many strategies as possible", isCorrect: false },
            { text: "Trading without a stop loss to see what happens", isCorrect: false }
          ]
        }
      ]
    }
  }
];

// Lesson title mapping (slug → title)
const LESSON_TITLES = {
  "how-to-choose-a-forex-broker-the-only-checklist-you-need": "How to Choose a Forex Broker — The Only Checklist You Need",
  "ecn-vs-market-maker-vs-stp-what-your-broker-doesnt-tell-you": "ECN vs Market Maker vs STP — What Your Broker Doesn't Tell You",
  "demo-account-your-free-playground-and-how-to-use-it-right": "Demo Account — Your Free Playground (And How to Use It Right)",
  "technical-analysis-reading-the-chart-like-a-pro": "Technical Analysis — Reading the Chart Like a Pro",
  "fundamental-analysis-trading-the-news-behind-the-news": "Fundamental Analysis — Trading the News Behind the News",
  "sentiment-analysis-following-the-crowd-or-fading-it": "Sentiment Analysis — Following the Crowd (or Fading It)",
  "which-analysis-style-fits-you-finding-your-edge": "Which Analysis Style Fits You? — Finding Your Edge",
  "chart-types-line-bar-and-candle-and-why-candles-win": "Chart Types — Line, Bar, and Candle (And Why Candles Win)",
  "timeframes-explained-m1-to-monthly-and-what-each-one-shows": "Timeframes Explained — M1 to Monthly and What Each One Shows",
  "reading-a-candlestick-body-wick-and-what-theyre-telling-you": "Reading a Candlestick — Body, Wick, and What They're Telling You",
  "your-first-trade-on-a-demo-a-step-by-step-walkthrough": "Your First Trade on a Demo — A Step-by-Step Walkthrough"
};

async function main() {
  console.log("🎓 Seeding Level 2: The Foundation\n");

  // 1. Find or create Level
  let level = await prisma.level.findFirst({ where: { title: "The Foundation" } });
  if (!level) {
    level = await prisma.level.create({
      data: {
        title: "The Foundation",
        description: "Trading Foundations — Choosing a broker, types of analysis, and chart basics.",
        order: 2,
      }
    });
    console.log(`✅ Created Level: ${level.title}`);
  } else {
    console.log(`📦 Level exists: ${level.title} (${level.id})`);
  }

  // 2. Process each module
  for (let mi = 0; mi < MODULES.length; mi++) {
    const mod = MODULES[mi];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Module ${mi + 1}: ${mod.title}`);
    console.log(`${"=".repeat(60)}`);

    // Find or create module
    let module = await prisma.module.findFirst({
      where: { title: mod.title, levelId: level.id }
    });
    if (!module) {
      module = await prisma.module.create({
        data: {
          title: mod.title,
          description: `Module ${mi + 1} of Level 2`,
          order: mi + 1,
          levelId: level.id,
        }
      });
      console.log(`  ✅ Created Module: ${module.title}`);
    } else {
      console.log(`  📦 Module exists: ${module.title} (${module.id})`);
    }

    // 3. Process lessons
    for (let li = 0; li < mod.lessons.length; li++) {
      const slug = mod.lessons[li];
      const title = LESSON_TITLES[slug] || slug;
      const htmlPath = path.join(CONTENT_BASE, mod.folder, `${slug}.html`);

      let content;
      try {
        content = await readFile(htmlPath, "utf-8");
      } catch {
        console.log(`  ⚠️ HTML not found: ${slug}`);
        continue;
      }

      // Find or create lesson
      let lesson = await prisma.lesson.findFirst({ where: { slug } });
      if (lesson) {
        // Update content
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { content, title, moduleId: module.id, order: li + 1 }
        });
        console.log(`  📝 Updated: ${title}`);
      } else {
        lesson = await prisma.lesson.create({
          data: {
            title,
            slug,
            content,
            order: li + 1,
            duration: 5,
            moduleId: module.id,
          }
        });
        console.log(`  ✅ Created: ${title}`);
      }
    }

    // 4. Generate quiz
    console.log(`\n  🎯 Creating quiz: ${mod.quiz.title}`);
    
    const existingQuiz = await prisma.quiz.findFirst({ where: { moduleId: module.id } });
    if (existingQuiz) {
      await prisma.quiz.delete({ where: { id: existingQuiz.id } });
      console.log(`  🔄 Replaced existing quiz`);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: mod.quiz.title,
        description: mod.quiz.description,
        moduleId: module.id,
        questions: {
          create: mod.quiz.questions.map((q, idx) => ({
            text: q.text,
            order: idx + 1,
            options: {
              create: q.options.map(opt => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: { questions: true },
    });
    console.log(`  ✅ Quiz created: ${quiz.questions.length} questions (ID: ${quiz.id})`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Level 2: The Foundation — COMPLETE!");
  console.log(`   3 Modules, 11 Lessons, 3 Quizzes`);
  console.log(`${"=".repeat(60)}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
