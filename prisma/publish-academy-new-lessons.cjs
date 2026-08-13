// prisma/publish-academy-new-lessons.cjs
// Reads the 6 new academy lesson HTML files and publishes them (idempotent).
// Run: node prisma/publish-academy-new-lessons.cjs
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const LESSONS = [
  {
    key: "N1",
    slug: "meet-your-trading-platform-mt4-mt5-and-more",
    duration: 12,
    tone: "conversational",
    metaDescription: "Learn the essentials of MT4, MT5, and cTrader: placing market and pending orders, setting stop loss and take profit, and managing a position from open to close.",
    file: "content/generated-academy/N1-meet-your-trading-platform.html",
  },
  {
    key: "N2",
    slug: "reading-the-economic-calendar-and-reacting-to-the-news",
    duration: 12,
    tone: "professional",
    metaDescription: "How to read every column of the economic calendar and react correctly around NFP, CPI, and FOMC releases without over-trading the news.",
    file: "content/generated-academy/N2-reading-the-economic-calendar.html",
  },
  {
    key: "N3a",
    slug: "going-live-the-psychology-of-trading-real-money",
    duration: 10,
    tone: "motivational",
    metaDescription: "The psychological shift of trading real money: surviving the first real loss, recognizing emotional traps, and pre-committing to rules before going live.",
    file: "content/generated-academy/N3a-going-live-psychology.html",
  },
  {
    key: "N3b",
    slug: "going-live-the-financial-side-of-real-money",
    duration: 10,
    tone: "motivational",
    metaDescription: "The financial side of going live: how much capital you really need, lot-size math, real trading costs, and realistic expectations.",
    file: "content/generated-academy/N3b-going-live-finance.html",
  },
  {
    key: "N4",
    slug: "choosing-your-trading-style-scalping-day-swing-position",
    duration: 8,
    tone: "conversational",
    metaDescription: "Scalping, day, swing, or position trading: compare the four styles, choose the one that fits your lifestyle, and avoid the style-hopping trap.",
    file: "content/generated-academy/N4-choosing-your-trading-style.html",
  },
  {
    key: "N5",
    slug: "trading-on-mobile-stay-in-control-on-the-go",
    duration: 6,
    tone: "conversational",
    metaDescription: "How to use mobile trading apps safely: what they are good for, setting price alerts, and the specific risks of trading from a phone.",
    file: "content/generated-academy/N5-trading-on-mobile.html",
  },
];

async function main() {
  for (const l of LESSONS) {
    const abs = path.join(process.cwd(), l.file);
    if (!fs.existsSync(abs)) {
      console.error("MISSING FILE: " + abs + " — skipping " + l.key);
      continue;
    }
    const content = fs.readFileSync(abs, "utf8").trim();
    const existing = await prisma.lesson.findUnique({ where: { slug: l.slug } });
    if (!existing) {
      console.error("MISSING SLUG: " + l.slug + " — skipping " + l.key);
      continue;
    }
    await prisma.lesson.update({
      where: { slug: l.slug },
      data: {
        content,
        status: "published",
        duration: l.duration,
        tone: l.tone,
        metaDescription: l.metaDescription,
      },
    });
    console.log("Published " + l.key + " [" + l.slug + "] content=" + content.length + " chars");
  }
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
