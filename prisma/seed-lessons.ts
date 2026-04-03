/**
 * Seed script: Insert all Academy lessons from the Master Outline
 * Run: npx tsx prisma/seed-lessons.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/['']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// Module IDs from the database
const MODULES = {
    // Level 01: First Steps
    "1.1": "cmmvrl99s0001wqshcftfy8zn", // Welcome to the Market
    "1.2": "cmmvrl99v0003wqsht7xten5s", // Understanding Margin & Orders

    // Level 02: The Foundation
    "2.1": "cmmvrl99x0005wqshwcou3eun", // Choosing Your Broker
    "2.2": "cmmvrl99z0007wqshmnv1jzd7", // The Three Lenses of Analysis
    "2.3": "cmmvrl9a00009wqshd7iebupz", // Your First Charts

    // Level 03: Protect Your Money
    "3.1": "cmmvrl9ap001bwqshg2qa1m6m", // Position Sizing & Stop Losses
    "3.2": "cmnhd28tu0003w66teq8bgz51", // Risk-Reward Ratio & Trade Math
    "3.3": "cmnhd28tv0005w66tscnhqt18", // Protecting Your Account

    // Level 04: Price Action
    "4.1": "cmmvrl9a2000bwqshv5ubwywq", // Price Boundaries — S&R
    "4.2": "cmmvrl9a4000dwqsh87502i3n", // Candlestick Language

    // Level 05: Technical Tools
    "5.1": "cmmvrl9a5000fwqshy4tsjf4q", // Fibonacci
    "5.2": "cmmvrl9a6000hwqsh41rj6wbt", // Moving Averages
    "5.3": "cmmvrl9a7000jwqshb543rblw", // Essential Indicators Toolkit

    // Level 06: Pattern Mastery
    "6.1": "cmmvrl9a9000lwqshv8kwg6g0", // Combining Indicators
    "6.2": "cmmvrl9aa000nwqshabap1rru", // Chart Patterns That Pay
    "6.3": "cmmvrl9ab000pwqshma4lhuyq", // Pivot Points

    // Level 07: Trader Mindset
    "7.1": "cmmvrl9ar001dwqshm3uqpabf", // Mastering Your Inner Game
    "7.2": "cmnhd28u10007w66t44vye66y", // Overcoming FOMO...

    // Level 08: Strategy Lab
    "8.1": "cmmvrl9ac000rwqshhstwaoon", // Divergence Trading
    "8.2": "cmmvrl9ae000twqsh4ziiqqz1", // Reading Market Conditions
    "8.3": "cmmvrl9af000vwqsh3lnl3oxd", // Multi-Timeframe Edge

    // Level 09: Market Forces
    "9.1": "cmmvrl9ag000xwqshzy7svrrn", // What Drives Currencies?
    "9.2": "cmmvrl9ai000zwqshw8hn1l0t", // Trading Around News
    "9.3": "cmmvrl9aj0011wqshibc724np", // Measuring the Crowd

    // Level 10: The Playbook
    "10.1": "cmmvrl9an0017wqshmxr8gfz4", // Designing Your Edge
    "10.2": "cmmvrl9ao0019wqshytts36rv", // Your Trading Journal

    // Level 11: Global View
    "11.1": "cmmvrl9ak0013wqshe8n5zsgc", // Cross-Market Connections
    "11.2": "cmmvrl9al0015wqshtnkevnqj", // Beyond Major Pairs

    // Level 12: Ready to Trade
    "12.1": "cmmvrl9as001fwqshh1zar7jd", // Your Pre-Launch Checklist
};

interface LessonSeed {
    title: string;
    moduleKey: keyof typeof MODULES;
    order: number;
    duration: number;
}

const LESSONS: LessonSeed[] = [
    // =====================================================================
    // Level 01: First Steps
    // =====================================================================

    // Module 1.1: Welcome to the Market (skip order 1 — already exists)
    { title: "Currency Pairs Explained — Base, Quote, and Why They Always Travel in Twos", moduleKey: "1.1", order: 2, duration: 5 },
    { title: "Who Trades Forex? — Banks, Funds, Brokers, and You", moduleKey: "1.1", order: 3, duration: 4 },
    { title: "Forex Market Sessions — When to Trade and When to Sleep", moduleKey: "1.1", order: 4, duration: 5 },
    { title: "Forex vs Stocks vs Crypto — Which Market is Right for You?", moduleKey: "1.1", order: 5, duration: 4 },

    // Module 1.2: Understanding Margin & Orders
    { title: "What is a Pip? And Why It's Worth More Than You Think", moduleKey: "1.2", order: 1, duration: 5 },
    { title: "Lots, Mini Lots, and Micro Lots — Size Matters", moduleKey: "1.2", order: 2, duration: 5 },
    { title: "Leverage — The Double-Edged Sword Nobody Warns You About", moduleKey: "1.2", order: 3, duration: 6 },
    { title: "Margin Explained — What It Really Costs to Open a Trade", moduleKey: "1.2", order: 4, duration: 5 },
    { title: "Spreads, Commissions, and Swaps — The Real Cost of Trading", moduleKey: "1.2", order: 5, duration: 4 },
    { title: "Order Types — Market, Limit, Stop, and When to Use Each", moduleKey: "1.2", order: 6, duration: 6 },

    // =====================================================================
    // Level 02: The Foundation
    // =====================================================================

    // Module 2.1: Choosing Your Broker
    { title: "How to Choose a Forex Broker — The Only Checklist You Need", moduleKey: "2.1", order: 1, duration: 5 },
    { title: "ECN vs Market Maker vs STP — What Your Broker Doesn't Tell You", moduleKey: "2.1", order: 2, duration: 5 },
    { title: "Demo Account — Your Free Playground (And How to Use It Right)", moduleKey: "2.1", order: 3, duration: 4 },

    // Module 2.2: The Three Lenses of Analysis
    { title: "Technical Analysis — Reading the Chart Like a Pro", moduleKey: "2.2", order: 1, duration: 5 },
    { title: "Fundamental Analysis — Trading the News Behind the News", moduleKey: "2.2", order: 2, duration: 5 },
    { title: "Sentiment Analysis — Following the Crowd (or Fading It)", moduleKey: "2.2", order: 3, duration: 4 },
    { title: "Which Analysis Style Fits You? — Finding Your Edge", moduleKey: "2.2", order: 4, duration: 4 },

    // Module 2.3: Your First Charts
    { title: "Chart Types — Line, Bar, and Candle (And Why Candles Win)", moduleKey: "2.3", order: 1, duration: 5 },
    { title: "Timeframes Explained — M1 to Monthly and What Each One Shows", moduleKey: "2.3", order: 2, duration: 5 },
    { title: "Reading a Candlestick — Body, Wick, and What They're Telling You", moduleKey: "2.3", order: 3, duration: 5 },
    { title: "Your First Trade on a Demo — A Step-by-Step Walkthrough", moduleKey: "2.3", order: 4, duration: 6 },

    // =====================================================================
    // Level 03: Protect Your Money
    // =====================================================================

    // Module 3.1: Position Sizing & Stop Losses
    { title: "Position Sizing — The Math That Saves Your Account", moduleKey: "3.1", order: 1, duration: 6 },
    { title: "Stop Loss — Your Trading Insurance Policy", moduleKey: "3.1", order: 2, duration: 5 },
    { title: "Take Profit — When to Close and Walk Away", moduleKey: "3.1", order: 3, duration: 5 },
    { title: "Trailing Stop — Locking In Profits While Letting Winners Run", moduleKey: "3.1", order: 4, duration: 4 },

    // Module 3.2: Risk-Reward Ratio & Trade Math
    { title: "Risk-Reward Ratio — The 1:2 Rule That Changes Everything", moduleKey: "3.2", order: 1, duration: 5 },
    { title: "Win Rate vs R:R — Why You Can Be Wrong 60% and Still Profit", moduleKey: "3.2", order: 2, duration: 5 },
    { title: "The Math Behind Drawdown — How Much Can You Lose Before It Hurts?", moduleKey: "3.2", order: 3, duration: 5 },

    // Module 3.3: Protecting Your Account — The 2% Rule
    { title: "The 2% Rule — Never Risk More Than This on a Single Trade", moduleKey: "3.3", order: 1, duration: 5 },
    { title: "Correlation Risk — When Your Diversified Trades Are Actually the Same Bet", moduleKey: "3.3", order: 2, duration: 5 },
    { title: "Risk Management Checklist — 10 Rules to Tape to Your Monitor", moduleKey: "3.3", order: 3, duration: 4 },

    // =====================================================================
    // Level 04: Price Action
    // =====================================================================

    // Module 4.1: Price Boundaries — Support & Resistance
    { title: "Support and Resistance — The Only 2 Lines You Actually Need", moduleKey: "4.1", order: 1, duration: 6 },
    { title: "How to Draw Support and Resistance (And Stop Guessing)", moduleKey: "4.1", order: 2, duration: 5 },
    { title: "Trend Lines and Channels — Riding the Wave", moduleKey: "4.1", order: 3, duration: 5 },
    { title: "Psychological Levels — Why Round Numbers Matter", moduleKey: "4.1", order: 4, duration: 4 },
    { title: "Support Becomes Resistance — The Polarity Principle", moduleKey: "4.1", order: 5, duration: 5 },

    // Module 4.2: Candlestick Language
    { title: "Bullish Reversal Candles — Hammer, Engulfing, Morning Star", moduleKey: "4.2", order: 1, duration: 6 },
    { title: "Bearish Reversal Candles — Shooting Star, Evening Star, Dark Cloud", moduleKey: "4.2", order: 2, duration: 6 },
    { title: "Continuation Patterns — Doji, Spinning Top, and Indecision", moduleKey: "4.2", order: 3, duration: 5 },
    { title: "Applying S&R and Candlesticks Together — The Power Combo", moduleKey: "4.2", order: 4, duration: 6 },
    { title: "Price Action Trading — Reading the Market Without Indicators", moduleKey: "4.2", order: 5, duration: 6 },

    // =====================================================================
    // Level 05: Technical Tools
    // =====================================================================

    // Module 5.1: Fibonacci — The Golden Ratio
    { title: "Fibonacci Retracement — Finding Where Price Will Bounce", moduleKey: "5.1", order: 1, duration: 6 },
    { title: "Fibonacci Extension — Knowing Where to Take Profit", moduleKey: "5.1", order: 2, duration: 5 },
    { title: "Combining Fibonacci with Support and Resistance — Confluence Zones", moduleKey: "5.1", order: 3, duration: 6 },

    // Module 5.2: Moving Averages — Following the Flow
    { title: "SMA vs EMA — Which Moving Average Should You Use?", moduleKey: "5.2", order: 1, duration: 5 },
    { title: "Moving Average Crossovers — Golden Cross and Death Cross", moduleKey: "5.2", order: 2, duration: 5 },
    { title: "Using Moving Averages as Dynamic Support and Resistance", moduleKey: "5.2", order: 3, duration: 5 },

    // Module 5.3: Essential Indicators Toolkit
    { title: "Bollinger Bands — Measuring Volatility Like a Pro", moduleKey: "5.3", order: 1, duration: 6 },
    { title: "RSI — Overbought, Oversold, and the Signals In Between", moduleKey: "5.3", order: 2, duration: 5 },
    { title: "MACD — Momentum Made Visual", moduleKey: "5.3", order: 3, duration: 5 },
    { title: "Stochastic Oscillator — Fast vs Slow and When It Works Best", moduleKey: "5.3", order: 4, duration: 5 },
    { title: "Ichimoku Cloud — The All-In-One Indicator Simplified", moduleKey: "5.3", order: 5, duration: 6 },
    { title: "ADX, CCI, and Parabolic SAR — The Supporting Cast", moduleKey: "5.3", order: 6, duration: 5 },

    // =====================================================================
    // Level 06: Pattern Mastery
    // =====================================================================

    // Module 6.1: Combining Your Indicators
    { title: "Leading vs Lagging Indicators — Know the Difference", moduleKey: "6.1", order: 1, duration: 5 },
    { title: "Building an Indicator Stack — 3 Tools, 1 Signal", moduleKey: "6.1", order: 2, duration: 6 },
    { title: "Indicator Traps — Why RSI Divergence Alone Will Lose You Money", moduleKey: "6.1", order: 3, duration: 5 },

    // Module 6.2: Chart Patterns That Pay
    { title: "Head and Shoulders — The Pattern Everyone Knows But Few Trade Right", moduleKey: "6.2", order: 1, duration: 6 },
    { title: "Double Top and Double Bottom — Simple But Powerful", moduleKey: "6.2", order: 2, duration: 5 },
    { title: "Triangles — Ascending, Descending, and Symmetrical", moduleKey: "6.2", order: 3, duration: 6 },
    { title: "Flags, Pennants, and Wedges — Continuation Patterns That Work", moduleKey: "6.2", order: 4, duration: 5 },

    // Module 6.3: Pivot Points — Institutional Levels
    { title: "Pivot Points — The Levels Banks Actually Watch", moduleKey: "6.3", order: 1, duration: 5 },
    { title: "Trading with Pivot Points — A Step-by-Step Strategy", moduleKey: "6.3", order: 2, duration: 5 },

    // =====================================================================
    // Level 07: Trader Mindset
    // =====================================================================

    // Module 7.1: Mastering Your Inner Game
    { title: "Trading Psychology 101 — Your Brain is Your Biggest Enemy", moduleKey: "7.1", order: 1, duration: 6 },
    { title: "Fear and Greed — The Two Emotions That Destroy Accounts", moduleKey: "7.1", order: 2, duration: 5 },
    { title: "Discipline — How to Follow Your Plan When Everything Screams Don't", moduleKey: "7.1", order: 3, duration: 5 },
    { title: "The Traits of Consistently Profitable Traders", moduleKey: "7.1", order: 4, duration: 5 },

    // Module 7.2: Overcoming FOMO, Revenge Trading & Overtrading
    { title: "FOMO — Why I Missed It Leads to Blowing Your Account", moduleKey: "7.2", order: 1, duration: 5 },
    { title: "Revenge Trading — You Lost, Now You Want It Back (Don't)", moduleKey: "7.2", order: 2, duration: 5 },
    { title: "Overtrading — When More Trades Equals Less Profit", moduleKey: "7.2", order: 3, duration: 5 },
    { title: "Building a Trading Routine — Your Daily Checklist", moduleKey: "7.2", order: 4, duration: 5 },

    // =====================================================================
    // Level 08: Strategy Lab
    // =====================================================================

    // Module 8.1: Divergence Trading
    { title: "Regular Divergence — When Price and Indicators Disagree", moduleKey: "8.1", order: 1, duration: 6 },
    { title: "Hidden Divergence — The Continuation Signal Most Traders Miss", moduleKey: "8.1", order: 2, duration: 5 },
    { title: "Trading Divergence — Entry, Stop Loss, and Target Rules", moduleKey: "8.1", order: 3, duration: 5 },

    // Module 8.2: Reading Market Conditions
    { title: "Trending vs Ranging — How to Tell Which Market You're In", moduleKey: "8.2", order: 1, duration: 5 },
    { title: "Breakout Trading — Catching the Move When Price Escapes", moduleKey: "8.2", order: 2, duration: 6 },
    { title: "Fakeouts — How to Avoid the Most Expensive Trap in Trading", moduleKey: "8.2", order: 3, duration: 5 },
    { title: "Volatility — Reading the Market's Heartbeat", moduleKey: "8.2", order: 4, duration: 5 },

    // Module 8.3: The Multi-Timeframe Edge
    { title: "Multi-Timeframe Analysis — The Top-Down Approach", moduleKey: "8.3", order: 1, duration: 6 },
    { title: "Best Timeframe Combos for Scalping, Day Trading, and Swing", moduleKey: "8.3", order: 2, duration: 5 },
    { title: "Putting It All Together — A Complete Trade Setup Using MTF", moduleKey: "8.3", order: 3, duration: 6 },

    // =====================================================================
    // Level 09: Market Forces
    // =====================================================================

    // Module 9.1: What Drives Currencies?
    { title: "Interest Rates — The Number One Force Moving Currencies", moduleKey: "9.1", order: 1, duration: 6 },
    { title: "GDP, Employment, and Inflation — The Big Three Economic Indicators", moduleKey: "9.1", order: 2, duration: 6 },
    { title: "Central Banks Explained — Fed, ECB, BOE, BOJ, and What They Control", moduleKey: "9.1", order: 3, duration: 5 },
    { title: "The Economic Calendar — Your Weekly Cheat Sheet", moduleKey: "9.1", order: 4, duration: 5 },

    // Module 9.2: Trading Around News Events
    { title: "News Trading 101 — How NFP, CPI, and FOMC Move the Market", moduleKey: "9.2", order: 1, duration: 6 },
    { title: "Directional Trade — Betting on the Outcome", moduleKey: "9.2", order: 2, duration: 5 },
    { title: "Non-Directional Trade — Profiting from Volatility, Not Direction", moduleKey: "9.2", order: 3, duration: 5 },
    { title: "The Wait and React Strategy — Trading After the News", moduleKey: "9.2", order: 4, duration: 5 },

    // Module 9.3: Measuring the Crowd
    { title: "Market Sentiment — Are Traders Bullish or Bearish?", moduleKey: "9.3", order: 1, duration: 5 },
    { title: "The COT Report — Reading What Big Money is Doing", moduleKey: "9.3", order: 2, duration: 6 },
    { title: "Contrarian Trading — When to Fade the Crowd", moduleKey: "9.3", order: 3, duration: 5 },

    // =====================================================================
    // Level 10: The Playbook
    // =====================================================================

    // Module 10.1: Designing Your Edge
    { title: "What is a Trading System? — Rules, Not Feelings", moduleKey: "10.1", order: 1, duration: 5 },
    { title: "Building Your Trading System — Step by Step", moduleKey: "10.1", order: 2, duration: 6 },
    { title: "Backtesting — Does Your Strategy Actually Work?", moduleKey: "10.1", order: 3, duration: 6 },
    { title: "Forward Testing — From Backtest to Live Without Blowing Up", moduleKey: "10.1", order: 4, duration: 5 },

    // Module 10.2: Your Trading Journal
    { title: "Why You Need a Trading Journal — The Data Doesn't Lie", moduleKey: "10.2", order: 1, duration: 5 },
    { title: "How to Review Your Trades — Weekly, Monthly, Quarterly", moduleKey: "10.2", order: 2, duration: 5 },
    { title: "Your Complete Trading Plan Template — Download and Customize", moduleKey: "10.2", order: 3, duration: 6 },

    // =====================================================================
    // Level 11: Global View
    // =====================================================================

    // Module 11.1: Cross-Market Connections
    { title: "How Gold Affects Currencies — The XAU/USD Connection", moduleKey: "11.1", order: 1, duration: 6 },
    { title: "Oil and Forex — How Crude Moves CAD, NOK, and USD", moduleKey: "11.1", order: 2, duration: 5 },
    { title: "Bonds and Interest Rates — The Hidden Chain", moduleKey: "11.1", order: 3, duration: 6 },
    { title: "Stock Markets and Forex — Risk On, Risk Off", moduleKey: "11.1", order: 4, duration: 5 },

    // Module 11.2: Beyond Major Pairs — Currency Crosses
    { title: "EUR Crosses — EUR/GBP, EUR/JPY, EUR/AUD", moduleKey: "11.2", order: 1, duration: 5 },
    { title: "JPY Crosses — Carry Trade and Safe Haven Dynamics", moduleKey: "11.2", order: 2, duration: 5 },
    { title: "Exotic Pairs — High Reward, High Risk, Higher Spreads", moduleKey: "11.2", order: 3, duration: 5 },

    // =====================================================================
    // Level 12: Ready to Trade
    // =====================================================================

    // Module 12.1: Your Pre-Launch Checklist
    { title: "Forex Scams — How to Spot Them Before They Spot You", moduleKey: "12.1", order: 1, duration: 5 },
    { title: "The 10 Most Common Beginner Mistakes and How to Avoid All of Them", moduleKey: "12.1", order: 2, duration: 6 },
    { title: "Prop Trading — What It Is, How to Get Funded, and Is It Worth It?", moduleKey: "12.1", order: 3, duration: 6 },
    { title: "Going Live — Your First Real Money Checklist", moduleKey: "12.1", order: 4, duration: 5 },
    { title: "Building a Career in Trading — The Long View", moduleKey: "12.1", order: 5, duration: 5 },
];

async function main() {
    console.log("🚀 Starting lesson seed...\n");

    // Check existing lessons to avoid duplicates
    const existing = await prisma.lesson.findMany({
        select: { title: true, slug: true },
    });
    const existingSlugs = new Set(existing.map((l) => l.slug));
    const existingTitles = new Set(existing.map((l) => l.title));

    let created = 0;
    let skipped = 0;

    for (const lesson of LESSONS) {
        const slug = slugify(lesson.title);

        if (existingSlugs.has(slug) || existingTitles.has(lesson.title)) {
            console.log(`  ⏭️  Skip: "${lesson.title}" (already exists)`);
            skipped++;
            continue;
        }

        const moduleId = MODULES[lesson.moduleKey];
        if (!moduleId) {
            console.error(`  ❌ Module not found: ${lesson.moduleKey}`);
            continue;
        }

        try {
            await prisma.lesson.create({
                data: {
                    title: lesson.title,
                    slug,
                    content: "",
                    moduleId,
                    order: lesson.order,
                    duration: lesson.duration,
                    status: "draft",
                },
            });
            created++;
            console.log(`  ✅ Created: "${lesson.title}"`);
        } catch (err: any) {
            if (err.code === "P2002") {
                console.log(`  ⏭️  Skip (unique constraint): "${lesson.title}"`);
                skipped++;
            } else {
                console.error(`  ❌ Error creating "${lesson.title}":`, err.message);
            }
        }
    }

    console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}, Total in outline: ${LESSONS.length}`);

    // Summary by level
    const summary = await prisma.lesson.count();
    console.log(`📊 Total lessons in DB: ${summary}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
