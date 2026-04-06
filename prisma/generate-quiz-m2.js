/**
 * Generate Quiz for Module 2: Understanding Margin & Orders
 * 
 * 2-3 questions per lesson, 15 total questions
 * Passing score: 75%
 * 
 * Usage: node prisma/generate-quiz-m2.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MODULE_FOLDER = "module-02-understanding-margin-orders";

const allQuestions = [
  // ============================================================================
  // LESSON 1: What is a Pip?
  // ============================================================================
  {
    text: "What does 'pip' stand for in forex trading?",
    options: [
      { text: "Percentage in Point", isCorrect: true },
      { text: "Price Index Position", isCorrect: false },
      { text: "Profit Interest Percentage", isCorrect: false },
      { text: "Point in Pricing", isCorrect: false },
    ]
  },
  {
    text: "For most currency pairs, a pip is measured at which decimal place?",
    options: [
      { text: "Second decimal place", isCorrect: false },
      { text: "Third decimal place", isCorrect: false },
      { text: "Fourth decimal place", isCorrect: true },
      { text: "Fifth decimal place", isCorrect: false },
    ]
  },
  {
    text: "What is the pip value for 1 standard lot (100,000 units) on EUR/USD?",
    options: [
      { text: "$0.10 per pip", isCorrect: false },
      { text: "$1 per pip", isCorrect: false },
      { text: "$10 per pip", isCorrect: true },
      { text: "$100 per pip", isCorrect: false },
    ]
  },

  // ============================================================================
  // LESSON 2: Lots, Mini Lots, and Micro Lots
  // ============================================================================
  {
    text: "How many units does a standard lot represent in forex?",
    options: [
      { text: "1,000 units", isCorrect: false },
      { text: "10,000 units", isCorrect: false },
      { text: "100,000 units", isCorrect: true },
      { text: "1,000,000 units", isCorrect: false },
    ]
  },
  {
    text: "Which lot size is most recommended for beginners with a small account?",
    options: [
      { text: "Standard lot", isCorrect: false },
      { text: "Mini lot", isCorrect: false },
      { text: "Micro lot", isCorrect: true },
      { text: "Mega lot", isCorrect: false },
    ]
  },
  {
    text: "How many micro lots equal one standard lot?",
    options: [
      { text: "10", isCorrect: false },
      { text: "50", isCorrect: false },
      { text: "100", isCorrect: true },
      { text: "1,000", isCorrect: false },
    ]
  },

  // ============================================================================
  // LESSON 3: Leverage — The Double-Edged Sword
  // ============================================================================
  {
    text: "With 1:100 leverage, how much capital do you need to control a $100,000 position?",
    options: [
      { text: "$100", isCorrect: false },
      { text: "$1,000", isCorrect: true },
      { text: "$10,000", isCorrect: false },
      { text: "$50,000", isCorrect: false },
    ]
  },
  {
    text: "Why is leverage called a 'double-edged sword'?",
    options: [
      { text: "It only works in one direction", isCorrect: false },
      { text: "It amplifies both potential profits AND losses", isCorrect: true },
      { text: "It charges double the commission", isCorrect: false },
      { text: "It can only be used twice per day", isCorrect: false },
    ]
  },

  // ============================================================================
  // LESSON 4: Margin Explained
  // ============================================================================
  {
    text: "What is 'margin' in forex trading?",
    options: [
      { text: "Your total account balance", isCorrect: false },
      { text: "The profit from a trade", isCorrect: false },
      { text: "The collateral/deposit required to open and maintain a position", isCorrect: true },
      { text: "The fee charged by your broker", isCorrect: false },
    ]
  },
  {
    text: "What happens when your margin level drops too low?",
    options: [
      { text: "Your leverage increases automatically", isCorrect: false },
      { text: "You receive a margin call and positions may be forcibly closed", isCorrect: true },
      { text: "Your broker adds more funds to your account", isCorrect: false },
      { text: "Nothing — you can keep trading normally", isCorrect: false },
    ]
  },
  {
    text: "If you use 1:50 leverage, what margin percentage is required?",
    options: [
      { text: "1%", isCorrect: false },
      { text: "2%", isCorrect: true },
      { text: "5%", isCorrect: false },
      { text: "10%", isCorrect: false },
    ]
  },

  // ============================================================================
  // LESSON 5: Order Types — Market, Limit, Stop
  // ============================================================================
  {
    text: "What is a market order?",
    options: [
      { text: "An order to buy/sell at a specific future price", isCorrect: false },
      { text: "An order to buy/sell immediately at the current market price", isCorrect: true },
      { text: "An order that only executes after market close", isCorrect: false },
      { text: "An order that automatically cancels after 24 hours", isCorrect: false },
    ]
  },
  {
    text: "When would you use a buy limit order?",
    options: [
      { text: "When you want to buy at a price ABOVE the current market price", isCorrect: false },
      { text: "When you want to buy at a price BELOW the current market price", isCorrect: true },
      { text: "When you want to sell immediately", isCorrect: false },
      { text: "When you want to close an existing position", isCorrect: false },
    ]
  },

  // ============================================================================
  // LESSON 6: Spreads, Commissions, and Swaps
  // ============================================================================
  {
    text: "What is the 'spread' in forex trading?",
    options: [
      { text: "The daily trading limit", isCorrect: false },
      { text: "The difference between the buy (ask) and sell (bid) price", isCorrect: true },
      { text: "The commission charged per trade", isCorrect: false },
      { text: "The overnight holding fee", isCorrect: false },
    ]
  },
  {
    text: "What is a 'swap' fee in forex?",
    options: [
      { text: "A fee for switching between currency pairs", isCorrect: false },
      { text: "The cost of exchanging currencies at an airport", isCorrect: false },
      { text: "An overnight interest charge/credit for holding positions past rollover time", isCorrect: true },
      { text: "A penalty for closing trades too quickly", isCorrect: false },
    ]
  },
];

async function main() {
  console.log("🎓 Generating Quiz for Module 2: Understanding Margin & Orders\n");

  // Find the module
  const module = await prisma.module.findFirst({
    where: {
      title: { contains: "Understanding Margin" }
    },
    select: { id: true, title: true }
  });

  if (!module) {
    console.error("❌ Module 2 not found! Make sure lessons are seeded.");
    process.exit(1);
  }

  console.log(`📦 Module: ${module.title} (${module.id})`);
  console.log(`❓ Total questions: ${allQuestions.length}`);
  console.log(`🎯 Pass score: 75%\n`);

  // Check if quiz already exists
  const existing = await prisma.quiz.findFirst({ where: { moduleId: module.id } });
  if (existing) {
    console.log(`🔄 Replacing existing quiz: "${existing.title}"`);
    await prisma.quiz.delete({ where: { id: existing.id } });
  }

  // Create quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: `${module.title} Quiz`,
      description: `Test your understanding of pips, lots, leverage, margin, order types, and trading costs. ${allQuestions.length} questions, 75% to pass.`,
      moduleId: module.id,
      questions: {
        create: allQuestions.map((q, idx) => ({
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
    include: {
      questions: { include: { options: true } },
    },
  });

  console.log(`✅ Quiz created: "${quiz.title}" (ID: ${quiz.id})`);
  console.log(`   ${quiz.questions.length} questions with ${quiz.questions.reduce((s, q) => s + q.options.length, 0)} total options`);
  
  // Print summary
  console.log("\n📝 Questions:");
  quiz.questions.forEach((q, i) => {
    const correct = q.options.find(o => o.isCorrect);
    console.log(`  ${i + 1}. ${q.text}`);
    console.log(`     ✅ ${correct?.text}`);
  });

  console.log(`\n============================`);
  console.log(`✅ Module 2 Quiz ready! Pass score: 75%`);
  console.log(`============================`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
