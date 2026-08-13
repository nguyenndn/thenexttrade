const fs = require("fs");
const path = require("path");

const files = [
  "public/images/academy/level-02/module-03/platform-overview.png",
  "public/images/academy/level-02/module-03/order-types-market-vs-pending.png",
  "public/images/academy/level-02/module-03/sl-tp-ticket.png",
  "public/images/academy/level-02/module-03/position-management.png",
  "public/images/academy/level-09/module-01/calendar-columns-guide.png",
  "public/images/academy/level-09/module-01/nfp-cpi-fomc-cheatsheet.png",
  "public/images/academy/level-09/module-01/news-reaction-phases.png",
  "public/images/academy/level-09/module-01/news-trading-risk.png",
  "public/images/academy/level-12/module-01/demo-vs-real-mind.png",
  "public/images/academy/level-12/module-01/loss-shock-curve.png",
  "public/images/academy/level-12/module-01/emotion-to-action-traps.png",
  "public/images/academy/level-12/module-01/realistic-capital.png",
  "public/images/academy/level-12/module-01/lot-size-math.png",
  "public/images/academy/level-12/module-01/expectation-reality.png",
  "public/images/academy/level-02/module-02/four-styles-comparison.png",
  "public/images/academy/level-02/module-02/style-fit-flowchart.png",
  "public/images/academy/level-02/module-02/avoid-style-hopping.png",
  "public/images/academy/level-02/module-03/mobile-vs-desktop.png",
  "public/images/academy/level-02/module-03/price-alert-setup.png",
  "public/images/academy/level-02/module-03/mobile-risk-warning.png"
];

let count = 0;
files.forEach((f, i) => {
  const abs = path.join(process.cwd(), f);
  if (!fs.existsSync(abs)) {
    console.error(`[FAIL] ${i+1}. ${f} DOES NOT EXIST!`);
  } else {
    const stat = fs.statSync(abs);
    console.log(`[OK] ${i+1}. ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
    count++;
  }
});

console.log(`\n=== RESULTS: ${count} / ${files.length} images verified on disk! ===`);
