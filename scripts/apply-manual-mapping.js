const fs = require('fs');
const path = require('path');

const mapping = {
  "2026-05-18_20-50-09__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "support-and-resistance-zones-indicator",
  "2026-05-18_20-51-01__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "top-5-forex-indicators-for-day-trading",
  "2026-05-18_20-52-12__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "relative-strength-index-trading-strategy",
  "2026-05-18_20-53-35__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "best-moving-average-crossover-strategy",
  "2026-05-18_20-54-38__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "macd-indicator-explained-for-beginners",
  "2026-05-18_20-56-01__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "bollinger-bands-trading-strategy",
  "2026-05-18_20-57-24__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "fibonacci-retracement-levels-explained",
  "2026-05-18_20-58-38__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "atr-indicator-for-stop-loss",
  "2026-05-18_21-00-04__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "ichimoku-cloud-trading-strategy",
  "2026-05-18_21-01-32__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "volume-profile-trading-strategy",
  "2026-05-18_21-03-03__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "price-action-trading-strategies",
  "2026-05-18_21-04-31__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "candlestick-patterns-cheat-sheet",
  "2026-05-18_21-06-10__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "how-to-trade-pin-bar-reversals",
  "2026-05-18_21-07-39__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "engulfing-candlestick-pattern",
  "2026-05-18_21-09-15__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "doji-candlestick-meaning",
  "2026-05-18_21-10-54__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "head-and-shoulders-pattern-target",
  "2026-05-18_21-13-43__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "double-top-and-double-bottom-patterns",
  "2026-05-18_21-15-13__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "ascending-and-descending-triangles",
  "2026-05-18_21-16-43__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "bull-flag-and-bear-flag-trading",
  "2026-05-18_21-18-16__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "cup-and-handle-pattern-breakout",
  "2026-05-18_21-20-04__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "wedge-patterns-in-trading",
  "2026-05-18_21-21-42__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "forex-risk-management-strategies",
  "2026-05-18_21-23-34__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "position-sizing-calculator-forex",
  "2026-05-18_21-25-06__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "risk-reward-ratio-explained",
  "2026-05-18_21-28-44__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "how-to-use-trailing-stop-loss",
  "2026-05-18_21-30-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "trading-psychology-tips",
  "2026-05-18_21-31-45__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "fomo-in-trading",
  "2026-05-18_21-33-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "revenge-trading-how-to-stop",
  "2026-05-18_21-35-21__Generate-a-widescreen-(169-aspect-ratio)-premium-i (1).png": "trading-journal-template",
  "2026-05-18_21-35-21__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "how-to-build-a-trading-plan",
  "2026-05-18_21-36-41__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "forex-trading-sessions-times",
  "2026-05-18_21-36-54__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "best-currency-pairs-to-trade",
  "2026-05-18_21-38-15__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "hedging-strategy-forex-explained",
  "2026-05-18_21-38-21__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "grid-trading-strategy-explained",
  "2026-05-18_21-39-54__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "forex-scalping-5-minute-chart",
  "2026-05-18_21-40-12__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "day-trading-strategies-for-beginners",
  "2026-05-18_21-41-21__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "breakout-trading-strategy-forex",
  "2026-05-18_21-43-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "best-forex-trading-strategies",
  "2026-05-18_21-45-46__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "tweezer-top-and-bottom-pattern",
  "2026-05-18_21-46-32__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "three-white-soldiers-three-black-crows",
  "2026-05-18_21-49-12__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "supply-and-demand-zones",
  "2026-05-18_21-51-10__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "spinning-top-vs-doji-difference",
  "2026-05-18_21-53-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "smart-money-concepts-vs-retail-trading",
  "2026-05-18_22-00-40__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "order-blocks-trading-explained",
  "2026-05-18_22-04-20__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "morning-star-and-evening-star-patterns",
  "2026-05-18_22-09-52__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "hammer-and-hanging-man-candle",
  "2026-05-18_22-12-50__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "fair-value-gap-fvg-trading",
  "2026-05-18_22-21-45__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "symmetrical-triangle-trading",
  "2026-05-18_22-23-51__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "rounding-bottom-pattern",
  "2026-05-18_22-25-19__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "rising-wedge-vs-falling-wedge",
  "2026-05-18_22-26-59__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "reversal-vs-continuation-patterns-explained",
  "2026-05-18_22-30-38__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "pennant-pattern-trading",
  "2026-05-18_22-32-19__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "most-reliable-chart-patterns-ranked",
  "2026-05-18_22-34-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "inverse-head-and-shoulders-pattern",
  "2026-05-18_22-37-36__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "how-to-trade-chart-patterns-step-by-step",
  "2026-05-18_22-39-38__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "head-and-shoulders-pattern",
  "2026-05-18_22-42-13__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "double-top-and-double-bottom",
  "2026-05-18_22-43-28__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "descending-triangle-pattern",
  "2026-05-18_22-46-04__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "cup-and-handle-pattern",
  "2026-05-18_22-48-45__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "bull-flag-and-bear-flag-patterns",
  "2026-05-18_22-51-35__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "ascending-triangle-pattern",
  "2026-05-18_22-53-24__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "technical-analysis-vs-fundamental-analysis",
  "2026-05-18_23-17-28__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "technical-analysis-for-beginners",
  "2026-05-18_23-19-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "support-and-resistance-trading",
  "2026-05-18_23-20-44__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "stochastic-oscillator-explained",
  "2026-05-18_23-23-11__Generate-a-widescreen-(169-aspect-ratio)-premium-i.png": "sma-vs-ema-which-to-use"
};

async function moveFiles() {
  const sourceDir = path.join(__dirname, '../public/images/featured/autoimage');
  const targetDir = path.join(__dirname, '../public/images/featured');

  let successCount = 0;
  let failCount = 0;

  for (const [filename, slug] of Object.entries(mapping)) {
    const sourcePath = path.join(sourceDir, filename);
    const ext = path.extname(filename);
    const targetPath = path.join(targetDir, `${slug}${ext}`);

    try {
      if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved: ${filename} -> ${slug}${ext}`);
        successCount++;
      } else {
        console.warn(`File not found: ${filename}`);
        failCount++;
      }
    } catch (err) {
      console.error(`Error moving ${filename}:`, err);
      failCount++;
    }
  }

  console.log(`\nFinished moving files. Success: ${successCount}, Failed: ${failCount}`);
}

moveFiles();
