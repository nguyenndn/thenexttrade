const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}

const ACADEMY_DATA = [
  {
    level: { order: 1, title: "First Steps", description: "Discover Forex — What forex is, who trades it, and how margin works." },
    modules: [
      {
        title: "Welcome to the Market", description: "What forex is, how it works, and who participates.", order: 1,
        lessons: [
          "Currency Pairs Explained — Base, Quote, and Why They Always Travel in Twos",
          "Who Trades Forex? — Banks, Funds, Brokers, and You",
          "Forex Market Sessions — When to Trade and When to Sleep",
          "Forex vs Stocks vs Crypto — Which Market is Right for You?",
        ],
      },
      {
        title: "Understanding Margin & Orders", description: "Margin mechanics, pips, lots, spreads, and order types.", order: 2,
        lessons: [
          "What is a Pip? And Why It's Worth More Than You Think",
          "Lots, Mini Lots, and Micro Lots — Size Matters",
          "Leverage — The Double-Edged Sword Nobody Warns You About",
          "Margin Explained — What It Really Costs to Open a Trade",
          "Spreads, Commissions, and Swaps — The Real Cost of Trading",
          "Order Types — Market, Limit, Stop, and When to Use Each",
        ],
      },
    ],
  },
  {
    level: { order: 2, title: "The Foundation", description: "Trading Foundations — Choosing a broker, types of analysis, and chart basics." },
    modules: [
      {
        title: "Choosing Your Broker", description: "How to pick the right broker and execution models.", order: 1,
        lessons: [
          "How to Choose a Forex Broker — The Only Checklist You Need",
          "ECN vs Market Maker vs STP — What Your Broker Doesn't Tell You",
          "Demo Account — Your Free Playground (And How to Use It Right)",
        ],
      },
      {
        title: "The Three Lenses of Analysis", description: "Technical, fundamental, and sentiment analysis overview.", order: 2,
        lessons: [
          "Technical Analysis — Reading the Chart Like a Pro",
          "Fundamental Analysis — Trading the News Behind the News",
          "Sentiment Analysis — Following the Crowd (or Fading It)",
          "Which Analysis Style Fits You? — Finding Your Edge",
        ],
      },
      {
        title: "Your First Charts", description: "Line, bar, and candlestick chart basics.", order: 3,
        lessons: [
          "Chart Types — Line, Bar, and Candle (And Why Candles Win)",
          "Timeframes Explained — M1 to Monthly and What Each One Shows",
          "Reading a Candlestick — Body, Wick, and What They're Telling You",
          "Your First Trade on a Demo — A Step-by-Step Walkthrough",
        ],
      },
    ],
  },
  {
    level: { order: 3, title: "Protect Your Money", description: "Risk Management — Position sizing, stop losses, risk-reward ratio." },
    modules: [
      {
        title: "Position Sizing & Stop Losses", description: "Position sizing, stop losses, risk-reward ratio, and scaling.", order: 1,
        lessons: [
          "Position Sizing — The Math That Saves Your Account",
          "Stop Loss — Your Trading Insurance Policy",
          "Take Profit — When to Close and Walk Away",
          "Trailing Stop — Locking In Profits While Letting Winners Run",
        ],
      },
      {
        title: "Risk-Reward Ratio & Trade Math", description: "Understanding the numbers behind every trade.", order: 2,
        lessons: [
          "Risk-Reward Ratio — The 1:2 Rule That Changes Everything",
          "Win Rate vs R:R — Why You Can Be Wrong 60% and Still Profit",
          "The Math Behind Drawdown — How Much Can You Lose Before It Hurts?",
        ],
      },
      {
        title: "Protecting Your Account", description: "Account protection strategies and money management.", order: 3,
        lessons: [
          "The 2% Rule — Never Risk More Than This on a Single Trade",
          "Correlation Risk — When Your Diversified Trades Are Actually the Same Bet",
          "Risk Management Checklist — 10 Rules to Tape to Your Monitor",
        ],
      },
    ],
  },
  {
    level: { order: 4, title: "Price Action", description: "Support & resistance, candlestick patterns, and reading raw price movement." },
    modules: [
      {
        title: "Price Boundaries — Support & Resistance", description: "Key price zones, trend lines, channels, and psychological levels.", order: 1,
        lessons: [
          "Support and Resistance — The Only 2 Lines You Actually Need",
          "How to Draw Support & Resistance (And Stop Guessing)",
          "Trend Lines and Channels — Riding the Wave",
          "Psychological Levels — Why Round Numbers Matter",
          "Support Becomes Resistance — The Polarity Principle",
        ],
      },
      {
        title: "Candlestick Language", description: "Candlestick anatomy, body sizes, and reversal/continuation patterns.", order: 2,
        lessons: [
          "Bullish Reversal Candles — Hammer, Engulfing, Morning Star",
          "Bearish Reversal Candles — Shooting Star, Evening Star, Dark Cloud",
          "Continuation Patterns — Doji, Spinning Top, and Indecision",
          "Applying S&R and Candlesticks Together — The Power Combo",
          "Price Action Trading — Reading the Market Without Indicators",
        ],
      },
    ],
  },
  {
    level: { order: 5, title: "Technical Tools", description: "Technical Indicators — Fibonacci, moving averages, and essential indicators." },
    modules: [
      {
        title: "Fibonacci — The Golden Ratio", description: "Retracements, extensions, and combining Fibo with other tools.", order: 1,
        lessons: [
          "Fibonacci Retracement — Finding Where Price Will Bounce",
          "Fibonacci Extension — Knowing Where to Take Profit",
          "Combining Fibonacci with Support & Resistance — Confluence Zones",
        ],
      },
      {
        title: "Moving Averages — Following the Flow", description: "SMA, EMA, crossovers, and using MAs as dynamic S&R.", order: 2,
        lessons: [
          "SMA vs EMA — Which Moving Average Should You Use?",
          "Moving Average Crossovers — Golden Cross and Death Cross",
          "Using Moving Averages as Dynamic Support & Resistance",
        ],
      },
      {
        title: "Essential Indicators Toolkit", description: "Bollinger Bands, MACD, RSI, Stochastic, Ichimoku, and more.", order: 3,
        lessons: [
          "Bollinger Bands — Measuring Volatility Like a Pro",
          "RSI — Overbought, Oversold, and the Signals In Between",
          "MACD — Momentum Made Visual",
          "Stochastic Oscillator — Fast vs Slow and When It Works Best",
          "Ichimoku Cloud — The All-In-One Indicator (Simplified)",
          "ADX, CCI, and Parabolic SAR — The Supporting Cast",
        ],
      },
    ],
  },
  {
    level: { order: 6, title: "Pattern Mastery", description: "Combining indicators, chart patterns, and pivot points." },
    modules: [
      {
        title: "Combining Your Indicators", description: "Building indicator stacks and leading vs lagging signals.", order: 1,
        lessons: [
          "Leading vs Lagging Indicators — Know the Difference",
          "Building an Indicator Stack — 3 Tools, 1 Signal",
          "Indicator Traps — Why RSI Divergence Alone Will Lose You Money",
        ],
      },
      {
        title: "Chart Patterns That Pay", description: "Head & shoulders, double tops/bottoms, triangles, flags, wedges.", order: 2,
        lessons: [
          "Head and Shoulders — The Pattern Everyone Knows But Few Trade Right",
          "Double Top and Double Bottom — Simple But Powerful",
          "Triangles — Ascending, Descending, and Symmetrical",
          "Flags, Pennants, and Wedges — Continuation Patterns That Work",
        ],
      },
      {
        title: "Pivot Points — Institutional Levels", description: "Calculating and trading with pivot point levels.", order: 3,
        lessons: [
          "Pivot Points — The Levels Banks Actually Watch",
          "Trading with Pivot Points — A Step-by-Step Strategy",
        ],
      },
    ],
  },
  {
    level: { order: 7, title: "Trader Mindset", description: "Trading Psychology — Emotions, discipline, common mistakes." },
    modules: [
      {
        title: "Mastering Your Inner Game", description: "Fear, greed, discipline, and traits of successful traders.", order: 1,
        lessons: [
          "Trading Psychology 101 — Your Brain is Your Biggest Enemy",
          "Fear and Greed — The Two Emotions That Destroy Accounts",
          "Discipline — How to Follow Your Plan When Everything Screams Don't",
          "The Traits of Consistently Profitable Traders",
        ],
      },
      {
        title: "Overcoming FOMO, Revenge Trading & Overtrading", description: "Common psychological traps and how to break free.", order: 2,
        lessons: [
          "FOMO — Why I Missed It Leads to Blowing Your Account",
          "Revenge Trading — You Lost, Now You Want It Back (Don't)",
          "Overtrading — When More Trades = Less Profit",
          "Building a Trading Routine — Your Daily Checklist",
        ],
      },
    ],
  },
  {
    level: { order: 8, title: "Strategy Lab", description: "Advanced Strategies — Divergences, breakouts, multi-timeframe, Elliott Wave, scalping." },
    modules: [
      {
        title: "Divergence Trading", description: "Regular and hidden divergences for entries and exits.", order: 1,
        lessons: [
          "Regular Divergence — When Price and Indicators Disagree",
          "Hidden Divergence — The Continuation Signal Most Traders Miss",
          "Trading Divergence — Entry, Stop Loss, and Target Rules",
        ],
      },
      {
        title: "Reading Market Conditions", description: "Trending vs ranging, breakouts, fakeouts, and reversals.", order: 2,
        lessons: [
          "Trending vs Ranging — How to Tell Which Market You're In",
          "Breakout Trading — Catching the Move When Price Escapes",
          "Fakeouts — How to Avoid the Most Expensive Trap in Trading",
          "Volatility — Reading the Market's Heartbeat",
        ],
      },
      {
        title: "The Multi-Timeframe Edge", description: "Top-down analysis and best timeframe combinations.", order: 3,
        lessons: [
          "Multi-Timeframe Analysis — The Top-Down Approach",
          "Best Timeframe Combos for Scalping, Day Trading, and Swing",
          "Putting It All Together — A Complete Trade Setup Using MTF",
        ],
      },
      {
        title: "Elliott Wave Basics", description: "Wave theory, impulse vs corrective, and practical wave counting.", order: 4,
        lessons: [
          "Elliott Wave Theory — The 5-3 Pattern That Drives All Markets",
          "Impulse vs Corrective Waves — Understanding Market Structure",
          "How to Count Waves — A Practical (Not Theoretical) Approach",
        ],
      },
      {
        title: "Scalping Strategies", description: "Fast-paced trading on 1-5 minute charts.", order: 5,
        lessons: [
          "What is Scalping? — Making Money in Minutes",
          "Scalping Indicators — Best Tools for 1-5 Minute Charts",
          "Scalping Risk Management — Speed Kills If You're Not Careful",
        ],
      },
    ],
  },
  {
    level: { order: 9, title: "Market Forces", description: "Fundamental Analysis — Economic indicators, news trading, sentiment." },
    modules: [
      {
        title: "What Drives Currencies?", description: "Interest rates, GDP, employment, inflation, and monetary policy.", order: 1,
        lessons: [
          "Interest Rates — The #1 Force Moving Currencies",
          "GDP, Employment, and Inflation — The Big Three Economic Indicators",
          "Central Banks Explained — Fed, ECB, BOE, BOJ, and What They Control",
          "The Economic Calendar — Your Weekly Cheat Sheet",
        ],
      },
      {
        title: "Trading Around News Events", description: "Directional and non-directional news trading strategies.", order: 2,
        lessons: [
          "News Trading 101 — How NFP, CPI, and FOMC Move the Market",
          "Directional Trade — Betting on the Outcome",
          "Non-Directional Trade — Profiting from Volatility, Not Direction",
          "The Wait and React Strategy — Trading AFTER the News",
        ],
      },
      {
        title: "Measuring the Crowd", description: "Market sentiment, COT report, and crowd positioning.", order: 3,
        lessons: [
          "Market Sentiment — Are Traders Bullish or Bearish?",
          "The COT Report — Reading What Big Money is Doing",
          "Contrarian Trading — When to Fade the Crowd",
        ],
      },
    ],
  },
  {
    level: { order: 10, title: "The Playbook", description: "Your Trading Plan — Building a trading system, keeping a journal." },
    modules: [
      {
        title: "Designing Your Edge", description: "Building and backtesting your own trading system.", order: 1,
        lessons: [
          "What is a Trading System? — Rules, Not Feelings",
          "Building Your Trading System — Step by Step",
          "Backtesting — Does Your Strategy Actually Work?",
          "Forward Testing — From Backtest to Live (Without Blowing Up)",
        ],
      },
      {
        title: "Your Trading Journal", description: "Tracking trades, reviewing performance, and learning from data.", order: 2,
        lessons: [
          "Why You NEED a Trading Journal — The Data Doesn't Lie",
          "How to Review Your Trades — Weekly, Monthly, Quarterly",
          "Your Complete Trading Plan Template — Download and Customize",
        ],
      },
    ],
  },
  {
    level: { order: 11, title: "Global View", description: "Intermarket Analysis — How global markets affect forex." },
    modules: [
      {
        title: "Cross-Market Connections", description: "Gold, oil, bonds, stocks and their impact on forex.", order: 1,
        lessons: [
          "How Gold Affects Currencies — The XAU/USD Connection",
          "Oil and Forex — How Crude Moves CAD, NOK, and USD",
          "Bonds and Interest Rates — The Hidden Chain",
          "Stock Markets and Forex — Risk On, Risk Off",
        ],
      },
      {
        title: "Beyond Major Pairs — Currency Crosses", description: "EUR, JPY, and GBP cross pair opportunities.", order: 2,
        lessons: [
          "EUR Crosses — EUR/GBP, EUR/JPY, EUR/AUD",
          "JPY Crosses — Carry Trade and Safe Haven Dynamics",
          "Exotic Pairs — High Reward, High Risk, Higher Spreads",
        ],
      },
      {
        title: "Gold Trading Masterclass", description: "XAU/USD as a trading instrument — what drives gold and how to trade it.", order: 3,
        lessons: [
          "Why Trade Gold? — XAU/USD as the Ultimate Safe Haven",
          "What Moves Gold Prices — DXY, Real Yields, and Geopolitics",
          "Gold Trading Strategies — Breakout, Range, and News-Driven",
        ],
      },
    ],
  },
  {
    level: { order: 12, title: "Ready to Trade", description: "Ready for Live — Prop trading, scams, your trading career." },
    modules: [
      {
        title: "Your Pre-Launch Checklist", description: "Avoiding scams, common mistakes, prop firms, and going live.", order: 1,
        lessons: [
          "Forex Scams — How to Spot Them Before They Spot You",
          "The 10 Most Common Beginner Mistakes (And How to Avoid All of Them)",
          "Prop Trading — What It Is, How to Get Funded, and Is It Worth It?",
          "Going Live — Your First Real Money Checklist",
          "Building a Career in Trading — The Long View",
        ],
      },
      {
        title: "Advanced Career Topics", description: "Automation, portfolio management, and continuous growth.", order: 2,
        lessons: [
          "Trading Multiple Accounts — Strategies for Portfolio Growth",
          "Automated Trading — EA, Bots, and When They Make Sense",
          "Building Your Trading Community — Mentorship and Accountability",
          "The Road Ahead — Continuous Learning and Adaptation",
        ],
      },
    ],
  },
];

async function main() {
  console.log("🚀 Starting Academy Seed...\n");

  let totalLessons = 0;
  let totalModules = 0;
  let skippedLessons = 0;

  for (const data of ACADEMY_DATA) {
    // 1. Upsert Level
    const level = await prisma.level.upsert({
      where: { order: data.level.order },
      update: { title: data.level.title, description: data.level.description },
      create: { ...data.level },
    });
    console.log(`✅ Level ${data.level.order}: ${data.level.title} (${level.id})`);

    for (const mod of data.modules) {
      // 2. Find or create Module
      let module = await prisma.module.findFirst({
        where: { levelId: level.id, order: mod.order },
      });

      if (module) {
        module = await prisma.module.update({
          where: { id: module.id },
          data: { title: mod.title, description: mod.description },
        });
      } else {
        module = await prisma.module.create({
          data: {
            title: mod.title,
            description: mod.description,
            order: mod.order,
            levelId: level.id,
          },
        });
      }
      totalModules++;
      console.log(`  📦 Module ${mod.order}: ${mod.title}`);

      // 3. Seed Lessons
      for (let i = 0; i < mod.lessons.length; i++) {
        const title = mod.lessons[i];
        const slug = slugify(title);
        const order = i + 1;

        // Check if lesson already exists (by slug)
        const existing = await prisma.lesson.findUnique({ where: { slug } });
        if (existing) {
          skippedLessons++;
          console.log(`    ⏭️  [EXISTS] ${title}`);
          continue;
        }

        await prisma.lesson.create({
          data: {
            title,
            slug,
            content: "",
            status: "draft",
            order,
            moduleId: module.id,
          },
        });
        totalLessons++;
        console.log(`    ✅ [NEW] ${title}`);
      }
    }
    console.log("");
  }

  console.log("=" .repeat(60));
  console.log(`✅ Seed complete!`);
  console.log(`   Levels: 12`);
  console.log(`   Modules: ${totalModules}`);
  console.log(`   Lessons created: ${totalLessons}`);
  console.log(`   Lessons skipped (existing): ${skippedLessons}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
