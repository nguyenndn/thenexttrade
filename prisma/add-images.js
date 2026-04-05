/**
 * Add images to lesson HTML files for Module 1
 * Inserts hero image after first paragraph and inline images at strategic points
 */
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const MODULE_DIR = path.join(__dirname, "..", "content", "data", "level-01-first-steps", "module-01-welcome-to-the-market");

const IMAGES = {
  "what-is-forex-the-6-6-trillion-market-nobody-explained-properly": {
    hero: { src: "/images/academy/module-01/what-is-forex.png", alt: "The global forex market — $6.6 trillion traded daily across major financial centers worldwide" },
    inline: [
      { after: "Why Forex is Different From Every Other Market", src: "/images/academy/module-01/what-is-forex.png", alt: "Key differences between forex and other financial markets" },
    ]
  },
  "currency-pairs-explained-base-quote-and-why-they-always-travel-in-twos": {
    hero: { src: "/images/academy/module-01/currency-pairs.png", alt: "Currency pairs explained — how base and quote currencies work together in forex trading" },
    inline: []
  },
  "who-trades-forex-banks-funds-brokers-and-you": {
    hero: { src: "/images/academy/module-01/who-trades-forex.png", alt: "The hierarchy of forex market participants — from central banks to retail traders" },
    inline: []
  },
  "forex-market-sessions-when-to-trade-and-when-to-sleep": {
    hero: { src: "/images/academy/module-01/forex-sessions.png", alt: "The four major forex trading sessions — Sydney, Tokyo, London, and New York" },
    inline: []
  },
  "forex-vs-stocks-vs-crypto-which-market-is-right-for-you": {
    hero: { src: "/images/academy/module-01/forex-vs-stocks-crypto.png", alt: "Comparing forex, stocks, and crypto markets — key differences for traders" },
    inline: []
  }
};

function makeImgTag(img) {
  return `\n<figure class="lesson-image">\n  <img src="${img.src}" alt="${img.alt}" loading="lazy" />\n  <figcaption>${img.alt}</figcaption>\n</figure>\n`;
}

for (const [slug, imgs] of Object.entries(IMAGES)) {
  const filePath = path.join(MODULE_DIR, `${slug}.html`);
  let html;
  try {
    html = readFileSync(filePath, "utf-8");
  } catch (e) {
    console.log(`⚠️ File not found: ${slug}.html`);
    continue;
  }

  // Skip if already has images
  if (html.includes('<img ')) {
    console.log(`⏭️ ${slug} — already has images`);
    continue;
  }

  // Insert hero image after first <hr /> or after first paragraph
  const heroTag = makeImgTag(imgs.hero);
  const firstHrIdx = html.indexOf('<hr />');
  if (firstHrIdx > 0) {
    // Insert after first <hr />
    html = html.slice(0, firstHrIdx + 6) + '\n' + heroTag + html.slice(firstHrIdx + 6);
  } else {
    // Insert after first closing </p>
    const firstP = html.indexOf('</p>');
    if (firstP > 0) {
      html = html.slice(0, firstP + 4) + '\n' + heroTag + html.slice(firstP + 4);
    }
  }

  // Insert inline images
  for (const inlineImg of imgs.inline) {
    const targetIdx = html.indexOf(inlineImg.after);
    if (targetIdx > 0) {
      // Find the next </p> or </h2> after the target text
      const afterTarget = html.indexOf('</h2>', targetIdx);
      if (afterTarget > 0) {
        const insertPoint = afterTarget + 5;
        html = html.slice(0, insertPoint) + '\n' + makeImgTag(inlineImg) + html.slice(insertPoint);
      }
    }
  }

  writeFileSync(filePath, html, "utf-8");
  console.log(`✅ ${slug} — images added`);
}

console.log("\n🎉 Done! Run save-module-content.js to push to DB.");
