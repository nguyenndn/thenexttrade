/**
 * Seed Level 3 Modules 2 & 3
 * M2: Risk-Reward Ratio & Trade Math (3 lessons, 10 quiz questions)
 * M3: Protecting Your Account (3 lessons, 10 quiz questions)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");
const prisma = new PrismaClient();

const LEVEL_TITLE = "Protect Your Money";

const MODULES = [
  {
    title: "Risk-Reward Ratio & Trade Math",
    description: "Risk-reward ratios, win rate vs R:R, expectancy, and drawdown math.",
    order: 2,
    folder: "module-02-risk-reward-ratio-trade-math",
    lessons: [
      { slug: "risk-reward-ratio-the-1-2-rule-that-changes-everything", title: "Risk-Reward Ratio — The 1:2 Rule That Changes Everything" },
      { slug: "win-rate-vs-r-r-why-you-can-be-wrong-60-and-still-profit", title: "Win Rate vs R:R — Why You Can Be Wrong 60% and Still Profit" },
      { slug: "the-math-behind-drawdown-how-much-can-you-lose-before-it-hurts", title: "The Math Behind Drawdown — How Much Can You Lose Before It Hurts?" },
    ],
    quiz: {
      title: "Risk-Reward Ratio & Trade Math Quiz",
      description: "Test your understanding of R:R ratios, win rate, expectancy, and drawdown recovery. 10 questions, 75% to pass.",
      questions: [
        { text: "What does a 1:2 risk-reward ratio mean?", options: [
          { text: "You risk $2 to make $1", isCorrect: false },
          { text: "You risk $1 to potentially make $2", isCorrect: true },
          { text: "Your win rate is 50%", isCorrect: false },
          { text: "You need 2 winning trades for every loss", isCorrect: false },
        ]},
        { text: "With a 1:2 R:R ratio, what is the minimum win rate needed to break even?", options: [
          { text: "50%", isCorrect: false },
          { text: "25%", isCorrect: false },
          { text: "33%", isCorrect: true },
          { text: "67%", isCorrect: false },
        ]},
        { text: "Why should you avoid trades with less than 1:2 R:R?", options: [
          { text: "Because they're illegal", isCorrect: false },
          { text: "Because you need a very high win rate to be profitable, which is unsustainable", isCorrect: true },
          { text: "Because stop losses don't work below 1:2", isCorrect: false },
          { text: "Because brokers won't let you place them", isCorrect: false },
        ]},
        { text: "Which scenario is MORE profitable over 10 trades?", options: [
          { text: "70% win rate with 1:0.5 R:R", isCorrect: false },
          { text: "40% win rate with 1:3 R:R", isCorrect: true },
          { text: "They're exactly equal", isCorrect: false },
          { text: "Neither is profitable", isCorrect: false },
        ]},
        { text: "What is 'trading expectancy'?", options: [
          { text: "How much you expect to win on your next trade", isCorrect: false },
          { text: "The average profit per trade over many trades, based on win rate and R:R", isCorrect: true },
          { text: "Your win rate percentage", isCorrect: false },
          { text: "How many trades you expect to take this month", isCorrect: false },
        ]},
        { text: "What does the expectancy formula calculate?", options: [
          { text: "Position size for each trade", isCorrect: false },
          { text: "Average expected profit or loss per trade over time", isCorrect: true },
          { text: "The best currency pair to trade", isCorrect: false },
          { text: "Maximum drawdown percentage", isCorrect: false },
        ]},
        { text: "What is drawdown in trading?", options: [
          { text: "The total amount you've lost in your career", isCorrect: false },
          { text: "The decline from your account's peak to its lowest point before recovery", isCorrect: true },
          { text: "The difference between your entry and stop loss", isCorrect: false },
          { text: "The fee charged by your broker", isCorrect: false },
        ]},
        { text: "If your account drops 50%, how much return do you need to recover?", options: [
          { text: "50%", isCorrect: false },
          { text: "75%", isCorrect: false },
          { text: "100%", isCorrect: true },
          { text: "150%", isCorrect: false },
        ]},
        { text: "What drawdown level is considered 'Danger Zone'?", options: [
          { text: "0-10%", isCorrect: false },
          { text: "10-15%", isCorrect: false },
          { text: "20-30%", isCorrect: true },
          { text: "5-8%", isCorrect: false },
        ]},
        { text: "What is the most important metric in trading — above win rate or R:R alone?", options: [
          { text: "Win rate", isCorrect: false },
          { text: "R:R ratio", isCorrect: false },
          { text: "Expectancy (win rate × R:R combined)", isCorrect: true },
          { text: "Number of trades per day", isCorrect: false },
        ]},
      ]
    }
  },
  {
    title: "Protecting Your Account",
    description: "The 2% rule, correlation risk, and the complete risk management checklist.",
    order: 3,
    folder: "module-03-protecting-your-account",
    lessons: [
      { slug: "the-2-rule-never-risk-more-than-this-on-a-single-trade", title: "The 2% Rule — Never Risk More Than This on a Single Trade" },
      { slug: "correlation-risk-when-your-diversified-trades-are-actually-the-same-bet", title: "Correlation Risk — When Your Diversified Trades Are Actually the Same Bet" },
      { slug: "risk-management-checklist-10-rules-to-tape-to-your-monitor", title: "Risk Management Checklist — 10 Rules to Tape to Your Monitor" },
    ],
    quiz: {
      title: "Protecting Your Account Quiz",
      description: "Test your understanding of the 2% rule, correlation risk, and the complete risk management checklist. 10 questions, 75% to pass.",
      questions: [
        { text: "What is the 2% rule in trading?", options: [
          { text: "You should win 2% of your trades", isCorrect: false },
          { text: "Never risk more than 2% of your account on a single trade", isCorrect: true },
          { text: "Withdraw 2% of profits monthly", isCorrect: false },
          { text: "Trade only 2% of the time", isCorrect: false },
        ]},
        { text: "On a $1,000 account, what is the maximum dollar risk per trade at 2%?", options: [
          { text: "$10", isCorrect: false },
          { text: "$20", isCorrect: true },
          { text: "$50", isCorrect: false },
          { text: "$200", isCorrect: false },
        ]},
        { text: "What is correlation in forex?", options: [
          { text: "The spread between two currency pairs", isCorrect: false },
          { text: "How two currency pairs move in relation to each other", isCorrect: true },
          { text: "The leverage required to trade multiple pairs", isCorrect: false },
          { text: "The commission for trading correlated pairs", isCorrect: false },
        ]},
        { text: "EUR/USD and GBP/USD have a +0.85 correlation. What does this mean?", options: [
          { text: "They move in opposite directions", isCorrect: false },
          { text: "They mostly move in the same direction — buying both doubles your USD exposure", isCorrect: true },
          { text: "They are completely independent", isCorrect: false },
          { text: "You should always trade them together", isCorrect: false },
        ]},
        { text: "What is a 'daily risk cap' and what should it be?", options: [
          { text: "Stop trading if you lose 1 trade, cap at 2%", isCorrect: false },
          { text: "Stop trading after losing 6% of your account in one day (about 3 losses at 2%)", isCorrect: true },
          { text: "Only trade during 50% of the day", isCorrect: false },
          { text: "Risk 10% maximum per day", isCorrect: false },
        ]},
        { text: "What should you do after 3 consecutive losing trades in a day?", options: [
          { text: "Double your position size to recover faster", isCorrect: false },
          { text: "Switch to a different strategy immediately", isCorrect: false },
          { text: "Stop trading for the day — your judgment is likely compromised", isCorrect: true },
          { text: "Remove your stop losses to give trades more room", isCorrect: false },
        ]},
        { text: "What is 'revenge trading'?", options: [
          { text: "Trading after a profitable week", isCorrect: false },
          { text: "Trading aggressively after losses to try to win back money — driven by emotion", isCorrect: true },
          { text: "Opening trades on correlated pairs", isCorrect: false },
          { text: "A legitimate scalping strategy", isCorrect: false },
        ]},
        { text: "If you buy EUR/USD, GBP/USD, and AUD/USD simultaneously, what risk are you taking?", options: [
          { text: "Three independent, diversified trades", isCorrect: false },
          { text: "Triple exposure to USD weakness — essentially one bet times three", isCorrect: true },
          { text: "No additional risk since they're different pairs", isCorrect: false },
          { text: "Reduced risk through diversification", isCorrect: false },
        ]},
        { text: "What is the FIRST step in the pre-trade checklist?", options: [
          { text: "Calculate position size", isCorrect: false },
          { text: "Check the economic calendar for high-impact events", isCorrect: true },
          { text: "Set your stop loss", isCorrect: false },
          { text: "Choose a currency pair", isCorrect: false },
        ]},
        { text: "Why should beginners avoid trading during major news events?", options: [
          { text: "News events never affect the market", isCorrect: false },
          { text: "Spreads widen dramatically, volatility spikes, and stops can get triggered by extreme moves", isCorrect: true },
          { text: "Brokers close trading during news", isCorrect: false },
          { text: "News trading is only for monthly timeframes", isCorrect: false },
        ]},
      ]
    }
  }
];

async function main() {
  console.log("🎓 Seeding Level 3 Modules 2 & 3\n");
  const level = await prisma.level.findFirst({ where: { title: LEVEL_TITLE } });
  if (!level) { console.error("Level not found!"); process.exit(1); }
  console.log(`📦 Level: ${level.title} (${level.id})\n`);

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
      const htmlPath = path.join("content/data/level-03-protect-your-money", mod.folder, `${slug}.html`);
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
  console.log("✅ Level 3 Modules 2 & 3 — COMPLETE!");
  console.log("   6 Lessons, 12 Images, 20 Quiz Questions");
  console.log("=".repeat(60));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("Error:", e.message); await prisma.$disconnect(); process.exit(1); });
