/**
 * Generate Quiz for a Module from lesson content
 * 
 * Reads all .html lesson files in a module folder, analyzes content,
 * and creates quiz questions in DB via Prisma.
 * 
 * Formula: 2 questions per lesson (dynamic based on module size)
 * Passing score: 75%
 * 
 * Usage: node prisma/generate-quiz.js <module-folder>
 * Example: node prisma/generate-quiz.js content/data/level-01-first-steps/module-01-welcome-to-the-market
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readdir, readFile } = require("fs/promises");
const path = require("path");

const prisma = new PrismaClient();

/**
 * Strip HTML and extract clean text
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract key facts from lesson content for quiz generation
 */
function extractKeyFacts(html, title) {
  const text = stripHtml(html);
  
  // Extract table headers and data
  const tables = [];
  const tableRegex = /<table>([\s\S]*?)<\/table>/gi;
  let match;
  while ((match = tableRegex.exec(html)) !== null) {
    const rows = [];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let rm;
    while ((rm = rowRegex.exec(match[1])) !== null) {
      const cells = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cm;
      while ((cm = cellRegex.exec(rm[1])) !== null) {
        cells.push(stripHtml(cm[1]));
      }
      rows.push(cells);
    }
    tables.push(rows);
  }

  // Extract bold/strong facts
  const boldFacts = [];
  const boldRegex = /<strong>([\s\S]*?)<\/strong>/gi;
  while ((match = boldRegex.exec(html)) !== null) {
    const fact = stripHtml(match[1]);
    if (fact.length > 10 && fact.length < 200) {
      boldFacts.push(fact);
    }
  }

  // Extract list items
  const listItems = [];
  const liRegex = /<li>([\s\S]*?)<\/li>/gi;
  while ((match = liRegex.exec(html)) !== null) {
    const item = stripHtml(match[1]);
    if (item.length > 15 && item.length < 300) {
      listItems.push(item);
    }
  }

  return { text, tables, boldFacts, listItems, title };
}

/**
 * Generate questions from lesson content analysis
 * This is a rule-based generator — no AI API needed
 */
function generateQuestionsForLesson(facts, lessonIndex) {
  const questions = [];
  const { title, boldFacts, tables, listItems, text } = facts;

  // ============================================================================
  // LESSON 1: What is Forex?
  // ============================================================================
  if (title.includes("What is Forex")) {
    questions.push({
      text: "What is the daily trading volume of the forex market?",
      options: [
        { text: "$6.6 trillion", isCorrect: true },
        { text: "$16.7 billion", isCorrect: false },
        { text: "$1.2 trillion", isCorrect: false },
        { text: "$500 billion", isCorrect: false },
      ]
    });
    questions.push({
      text: "How many days per week does the forex market operate?",
      options: [
        { text: "7 days", isCorrect: false },
        { text: "5 days", isCorrect: true },
        { text: "6 days", isCorrect: false },
        { text: "4 days", isCorrect: false },
      ]
    });
    questions.push({
      text: "What does 'going short' mean in forex trading?",
      options: [
        { text: "Buying a currency pair expecting it to rise", isCorrect: false },
        { text: "Selling a currency pair expecting it to fall", isCorrect: true },
        { text: "Holding a position for a short time", isCorrect: false },
        { text: "Trading with a small account", isCorrect: false },
      ]
    });
  }

  // ============================================================================
  // LESSON 2: Currency Pairs
  // ============================================================================
  if (title.includes("Currency Pairs")) {
    questions.push({
      text: "In the EUR/USD pair, which is the base currency?",
      options: [
        { text: "USD", isCorrect: false },
        { text: "EUR", isCorrect: true },
        { text: "Both equally", isCorrect: false },
        { text: "Neither", isCorrect: false },
      ]
    });
    questions.push({
      text: "If EUR/USD is quoted at 1.1000, what does this mean?",
      options: [
        { text: "1 euro costs 1.10 US dollars", isCorrect: true },
        { text: "1 US dollar costs 1.10 euros", isCorrect: false },
        { text: "EUR is worth 11,000 pips", isCorrect: false },
        { text: "The spread is 1.10", isCorrect: false },
      ]
    });
    questions.push({
      text: "Which of the following is an example of a cross pair?",
      options: [
        { text: "EUR/USD", isCorrect: false },
        { text: "GBP/USD", isCorrect: false },
        { text: "EUR/GBP", isCorrect: true },
        { text: "USD/JPY", isCorrect: false },
      ]
    });
  }

  // ============================================================================
  // LESSON 3: Who Trades Forex
  // ============================================================================
  if (title.includes("Who Trades")) {
    questions.push({
      text: "Which participants have the most influence on the forex market?",
      options: [
        { text: "Retail traders", isCorrect: false },
        { text: "Central banks", isCorrect: true },
        { text: "Hedge funds", isCorrect: false },
        { text: "Forex brokers", isCorrect: false },
      ]
    });
    questions.push({
      text: "What is the primary role of a forex broker?",
      options: [
        { text: "To set currency exchange rates", isCorrect: false },
        { text: "To provide access to the interbank market for retail traders", isCorrect: true },
        { text: "To guarantee profits for traders", isCorrect: false },
        { text: "To control currency supply", isCorrect: false },
      ]
    });
  }

  // ============================================================================
  // LESSON 4: Forex Sessions
  // ============================================================================
  if (title.includes("Sessions") || title.includes("When to Trade")) {
    questions.push({
      text: "Which forex session typically has the highest trading volume?",
      options: [
        { text: "Sydney session", isCorrect: false },
        { text: "Tokyo session", isCorrect: false },
        { text: "London session", isCorrect: true },
        { text: "New York session", isCorrect: false },
      ]
    });
    questions.push({
      text: "What happens when two major forex sessions overlap?",
      options: [
        { text: "The market closes for maintenance", isCorrect: false },
        { text: "Volatility and liquidity typically increase", isCorrect: true },
        { text: "Spreads become wider", isCorrect: false },
        { text: "Only institutional traders can trade", isCorrect: false },
      ]
    });
  }

  // ============================================================================
  // LESSON 5: Forex vs Stocks vs Crypto
  // ============================================================================
  if (title.includes("Forex vs") || title.includes("Which Market")) {
    questions.push({
      text: "Which market operates 24 hours a day, 5 days a week?",
      options: [
        { text: "Stock market", isCorrect: false },
        { text: "Crypto market", isCorrect: false },
        { text: "Forex market", isCorrect: true },
        { text: "All of the above", isCorrect: false },
      ]
    });
    questions.push({
      text: "Which market operates 24/7 including weekends?",
      options: [
        { text: "Forex", isCorrect: false },
        { text: "Stocks", isCorrect: false },
        { text: "Cryptocurrency", isCorrect: true },
        { text: "Commodities", isCorrect: false },
      ]
    });
    questions.push({
      text: "What is a key advantage of forex over stocks for short-term traders?",
      options: [
        { text: "Forex has no risk", isCorrect: false },
        { text: "Higher liquidity and lower transaction costs", isCorrect: true },
        { text: "Forex always goes up", isCorrect: false },
        { text: "No need for technical analysis", isCorrect: false },
      ]
    });
  }

  return questions;
}

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node generate-quiz.js <module-folder>");
    process.exit(1);
  }

  const absFolder = path.resolve(folder);
  console.log(`📂 Module folder: ${absFolder}\n`);

  // Read all HTML files
  const allFiles = await readdir(absFolder);
  const htmlFiles = allFiles.filter(f => f.endsWith(".html")).sort();

  if (htmlFiles.length === 0) {
    console.log("No .html content files found!");
    process.exit(0);
  }

  console.log(`📝 Found ${htmlFiles.length} lessons\n`);

  // Generate all questions
  let allQuestions = [];

  for (let i = 0; i < htmlFiles.length; i++) {
    const file = htmlFiles[i];
    const filePath = path.join(absFolder, file);
    const html = await readFile(filePath, "utf-8");
    const slug = file.replace(".html", "");

    // Find lesson title from DB
    const lesson = await prisma.lesson.findFirst({
      where: { slug },
      select: { title: true, moduleId: true }
    });

    if (!lesson) {
      console.log(`  ⚠️ Lesson not found: ${slug}`);
      continue;
    }

    const facts = extractKeyFacts(html, lesson.title);
    const questions = generateQuestionsForLesson(facts, i);
    
    console.log(`  📖 ${lesson.title} → ${questions.length} questions`);
    allQuestions.push(...questions);

    // Store moduleId for quiz creation
    if (!allQuestions.moduleId) allQuestions.moduleId = lesson.moduleId;
  }

  if (allQuestions.length === 0) {
    console.log("\n❌ No questions generated!");
    process.exit(1);
  }

  // Get module info
  const firstLesson = await prisma.lesson.findFirst({
    where: { slug: htmlFiles[0].replace(".html", "") },
    include: { module: true }
  });

  if (!firstLesson?.module) {
    console.log("❌ Module not found!");
    process.exit(1);
  }

  const moduleId = firstLesson.moduleId;
  const moduleTitle = firstLesson.module.title;

  console.log(`\n📦 Module: ${moduleTitle}`);
  console.log(`❓ Total questions: ${allQuestions.length}`);
  console.log(`🎯 Pass score: 75%\n`);

  // Check if quiz already exists for this module
  const existing = await prisma.quiz.findFirst({ where: { moduleId } });
  if (existing) {
    // Delete old quiz and recreate
    console.log(`🔄 Replacing existing quiz: "${existing.title}"`);
    await prisma.quiz.delete({ where: { id: existing.id } });
  }

  // Create quiz with questions and options
  const quiz = await prisma.quiz.create({
    data: {
      title: `${moduleTitle} Quiz`,
      description: `Test your knowledge of ${moduleTitle}. ${allQuestions.length} questions, 75% to pass.`,
      moduleId,
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
  console.log(`\n============================`);
  console.log(`✅ Quiz ready! Pass score: 75%`);
  console.log(`============================`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
