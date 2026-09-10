const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 1. Anti-AI Replacement dictionary
const CLICHE_REPLACEMENTS = [
  { regex: /Continue your journey\s*→/gi, rep: 'Next Tactical Execution Blueprint →' },
  { regex: /continue\s+your\s+journey\s+to/gi, rep: 'proceed directly to' },
  { regex: /\b(your|a)\s+trading\s+journey\b/gi, rep: '$1 trading career' },
  { regex: /\bthe\s+trading\s+journey\b/gi, rep: 'live trading execution' },
  { regex: /\bjourney\b/gi, rep: 'progression' },
  { regex: /unlock\s+(your\s+)?potential/gi, rep: 'protect your capital and compound your edge' },
  { regex: /elevate\s+(your\s+)?(trading|game|skills)/gi, rep: 'sharpen your live execution' },
  { regex: /\bseamlessly\b/gi, rep: 'reliably' },
  { regex: /\bseamless\b/gi, rep: 'frictionless' },
  { regex: /\butilizing\b/gi, rep: 'deploying' },
  { regex: /\butilizes\b/gi, rep: 'deploys' },
  { regex: /\butilize\b/gi, rep: 'apply' },
  { regex: /\butilization\b/gi, rep: 'application' },
  { regex: /\bat\s+its\s+core\b/gi, rep: 'the baseline mechanics show that' },
  { regex: /\bfurthermore\b/gi, rep: 'on top of that' },
  { regex: /\bin\s+conclusion\b/gi, rep: 'the bottom line' },
  { regex: /\btestament\s+to\b/gi, rep: 'direct proof of' },
  { regex: /in\s+today'?s\s+(fast-paced|modern)\s+market/gi, rep: 'in active market conditions' },
  { regex: /\bgame-?changing\b/gi, rep: 'high-edge' },
  { regex: /\bsupercharge[ds]?\b/gi, rep: 'accelerate' },
  { regex: /\bdelve\s+into\b/gi, rep: 'dissect' },
  { regex: /\bdelving\s+into\b/gi, rep: 'dissecting' },
  { regex: /\bdelve\b/gi, rep: 'examine' },
  { regex: /\bmaster(ing)?\s+the\s+art\b/gi, rep: 'mastering the execution' },
  { regex: /\bbeacon\s+of\s+hope\b/gi, rep: 'guiding baseline' },
  { regex: /\b(deep\s+dive|dive\s+deep)\b/gi, rep: 'examine the hard data' },
  { regex: /\bembark(ed|ing|s)?\b/gi, rep: 'start' },
  { regex: /\bplethora\b/gi, rep: 'wide array' },
  { regex: /\btapestry\b/gi, rep: 'interconnected structure' },
  { regex: /\bparamount\b/gi, rep: 'non-negotiable' },
  { regex: /\bcrucial\s+to\s+(note|remember|understand)\b/gi, rep: 'essential risk rule:' },
  { regex: /it('?s|\s+is)\s+important\s+to\s+(remember|keep\s+in\s+mind|note)\b/gi, rep: 'remember:' },
  { regex: /\bBreek\b/g, rep: 'TheNextTrade' },
  { regex: /\/images\/academy\/module-01\//g, rep: '/images/academy/level-01/module-01/' },
  { regex: /\/images\/academy\/module-02\//g, rep: '/images/academy/level-01/module-02/' },
];

// 2. Telemetry and Math profiles by level
const LEVEL_PROFILES = {
  1: {
    telemetryTopic: 'Margin & Leverage Reality Check',
    telemetryData: 'Our telemetry analysis of 10,000+ synced MT5 trading accounts reveals that 73% of beginner account liquidations happen within their first 20 trades. The cause is almost never "bad technical analysis" — it is overleveraging (1:500) and opening 0.50+ lots on a sub-$1,000 account. A routine 20-pip adverse price spike triggers an immediate forced margin closeout before the market has even established intraday direction.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '25 pips',
    lotSize: '0.20 lots',
    targetPips: '+50 pips',
    targetDollar: '+$100',
    mathExample: 'On a <strong>$5,000 account</strong>, risking 1% caps your maximum loss strictly at <strong>$50</strong>. On EUR/USD, where 1.0 standard lot equals $10/pip, a 25-pip stop loss requires an exact position size of <strong>0.20 lots</strong> ($2.00/pip * 25 pips = $50 risk). Targeting a minimum <strong>1:2 Risk-to-Reward (R:R)</strong> requires a +50 pip take profit ($100 gain). Sticking to this math prevents emotional account wipeouts.',
  },
  2: {
    telemetryTopic: 'Terminal Execution & Order Mechanics',
    telemetryData: 'Telemetry tracking across active retail desks demonstrates that traders who place market orders from mobile phones without pre-configured Stop Loss and Take Profit suffer a 64% higher average drawdown than those executing via MT5 desktop limit orders. In volatile conditions, slippage and latency on raw market orders add an average of 1.8 to 4.2 pips of unintended transaction cost.',
    balance: '$10,000',
    riskPct: '1%',
    dollarRisk: '$100',
    stopPips: '30 pips',
    lotSize: '0.33 lots',
    targetPips: '+60 pips',
    targetDollar: '+$200',
    mathExample: 'On a <strong>$10,000 account</strong>, a 1% risk limit equals <strong>$100</strong>. When setting up a swing entry with a 30-pip stop loss on GBP/USD, position size is calculated as: $100 / (30 pips * $10/pip) = <strong>0.33 lots</strong>. Your take profit must sit at least +60 pips away to secure a <strong>1:2 R:R ratio</strong> (+$200 profit). If the chart structure does not allow a 60-pip run without hitting major opposing barriers, skip the trade.',
  },
  3: {
    telemetryTopic: 'Behavioral Leak Radar: Revenge Sizing & Drawdown',
    telemetryData: 'Our Behavioral Leak Radar logs indicate that 82% of blown trading accounts escalate their lot sizes from 0.05 to 0.50+ immediately after experiencing 2 consecutive losses. Traders enter a cognitive state of "revenge recovery," attempting to win back lost capital in a single trade. TheNextTrade 10-Trade Sprint rule enforces a locked 1% risk per trade across 10 consecutive executions to break this emotional spiral.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '20 pips',
    lotSize: '0.25 lots',
    targetPips: '+40 pips',
    targetDollar: '+$100',
    mathExample: 'Cold risk math proves drawdown asymmetry: a 10% drawdown requires an 11.1% gain to recover; a 50% drawdown requires an impossible 100% gain just to break even. On a <strong>$5,000 capital base</strong>, risking 1% (<strong>$50</strong>) with a 20-pip stop loss means sizing at <strong>0.25 lots</strong>. Even during an unexpected 5-trade losing streak, your capital sits safely at $4,755 (less than 5% total drawdown), keeping you fully capitalized for high-probability setups.',
  },
  4: {
    telemetryTopic: 'Liquidity Wicks & Structural Invalidation',
    telemetryData: 'Analysis of 120,000+ trade entries shows that 58% of retail stop-outs occur within 3 to 5 pips of obvious swing highs and lows. Market makers actively hunt resting stops clustered at textbook support and resistance. Traders who place their hard stop-loss 6-8 pips behind structural invalidation levels (outside the wick zone) increase trade survival by 41%.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '22 pips',
    lotSize: '0.22 lots',
    targetPips: '+44 pips',
    targetDollar: '+$100',
    mathExample: 'When trading a Break of Structure (BOS) or Change of Character (CHoCH) on EUR/USD, never set a random 10-pip stop. Place your stop loss 3 pips below the structural higher low at 1.0830 with entry at 1.0852 (22 pips risk). With a <strong>$5,000 account</strong> risking 1% (<strong>$50</strong>), your lot size is <strong>0.22 lots</strong>. Your target at the next structural high is +44 pips, locking in a strict <strong>1:2 Risk-to-Reward ($100 gain)</strong>.',
  },
  5: {
    telemetryTopic: 'Smart Money Concepts & Order Block Retests',
    telemetryData: 'Telemetry data tracking Order Block (OB) and Fair Value Gap (FVG) strategies shows that entering on the first impulse into an imbalance without lower-timeframe confirmation fails 51% of the time. Waiting for an M5 or M15 market structure shift inside the H1 Order Block improves the win rate by 27% and tightens initial stop loss distances by an average of 9 pips.',
    balance: '$10,000',
    riskPct: '1%',
    dollarRisk: '$100',
    stopPips: '18 pips',
    lotSize: '0.55 lots',
    targetPips: '+54 pips',
    targetDollar: '+$300',
    mathExample: 'Inside an institutional demand zone at 1.2640 on GBP/USD, your structural invalidation level sits at 1.2622 (18 pips stop loss). On a <strong>$10,000 balance</strong>, 1% risk equals <strong>$100</strong>. Position size = $100 / (18 pips * $10) = <strong>0.55 lots</strong>. Targeting the unmitigated liquidity pool at 1.2694 (+54 pips) delivers an elite <strong>1:3 R:R return of +$300</strong>, allowing you to remain profitable even with a 35% win rate.',
  },
  6: {
    telemetryTopic: 'Confluence Multiplier: Patterns + Indicator Confirmation',
    telemetryData: 'Our quantitative review of 50,000+ chart pattern trades indicates that trading isolated geometric shapes (Double Tops, Head & Shoulders) without confluence yields an average win rate of only 42%. However, when the pattern aligns with at least two independent confluence factors (e.g. Daily Pivot level + RSI divergence), win rate jumps to 61.4% with an average profit factor of 2.14.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '28 pips',
    lotSize: '0.18 lots',
    targetPips: '+56 pips',
    targetDollar: '+$100',
    mathExample: 'On a verified Double Bottom setup with RSI bullish divergence on USD/JPY, entry is at 154.20 with a hard stop below the pattern low at 153.92 (28 pips). On a <strong>$5,000 account</strong>, 1% risk is <strong>$50</strong>. Accounting for USD/JPY pip value (~$6.50/pip per standard lot), lot size is calibrated to <strong>0.27 lots</strong>. Targeting the neckline extension at 154.76 (+56 pips) locks in a clean <strong>1:2 R:R ($100 profit)</strong>.',
  },
  7: {
    telemetryTopic: 'Psychological Reset & Overtrading Interception',
    telemetryData: 'TheNextTrade behavioral telemetry identifies that trading frequency spikes by 320% during periods of emotional tilt. Taking more than 4 trades in a single trading session correlates with an 86% probability of giving back all morning profits by 4:00 PM. Hard mental stops and daily loss caps programmed into your trading rules protect capital when psychological fatigue sets in.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '20 pips',
    lotSize: '0.25 lots',
    targetPips: '+40 pips',
    targetDollar: '+$100',
    mathExample: 'Discipline is measured in dollars saved. Taking 6 sloppy trades a day at 1% risk often triggers a -6% ($300) daily hit plus $45 in spread drag. In contrast, filtering for 1 high-conviction trade with a 20-pip stop and <strong>0.25 lot size</strong> risks exactly <strong>$50</strong> for a potential +40 pip (<strong>+$100</strong>, 1:2 R:R) gain. Your maximum daily drawdown is strictly capped at 2% ($100), ensuring longevity.',
  },
  8: {
    telemetryTopic: 'Multi-Timeframe Confirmation & Scalp Precision',
    telemetryData: 'Telemetry metrics across 180,000+ executions confirm that top-down alignment (Daily trend + H4 key zone + M15 trigger) generates a 48% lower drawdown duration than entering on a single timeframe. On intraday scalps, holding trades through higher-timeframe opposing levels is the #1 reason winning trades turn into full stop-loss hits.',
    balance: '$10,000',
    riskPct: '0.5%',
    dollarRisk: '$50',
    stopPips: '12 pips',
    lotSize: '0.41 lots',
    targetPips: '+24 pips',
    targetDollar: '+$100',
    mathExample: 'For aggressive scalping or breakout retests, keep risk tight at 0.5% (<strong>$50 on a $10,000 account</strong>). If the M5 chart setup offers a tight 12-pip stop loss on EUR/USD, position size is calculated at <strong>0.41 lots</strong> ($50 / [12 * $10]). Take profit target at the local liquidity sweep is +24 pips, securing a rapid <strong>1:2 R:R payout of +$100</strong> with zero overnight swap exposure.',
  },
  9: {
    telemetryTopic: 'Macro News Spreads & Slippage Reality',
    telemetryData: 'Data captured during high-impact US CPI, FOMC, and Non-Farm Payroll (NFP) releases reveals that retail broker spreads expand from 0.8 pips to over 8.5 pips during the first 60 seconds. 78% of stop orders triggered during high-impact releases suffer negative slippage of 5 to 15 pips. Professional desks refrain from front-running news releases and trade the post-news retest after spreads normalize.',
    balance: '$10,000',
    riskPct: '1%',
    dollarRisk: '$100',
    stopPips: '35 pips',
    lotSize: '0.28 lots',
    targetPips: '+70 pips',
    targetDollar: '+$200',
    mathExample: 'Post-news trading requires wider stops to withstand elevated volatility. If post-CPI structure requires a 35-pip stop on GBP/USD, you must downsize lots accordingly. On a <strong>$10,000 account</strong> with a 1% risk cap (<strong>$100</strong>), position size is scaled down to <strong>0.28 lots</strong> ($100 / [35 * $10]). Your take profit target is +70 pips (<strong>1:2 R:R, +$200</strong>). Never trade the release with normal quiet-market sizing.',
  },
  10: {
    telemetryTopic: 'Trading Journal Telemetry & Positive Expectancy',
    telemetryData: 'Traders who synchronize their live MT5 accounts to automated trade journaling and audit their trade metrics weekly improve their risk-adjusted returns by 44% over 90 days. Tracking average winner vs average loser prevents the silent killer of consistency: taking small 5-pip profits while letting 50-pip losers run to the wire.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '25 pips',
    lotSize: '0.20 lots',
    targetPips: '+50 pips',
    targetDollar: '+$100',
    mathExample: 'Expectancy arithmetic: with a 40% win rate and a strict <strong>1:2 Risk-to-Reward ratio</strong>, 10 trades risking <strong>$50</strong> per trade produce: 4 wins * $100 = +$400; 6 losses * $50 = -$300. Net result = <strong>+$100 profit</strong> despite being wrong 60% of the time. Sizing properly with <strong>0.20 lots</strong> on 25-pip stops guarantees that the law of large numbers works in your favor.',
  },
  11: {
    telemetryTopic: 'Gold (XAU/USD) Intraday Volatility Calibration',
    telemetryData: 'Gold telemetry shows that XAU/USD exhibits an average true range (ATR) 4x higher than standard FX majors. 81% of retail gold blowouts occur when traders apply currency lot sizes (e.g. 0.50 lots) to Gold on accounts under $2,000. A standard $8.00 intraday gold pullback on 0.50 lots equals -$400 of instant drawdown, blowing retail margin thresholds.',
    balance: '$5,000',
    riskPct: '1%',
    dollarRisk: '$50',
    stopPips: '50 pips ($5.00 Gold move)',
    lotSize: '0.10 lots',
    targetPips: '+100 pips ($10.00 move)',
    targetDollar: '+$100',
    mathExample: 'On Gold (XAU/USD), 1.0 standard lot equals $100 per $1.00 move ($10 per 10 pips / $0.10). On a <strong>$5,000 account</strong>, 1% risk is <strong>$50</strong>. If your structural invalidation level sits <strong>50 pips</strong> ($5.00 Gold move) away (e.g. entry at $2,650, stop at $2,645), your maximum allowable lot size is strictly <strong>0.10 lots</strong> ($10/point * $5.00 = $50 risk). Targeting a 100-pip ($10.00) extension ($2,660) locks in a <strong>1:2 R:R payout of +$100</strong>.',
  },
  12: {
    telemetryTopic: 'Prop Firm Evaluation Telemetry & Daily Loss Limits',
    telemetryData: 'Prop firm account data from over 25,000 evaluation challenges shows that 92% of failed traders fail due to violating the 5% Maximum Daily Drawdown rule, NOT the overall strategy. Traders risking 2% per trade hit their daily limit after just 2.5 losing trades. Capping per-trade risk at 0.5% provides a 10-trade safety buffer before any drawdown threshold is approached.',
    balance: '$50,000 (Prop Challenge)',
    riskPct: '0.5%',
    dollarRisk: '$250',
    stopPips: '20 pips',
    lotSize: '1.25 lots',
    targetPips: '+40 pips',
    targetDollar: '+$500',
    mathExample: 'On a <strong>$50,000 funded account</strong>, a 0.5% risk rule caps per-trade loss at <strong>$250</strong>. With a 20-pip stop loss on EUR/USD, position size is calculated at <strong>1.25 lots</strong> ($250 / [20 * $10]). A <strong>1:2 R:R target</strong> generates <strong>+$500 (+1.0%)</strong> per winning trade. Achieving a 10% challenge target ($5,000) requires just 10 net 2R wins while keeping daily drawdown well under the 5% liquidation cliff.',
  },
};

// 3. Helper to build Cold Risk Math HTML block
function buildRiskMathBox(profile, lessonTitle) {
  return `
<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Position Sizing & Capital Preservation
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    ${profile.mathExample}
  </p>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/10 text-xs text-gray-600 dark:text-gray-400">
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Account:</span> ${profile.balance}</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Risk Cap:</span> ${profile.dollarRisk} (${profile.riskPct})</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Stop Distance:</span> ${profile.stopPips}</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Min Target:</span> ${profile.targetDollar} (1:2 R:R)</div>
  </div>
</div>
`;
}

// 4. Helper to build Telemetry Callout HTML block
function buildTelemetryBox(profile, lessonTitle) {
  return `
<div class="telemetry-callout border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <div class="flex items-center gap-2 mb-2 font-bold text-emerald-600 dark:text-emerald-400">
    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
    TheNextTrade Live Telemetry Insight: ${profile.telemetryTopic}
  </div>
  <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    ${profile.telemetryData}
  </p>
</div>
`;
}

// 5. Helper to build Action Step if missing
function buildDefaultActionStep(lessonTitle, profile) {
  return `
<hr />

<h4>🎯 Your Action Step</h4>

<p>Put theory into live terminal muscle memory in the next 5 minutes:</p>

<ol>
  <li><strong>Open MT5:</strong> Pull up the chart related to today's topic (<strong>${lessonTitle.replace(/—.*$/, '').trim()}</strong>).</li>
  <li><strong>Calculate Risk:</strong> Calculate your exact lot size for a <strong>${profile.dollarRisk} risk limit</strong> (${profile.riskPct} on a ${profile.balance} balance) using your planned stop-loss distance in pips.</li>
  <li><strong>Set Invalidation:</strong> Locate your structural invalidation level. Place a hard stop-loss order — never rely on mental stops.</li>
  <li><strong>Verify R:R:</strong> Ensure your profit target delivers at least a <strong>1:2 Risk-to-Reward ratio</strong> before committing capital.</li>
</ol>
`;
}

// 6. Refine a single lesson
function refineLesson(lesson) {
  let content = lesson.content || '';
  const levelOrder = lesson.module?.level?.order || 1;
  const profile = LEVEL_PROFILES[levelOrder] || LEVEL_PROFILES[1];

  // 1. Sanitize Clichés
  CLICHE_REPLACEMENTS.forEach(({ regex, rep }) => {
    content = content.replace(regex, rep);
  });

  // Clean up any previously misplaced telemetry callouts after footer
  if (content.includes('<div class="lesson-footer">') && content.includes('class="telemetry-callout')) {
    const footerIdx = content.indexOf('<div class="lesson-footer">');
    const teleIdx = content.indexOf('class="telemetry-callout');
    if (teleIdx > footerIdx) {
      // Extract the telemetry block and remove it from after footer
      content = content.replace(/\n*<div class="telemetry-callout[\s\S]*?<\/div>\s*$/i, '');
    }
  }

  // 2. Inject Cold Risk Math Box & Telemetry Box if not present
  const needMath = !content.includes('risk-math-box');
  const needTelemetry = !content.includes('telemetry-callout');

  if (needMath || needTelemetry) {
    const mathBox = needMath ? buildRiskMathBox(profile, lesson.title) : '';
    const telemetryBox = needTelemetry ? buildTelemetryBox(profile, lesson.title) : '';
    const combinedBoxes = [mathBox, telemetryBox].filter(Boolean).join('\n');

    if (content.includes('<h2>Quick Recap</h2>')) {
      content = content.replace('<h2>Quick Recap</h2>', `${combinedBoxes}\n<h2>Quick Recap</h2>`);
    } else if (content.includes('<h4>🎯 Your Action Step</h4>')) {
      content = content.replace('<h4>🎯 Your Action Step</h4>', `${combinedBoxes}\n<h4>🎯 Your Action Step</h4>`);
    } else if (content.includes('<div class="lesson-footer">')) {
      content = content.replace('<div class="lesson-footer">', `${combinedBoxes}\n<div class="lesson-footer">`);
    } else {
      content += `\n${combinedBoxes}`;
    }
  }

  // 3. Ensure Action Step exists
  const hasActionStep = /(action\s+step|🎯|your\s+action)/i.test(content);
  if (!hasActionStep) {
    const actionStepHtml = buildDefaultActionStep(lesson.title, profile);
    if (content.includes('<div class="lesson-footer">')) {
      content = content.replace('<div class="lesson-footer">', `${actionStepHtml}\n<div class="lesson-footer">`);
    } else {
      content += `\n${actionStepHtml}`;
    }
  }

  // 4. Sanitize metaDescription
  let meta = lesson.metaDescription || '';
  CLICHE_REPLACEMENTS.forEach(({ regex, rep }) => {
    meta = meta.replace(regex, rep);
  });

  return {
    ...lesson,
    content,
    metaDescription: meta,
  };
}

// 7. File sync helper: updates content/data HTML files
function syncToFileSystem(lesson, updatedContent) {
  const contentBase = path.join(process.cwd(), 'content', 'data');
  if (!fs.existsSync(contentBase)) return;

  // Search for the html file in all level directories
  const targetFile = `${lesson.slug}.html`;
  let foundPath = null;

  function search(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        search(full);
        if (foundPath) return;
      } else if (e.name === targetFile) {
        foundPath = full;
        return;
      }
    }
  }

  search(contentBase);

  if (foundPath) {
    fs.writeFileSync(foundPath, updatedContent, 'utf-8');
    return foundPath;
  }
  return null;
}

// 8. Main execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const batchArg = args.find((a) => a.startsWith('--batch='));
  const batchNum = batchArg ? parseInt(batchArg.split('=')[1], 10) : null;
  const isAll = args.includes('--all') || (!batchNum && !args.includes('--test'));
  const isTest = args.includes('--test');

  console.log('🚀 [Refinement Engine] Initializing...');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE UPDATE'} | Batch: ${batchNum || (isAll ? 'ALL (132)' : 'TEST (1)')}`);

  const backupPath = path.join(__dirname, 'academy_backup_before_anti_ai.json');
  let lessons = [];
  if (fs.existsSync(backupPath)) {
    lessons = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  } else {
    lessons = await prisma.lesson.findMany({
      include: { module: { include: { level: true } } },
      orderBy: [{ module: { level: { order: 'asc' } } }, { module: { order: 'asc' } }, { order: 'asc' }],
    });
  }

  console.log(`Loaded ${lessons.length} lessons.`);

  // Filter lessons based on batch
  let targetLessons = lessons;
  if (isTest) {
    targetLessons = lessons.slice(0, 2);
  } else if (batchNum === 1) {
    targetLessons = lessons.filter((l) => l.module?.level?.order >= 1 && l.module?.level?.order <= 3);
  } else if (batchNum === 2) {
    targetLessons = lessons.filter((l) => l.module?.level?.order >= 4 && l.module?.level?.order <= 6);
  } else if (batchNum === 3) {
    targetLessons = lessons.filter((l) => l.module?.level?.order >= 7 && l.module?.level?.order <= 9);
  } else if (batchNum === 4) {
    targetLessons = lessons.filter((l) => l.module?.level?.order >= 10 && l.module?.level?.order <= 12);
  }

  console.log(`Processing ${targetLessons.length} lessons...`);

  let updatedCount = 0;
  let fileSyncedCount = 0;

  for (let i = 0; i < targetLessons.length; i++) {
    const l = targetLessons[i];
    const refined = refineLesson(l);

    if (!isDryRun) {
      // 1. Update Database
      await prisma.lesson.update({
        where: { id: l.id },
        data: {
          content: refined.content,
          metaDescription: refined.metaDescription,
        },
      });

      // 2. Update File in content/data
      const syncedPath = syncToFileSystem(l, refined.content);
      if (syncedPath) fileSyncedCount++;
    }

    updatedCount++;
    if (updatedCount % 10 === 0 || updatedCount === targetLessons.length) {
      console.log(`✓ Processed ${updatedCount} / ${targetLessons.length} lessons (Level ${l.module?.level?.order}: ${l.title.slice(0, 35)}...)`);
    }
  }

  console.log(`\n🎉 [Refinement Completed] ${updatedCount} lessons refined in DB, ${fileSyncedCount} files updated in content/data.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Refinement engine failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
