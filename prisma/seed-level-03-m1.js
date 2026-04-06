/**
 * Seed Level 3 Module 1: Position Sizing & Stop Losses
 * 4 lessons + 1 quiz (12 questions)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");
const prisma = new PrismaClient();

const CONTENT_BASE = "content/data/level-03-protect-your-money";
const MODULE_TITLE = "Position Sizing & Stop Losses";

const LESSONS = [
  { slug: "position-sizing-the-math-that-saves-your-account", title: "Position Sizing — The Math That Saves Your Account" },
  { slug: "stop-loss-your-trading-insurance-policy", title: "Stop Loss — Your Trading Insurance Policy" },
  { slug: "take-profit-when-to-close-and-walk-away", title: "Take Profit — When to Close and Walk Away" },
  { slug: "trailing-stop-locking-in-profits-while-letting-winners-run", title: "Trailing Stop — Locking In Profits While Letting Winners Run" },
];

const QUIZ = {
  title: "Position Sizing & Stop Losses Quiz",
  description: "Test your understanding of position sizing, stop losses, take profits, and trailing stops. 12 questions, 75% to pass.",
  questions: [
    { text: "What is the position sizing formula?", options: [
      { text: "(Account × Risk %) ÷ (Stop Loss Pips × Pip Value)", isCorrect: true },
      { text: "Account ÷ Number of trades open", isCorrect: false },
      { text: "Leverage × Lot Size", isCorrect: false },
      { text: "Account Balance × Leverage", isCorrect: false },
    ]},
    { text: "What is the maximum recommended risk per trade for beginners?", options: [
      { text: "10% of account", isCorrect: false },
      { text: "5% of account", isCorrect: false },
      { text: "1-2% of account", isCorrect: true },
      { text: "25% of account", isCorrect: false },
    ]},
    { text: "After 10 consecutive losses at 2% risk, approximately how much of your original account remains?", options: [
      { text: "About 50%", isCorrect: false },
      { text: "About 82%", isCorrect: true },
      { text: "About 35%", isCorrect: false },
      { text: "Nothing — the account is blown", isCorrect: false },
    ]},
    { text: "What is a stop loss?", options: [
      { text: "An order that closes your trade automatically at a predetermined loss level", isCorrect: true },
      { text: "A trading strategy for losing trades", isCorrect: false },
      { text: "A fee charged by your broker", isCorrect: false },
      { text: "The total amount you've lost in your career", isCorrect: false },
    ]},
    { text: "What is the BEST method for placing a stop loss?", options: [
      { text: "Always use exactly 10 pips", isCorrect: false },
      { text: "Below support (buys) or above resistance (sells) — based on market structure", isCorrect: true },
      { text: "As close to entry as possible", isCorrect: false },
      { text: "Don't use a stop loss — just watch the trade", isCorrect: false },
    ]},
    { text: "What should you NEVER do with your stop loss once a trade is open?", options: [
      { text: "Move it to breakeven when in profit", isCorrect: false },
      { text: "Move it further away from entry when the trade goes against you", isCorrect: true },
      { text: "Tighten it as the trade moves in your favor", isCorrect: false },
      { text: "Set it based on support and resistance levels", isCorrect: false },
    ]},
    { text: "What is the minimum recommended risk-reward ratio?", options: [
      { text: "1:0.5 (risk more than you gain)", isCorrect: false },
      { text: "1:1 (equal risk and reward)", isCorrect: false },
      { text: "1:2 (target twice your risk)", isCorrect: true },
      { text: "Risk-reward doesn't matter", isCorrect: false },
    ]},
    { text: "What does 'scaling out' mean in trade management?", options: [
      { text: "Adding more lots to a losing trade", isCorrect: false },
      { text: "Closing portions of your position at different profit levels", isCorrect: true },
      { text: "Scaling your monitor to see more candles", isCorrect: false },
      { text: "Changing timeframes during a trade", isCorrect: false },
    ]},
    { text: "What is a trailing stop?", options: [
      { text: "A stop loss that only activates after a certain profit", isCorrect: false },
      { text: "A dynamic stop loss that moves with price in your favor but never moves against you", isCorrect: true },
      { text: "A stop loss placed at a trailing indicator", isCorrect: false },
      { text: "A commission charged when closing trades", isCorrect: false },
    ]},
    { text: "In which market condition do trailing stops work BEST?", options: [
      { text: "Choppy, sideways/ranging markets", isCorrect: false },
      { text: "Strong trending markets", isCorrect: true },
      { text: "During major news events", isCorrect: false },
      { text: "When the market is closed", isCorrect: false },
    ]},
    { text: "What is the main advantage of an ATR-based trailing stop over a fixed pip trail?", options: [
      { text: "It's simpler to calculate", isCorrect: false },
      { text: "It automatically adapts to market volatility", isCorrect: true },
      { text: "It always gives bigger profits", isCorrect: false },
      { text: "It can be used without a stop loss", isCorrect: false },
    ]},
    { text: "Why should your lot size change with every trade?", options: [
      { text: "To make trading more exciting", isCorrect: false },
      { text: "Because each trade has a different stop loss distance, so lot size must adjust to keep risk consistent", isCorrect: true },
      { text: "Because brokers require it", isCorrect: false },
      { text: "It shouldn't — always use the same lot size", isCorrect: false },
    ]},
  ]
};

async function main() {
  console.log("🎓 Seeding Level 3 Module 1: Position Sizing & Stop Losses\n");

  // Find Level
  let level = await prisma.level.findFirst({ where: { title: "Protect Your Money" } });
  if (!level) {
    level = await prisma.level.create({
      data: { title: "Protect Your Money", description: "Risk Management — Position sizing, stop losses, risk-reward ratio.", order: 3 }
    });
    console.log(`✅ Created Level: ${level.title}`);
  } else {
    console.log(`📦 Level exists: ${level.title} (${level.id})`);
  }

  // Find or create Module
  let module = await prisma.module.findFirst({ where: { title: MODULE_TITLE, levelId: level.id } });
  if (!module) {
    module = await prisma.module.create({
      data: { title: MODULE_TITLE, description: "Position sizing, stop losses, take profits, and trailing stops.", order: 1, levelId: level.id }
    });
    console.log(`✅ Created Module: ${module.title}`);
  } else {
    console.log(`📦 Module exists: ${module.title} (${module.id})`);
  }

  // Seed lessons
  for (let i = 0; i < LESSONS.length; i++) {
    const { slug, title } = LESSONS[i];
    const htmlPath = path.join(CONTENT_BASE, "module-01-position-sizing-stop-losses", `${slug}.html`);
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
      title: QUIZ.title, description: QUIZ.description, moduleId: module.id,
      questions: { create: QUIZ.questions.map((q, idx) => ({ text: q.text, order: idx + 1, options: { create: q.options } })) },
    },
    include: { questions: true },
  });
  console.log(`  ✅ Quiz created: ${quiz.questions.length} questions (ID: ${quiz.id})`);

  console.log(`\n✅ Level 3 Module 1 — COMPLETE! (4 lessons, 8 images, 12 quiz questions)`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("Error:", e.message); await prisma.$disconnect(); process.exit(1); });
