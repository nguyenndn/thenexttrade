const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const MODULE_DIR = path.join(__dirname, "..", "content", "data", "level-01-first-steps", "module-02-understanding-margin-orders");

function makeImgTag(src, alt) {
  return `\n<figure class="lesson-image">\n  <img src="${src}" alt="${alt}" loading="lazy" />\n  <figcaption>${alt}</figcaption>\n</figure>\n`;
}

function insertAfterHeading(html, headingText, imgTag) {
  const idx = html.indexOf(headingText);
  if (idx < 0) return html;
  let closeIdx = html.indexOf('</h2>', idx);
  if (closeIdx < 0) closeIdx = html.indexOf('</h3>', idx);
  if (closeIdx < 0) return html;
  const tagEnd = html.indexOf('>', closeIdx) + 1;
  return html.slice(0, tagEnd) + '\n' + imgTag + html.slice(tagEnd);
}

function insertBeforeHeading(html, headingText, imgTag) {
  const idx = html.indexOf(headingText);
  if (idx < 0) return html;
  let tagStart = html.lastIndexOf('<h2>', idx);
  if (tagStart < 0) tagStart = html.lastIndexOf('<h3>', idx);
  if (tagStart < 0) return html;
  return html.slice(0, tagStart) + imgTag + '\n' + html.slice(tagStart);
}

const LESSONS = [
  {
    slug: "what-is-a-pip-and-why-its-worth-more-than-you-think",
    images: [
      { afterHeading: "What Exactly is a Pip?", src: "/images/academy/module-02/pip-decimal-visual.png", alt: "How a pip is measured — the fourth decimal place in a forex price quote" },
      { afterHeading: "How to Calculate Pip Value", src: "/images/academy/module-02/pip-value-chart.png", alt: "Pip values across different lot sizes — from $0.01 (nano) to $10 (standard)" },
    ]
  },
  {
    slug: "lots-mini-lots-and-micro-lots-size-matters",
    images: [
      { afterHeading: "What is a Lot in Forex?", src: "/images/academy/module-02/lot-size-comparison.png", alt: "Forex lot sizes compared — from nano (100 units) to standard (100,000 units)" },
      { afterHeading: "How to Choose the Right Lot Size", src: "/images/academy/module-02/position-sizing.png", alt: "The 1-2% risk rule — how to calculate the right position size for every trade" },
    ]
  },
  {
    slug: "leverage-the-double-edged-sword-nobody-warns-you-about",
    images: [
      { afterHeading: "What is Leverage in Forex?", src: "/images/academy/module-02/leverage-table.png", alt: "Leverage ratios and their margin requirements — from 1:1 to 500:1" },
      { afterHeading: "The Double-Edged Sword: A Real Example", src: "/images/academy/module-02/leverage-amplifier.png", alt: "Leverage amplifies both gains and losses equally — the double-edged sword of trading" },
    ]
  },
  {
    slug: "margin-explained-what-it-really-costs-to-open-a-trade",
    images: [
      { afterHeading: "Margin Terminology: The 4 Numbers You Must Know", src: "/images/academy/module-02/margin-dashboard.png", alt: "A trading platform's margin dashboard showing Balance, Equity, Used Margin, and Free Margin" },
      { afterHeading: "The Margin Call: What It Looks Like in Real Time", src: "/images/academy/module-02/margin-call-diagram.png", alt: "How a margin call happens — from trade open to forced stop out" },
    ]
  },
  {
    slug: "order-types-market-limit-stop-and-when-to-use-each",
    images: [
      { afterHeading: "Pending Orders: The Smart Way to Enter", src: "/images/academy/module-02/order-types-visual.png", alt: "The four types of pending orders — Buy Limit, Sell Limit, Buy Stop, and Sell Stop" },
      { afterHeading: "Exit Orders: Stop Loss and Take Profit", src: "/images/academy/module-02/stop-loss-take-profit.png", alt: "A complete trade setup showing Stop Loss and Take Profit with a 1:2 risk-reward ratio" },
    ]
  },
  {
    slug: "spreads-commissions-and-swaps-the-real-cost-of-trading",
    images: [
      { afterHeading: 'Cost #1: The Spread', src: "/images/academy/module-02/spread-explained.png", alt: "The forex spread explained — the difference between bid and ask price" },
      { beforeHeading: "How to Minimize Trading Costs", src: "/images/academy/module-02/trading-costs-breakdown.png", alt: "The three components of forex trading costs — spread, commission, and swap fees" },
    ]
  }
];

for (const lesson of LESSONS) {
  const filePath = path.join(MODULE_DIR, `${lesson.slug}.html`);
  let html;
  try {
    html = readFileSync(filePath, "utf-8");
  } catch (e) {
    console.log(`⚠️ File not found: ${lesson.slug}.html`);
    continue;
  }

  const existingCount = (html.match(/<figure/g) || []).length;
  console.log(`\n📖 ${lesson.slug}`);
  console.log(`   Existing images: ${existingCount}`);

  let added = 0;
  for (const img of lesson.images) {
    const imgTag = makeImgTag(img.src, img.alt);
    
    if (html.includes(img.src)) {
      console.log(`   ⏭️ Already has: ${img.alt.substring(0, 50)}...`);
      continue;
    }

    if (img.afterHeading) {
      html = insertAfterHeading(html, img.afterHeading, imgTag);
      added++;
      console.log(`   ✅ Added after "${img.afterHeading}": ${img.src}`);
    } else if (img.beforeHeading) {
      html = insertBeforeHeading(html, img.beforeHeading, imgTag);
      added++;
      console.log(`   ✅ Added before "${img.beforeHeading}": ${img.src}`);
    }
  }

  if (added > 0) {
    writeFileSync(filePath, html, "utf-8");
    const totalCount = (html.match(/<figure/g) || []).length;
    console.log(`   📦 Total images now: ${totalCount}`);
  } else {
    console.log(`   ℹ️ No new images needed`);
  }
}

console.log("\n🎉 Done!");
