/**
 * Add INLINE images to lessons that currently only have 1 hero image
 * Each lesson needs 2-3 total images
 */
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const MODULE_DIR = path.join(__dirname, "..", "content", "data", "level-01-first-steps", "module-01-welcome-to-the-market");

function makeImgTag(src, alt) {
  return `\n<figure class="lesson-image">\n  <img src="${src}" alt="${alt}" loading="lazy" />\n  <figcaption>${alt}</figcaption>\n</figure>\n`;
}

function insertAfterHeading(html, headingText, imgTag) {
  const idx = html.indexOf(headingText);
  if (idx < 0) return html;
  // Find the closing </h2> or </h3> after the heading
  let closeIdx = html.indexOf('</h2>', idx);
  if (closeIdx < 0) closeIdx = html.indexOf('</h3>', idx);
  if (closeIdx < 0) return html;
  const tagEnd = html.indexOf('>', closeIdx) + 1;
  return html.slice(0, tagEnd) + '\n' + imgTag + html.slice(tagEnd);
}

function insertBeforeHeading(html, headingText, imgTag) {
  const idx = html.indexOf(headingText);
  if (idx < 0) return html;
  // Find the <h2> or <h3> tag start before this text
  let tagStart = html.lastIndexOf('<h2>', idx);
  if (tagStart < 0) tagStart = html.lastIndexOf('<h3>', idx);
  if (tagStart < 0) return html;
  return html.slice(0, tagStart) + imgTag + '\n' + html.slice(tagStart);
}

const LESSONS = [
  {
    slug: "currency-pairs-explained-base-quote-and-why-they-always-travel-in-twos",
    images: [
      { afterHeading: "The Anatomy of a Currency Pair", src: "/images/academy/module-01/base-quote-visual.png", alt: "Base currency vs quote currency — how EUR/USD pricing works" },
      { afterHeading: "The Three Categories of Currency Pairs", src: "/images/academy/module-01/currency-majors.png", alt: "The 7 major forex currency pairs that account for 85% of global trading volume" },
    ]
  },
  {
    slug: "who-trades-forex-banks-funds-brokers-and-you",
    images: [
      { afterHeading: "The Interbank Market", src: "/images/academy/module-01/market-participants.png", alt: "The flow of forex market orders between central banks, institutions, and retail traders" },
      { beforeHeading: "Frequently Asked Questions", src: "/images/academy/module-01/retail-trader-desk.png", alt: "A retail forex trader's workspace — where individual traders connect to the global market" },
    ]
  },
  {
    slug: "forex-market-sessions-when-to-trade-and-when-to-sleep",
    images: [
      { afterHeading: "When Sessions Overlap", src: "/images/academy/module-01/session-overlap.png", alt: "Forex session overlaps — the London-New York overlap produces the highest trading volume" },
      { beforeHeading: "Frequently Asked Questions", src: "/images/academy/module-01/best-trading-times.png", alt: "The world's three major financial hubs — London, New York, and Tokyo connected by trading volume" },
    ]
  },
  {
    slug: "forex-vs-stocks-vs-crypto-which-market-is-right-for-you",
    images: [
      { afterHeading: "The Big Comparison", src: "/images/academy/module-01/market-comparison.png", alt: "Forex vs stocks vs crypto — key features and differences at a glance" },
      { beforeHeading: "Quick Recap", src: "/images/academy/module-01/choose-your-market.png", alt: "Choosing your trading market — forex, stocks, or crypto, each path offers unique opportunities" },
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

  // Count existing images
  const existingCount = (html.match(/<figure/g) || []).length;
  console.log(`\n📖 ${lesson.slug}`);
  console.log(`   Existing images: ${existingCount}`);

  let added = 0;
  for (const img of lesson.images) {
    const imgTag = makeImgTag(img.src, img.alt);
    
    // Check if this image is already inserted
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

console.log("\n🎉 Done! Run: node prisma/save-module-content.js content/data/level-01-first-steps/module-01-welcome-to-the-market");
