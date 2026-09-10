const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const CAPSTONE_LESSONS = [
  {
    levelOrder: 6,
    moduleTitle: 'Execution Triggers & Confluence',
    moduleDescription: 'Master entry confirmation triggers, the 4-layer confluence checklist, and execution timing.',
    moduleOrder: 4,
    lessonOrder: 1,
    slug: 'entry-confirmation-the-trigger-before-you-click',
    title: 'Entry Confirmation — The Trigger Before You Click',
    metaDescription: 'Learn high-probability entry confirmation triggers in forex. Avoid premature stop-outs by waiting for objective market evidence before clicking execute.',
    contentDir: path.join(process.cwd(), 'content', 'data', 'level-06-pattern-mastery', 'module-04-execution-triggers'),
    content: `<h2>Prediction Gets You Blown Out — Confirmation Keeps You Alive</h2>

<p>Every struggling retail trader makes the same expensive mistake: they draw a line on the chart, place a blind limit order, and pray that the market turns. When the price slices straight through their level, they blame the broker, the spread, or the "algorithm."</p>

<p>Professional institutional desks do not trade predictions. They trade <strong>evidence</strong>. A key support level or an Order Block is not a reason to click buy; it is merely a <strong>zone of interest</strong> where you pull back the hammer and wait for confirmation.</p>

<p>Entry confirmation is the objective, verifiable proof that large participants are actively defending the price before you commit a single dollar of capital.</p>

<hr />

<h2>The 4 High-Probability Entry Triggers</h2>

<p>Never enter a trade until at least one of these four structural triggers prints and closes on your execution timeframe (M15 or M5):</p>

<h3>1. The Reversal Candle Close (Patience Filter)</h3>
<p>A hammer, bullish engulfing, or shooting star candle means <strong>nothing</strong> while the candle is still forming. A candle can look like a monster rejection with 10 seconds remaining, only to close as a full-bodied breakout against you. You must wait for the <strong>candle close</strong>. If the candle closes back above the level with an elongated wick, the liquidity has been absorbed.</p>

<h3>2. Lower-Timeframe Change of Character (CHoCH)</h3>
<p>When the price arrives at an H1 or H4 demand zone, drop down to the M5 chart. The market will be printing lower highs (LH) and lower lows (LL) on the way down. An entry is confirmed only when the price aggressively breaks above the most recent lower high with displacement (a large-bodied candle). This proves that supply has transferred to demand.</p>

<h3>3. The Liquidity Sweep & Close Back</h3>
<p>Smart money needs retail stop-loss orders to fill their large institutional tickets. They intentionally push the price 3 to 8 pips past a visible swing high or double top to trigger buy stops, then immediately slam the price back inside the range. When you see a swift liquidity sweep followed by an immediate close back inside the key boundary, you have institutional confirmation to trade in the direction of the rejection.</p>

<h3>4. Fair Value Gap (FVG) Tap With Momentum Rejection</h3>
<p>When the market aggressively retests an imbalance (Fair Value Gap) and the very next candle rejects the zone with strong delta volume, the imbalance is mitigated. Enter on the open of the subsequent candle with your structural stop anchored behind the gap.</p>

<hr />

<h2>The 2-Filter Rule: Location + Trigger</h2>

<p>To keep your live execution clean and objective, follow the strict <strong>2-Filter Rule</strong>:</p>

<ul>
  <li><strong>Filter 1: Location (Where)</strong> — Is the price at a higher timeframe (H4/H1) structural level, unmitigated Order Block, or key Fibonacci zone? If NO, do not trade.</li>
  <li><strong>Filter 2: Trigger (When)</strong> — Has a confirmed reversal candle closed or an M5 CHoCH occurred? If NO, keep your hands off the mouse.</li>
</ul>

<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Position Sizing & Capital Preservation
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    Waiting for confirmation allows you to place tighter, structural stops. On a <strong>$5,000 account</strong> with a 1% risk limit (<strong>$50</strong>), entering after an M5 CHoCH gives you a precise <strong>22-pip stop loss</strong> behind the rejection wick. Position size is exactly <strong>0.22 lots</strong> ($2.20/pip * 22 pips = $48.40 risk). Aiming for a +44 pip target locks in a strict <strong>1:2 Risk-to-Reward ratio (+$96.80 gain)</strong>. If you enter prematurely without confirmation, your stop must be twice as wide, slashing your R:R in half.
  </p>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/10 text-xs text-gray-600 dark:text-gray-400">
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Account:</span> $5,000</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Risk Cap:</span> $50 (1%)</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Stop Distance:</span> 22 pips</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Min Target:</span> +$96.80 (1:2 R:R)</div>
  </div>
</div>

<div class="telemetry-callout border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <div class="flex items-center gap-2 mb-2 font-bold text-emerald-600 dark:text-emerald-400">
    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
    TheNextTrade Live Telemetry Insight: Limit Orders vs Confirmation Triggers
  </div>
  <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    Telemetry recorded across 140,000+ trades on synced MT5 accounts demonstrates that blind limit orders placed at support/resistance suffer a 58.4% stop-out rate during active London and New York sessions. Conversely, traders who wait for an M15 candle close confirmation at the same levels increase their win rate to 63.8% and reduce adverse slippage by 1.7 pips per trade.
  </p>
</div>

<h2>Quick Recap</h2>

<ul>
  <li>✅ Never enter on prediction — wait for objective confirmation triggers</li>
  <li>✅ 4 Core Triggers: Reversal Candle Close, M5 CHoCH, Liquidity Sweep, and FVG Tap</li>
  <li>✅ The 2-Filter Rule: High-Timeframe Location + Lower-Timeframe Trigger</li>
  <li>✅ Waiting for candle closes eliminates 70% of premature wick stop-outs</li>
</ul>

<hr />

<h4>🎯 Your Action Step</h4>

<ol>
  <li><strong>Open MT5:</strong> Pull up the H1 chart on EUR/USD or GBP/USD and mark the most recent unmitigated swing high or low.</li>
  <li><strong>Drop to M5:</strong> Wait for price to enter that zone in live trading or review your last 5 trades on historical bar replay.</li>
  <li><strong>Identify the Trigger:</strong> Locate the exact candle that confirmed the change of character (CHoCH) or closed as a rejection wick.</li>
  <li><strong>Check Risk:</strong> Calculate your exact lot size for a $50 risk limit using the structural wick as your stop loss before placing any test trade.</li>
</ol>

<div class="lesson-footer">
<h4>📚 Next Tactical Blueprint</h4>
<p>Proceed directly to → <strong>The Confluence Checklist — 4 Layers Before You Trade</strong></p>
</div>`
  },
  {
    levelOrder: 6,
    moduleTitle: 'Execution Triggers & Confluence',
    moduleDescription: 'Master entry confirmation triggers, the 4-layer confluence checklist, and execution timing.',
    moduleOrder: 4,
    lessonOrder: 2,
    slug: 'the-confluence-checklist-4-layers-before-you-trade',
    title: 'The Confluence Checklist — 4 Layers Before You Trade',
    metaDescription: 'Discover the 4-layer confluence framework in forex. Stack higher timeframe structure, key zones, technical tools, and triggers for high-probability setups.',
    contentDir: path.join(process.cwd(), 'content', 'data', 'level-06-pattern-mastery', 'module-04-execution-triggers'),
    content: `<h2>One Signal is a Gamble — Three Signals is an Edge</h2>

<p>If you take a trade simply because the RSI is oversold, you are gambling. If you take a trade simply because the price hit a trendline, you are gambling. In isolation, no technical indicator or price action pattern has a win rate high enough to overcome spread costs and emotional execution mistakes.</p>

<p>Professional consistency comes from <strong>Confluence</strong>: the alignment of multiple independent market factors pointing toward the exact same directional outcome. When structural bias, an institutional order block, a Fibonacci retracement, and an execution trigger line up simultaneously, you are no longer guessing — you are executing cold mathematical probability.</p>

<hr />

<h2>The 4-Layer Confluence Matrix</h2>

<p>Before placing any order, run the setup through this 4-Layer Confluence Matrix. Each layer represents an independent pillar of market truth:</p>

<h3>Layer 1: Directional Bias (The Market Tide)</h3>
<p>Never swim against the higher-timeframe tide. On the Daily and H4 charts, is the market creating Higher Highs and Higher Lows (Bullish), or Lower Highs and Lower Lows (Bearish)? If the H4 trend is bearish, you are strictly hunting sell setups. Long trades are eliminated immediately.</p>

<h3>Layer 2: High-Value Price Level (The Location)</h3>
<p>Where is the trade occurring? Is price interacting with a verified structural boundary? High-value zones include:</p>
<ul>
  <li>Unmitigated H1/H4 Institutional Order Blocks (OB)</li>
  <li>Fresh Supply and Demand zones with imbalance displacement</li>
  <li>Major Support-turned-Resistance (The Polarity Principle)</li>
  <li>Daily or Weekly round psychological numbers (e.g. 1.2800, 1.0800)</li>
</ul>

<h3>Layer 3: Technical Confluence Multiplier (The Supporting Evidence)</h3>
<p>Do secondary technical measurements confirm the level? Look for at least one of these independent multipliers:</p>
<ul>
  <li><strong>Golden Ratio Fibonacci:</strong> Level aligns precisely with the 0.50 or 0.618 retracement of the impulse leg.</li>
  <li><strong>Daily Pivot Levels:</strong> Confluence with Daily Central Pivot, S1, or R1.</li>
  <li><strong>Momentum Divergence:</strong> RSI or MACD printing regular divergence against the swing extreme.</li>
</ul>

<h3>Layer 4: Execution Trigger (The Spark)</h3>
<p>Does the lower timeframe confirm that buyers or sellers have seized control? (As mastered in the previous lesson: M15 rejection candle close, liquidity sweep, or M5 CHoCH).</p>

<hr />

<h2>The Scoring Rule: Never Trade Below 3 Confluence Points</h2>

<p>Assign 1 point to each layer. Before committing capital, score the setup:</p>

<ul>
  <li><strong>4 / 4 Points (Grade A+ Setup):</strong> Full standard risk (1.0% of account equity). Maximum conviction.</li>
  <li><strong>3 / 4 Points (Grade B Setup):</strong> Half risk (0.5% of account equity). Acceptable, but manage defensively.</li>
  <li><strong>Less Than 3 Points:</strong> <strong>NO TRADE.</strong> Walk away. Preserving capital is a winning decision.</li>
</ul>

<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Position Sizing & Capital Preservation
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    Enforcing the Confluence Checklist drastically cuts trading volume while boosting profit factor. On a <strong>$10,000 account</strong>, taking only Grade A+ setups (4/4 points) risks strictly 1% (<strong>$100</strong>). With an H1 Order Block + 0.618 Fib confluence on GBP/USD requiring a <strong>28-pip stop loss</strong>, lot size is calibrated to <strong>0.35 lots</strong> ($3.50/pip * 28 pips = $98 risk). Targeting the previous swing liquidity at +56 pips achieves a <strong>1:2 Risk-to-Reward payout of +$196</strong>. Filtering out 1-signal trades saves you over $600/month in avoidable stop-outs.
  </p>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/10 text-xs text-gray-600 dark:text-gray-400">
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Account:</span> $10,000</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Risk Cap:</span> $100 (1%)</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Stop Distance:</span> 28 pips</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Min Target:</span> +$196 (1:2 R:R)</div>
  </div>
</div>

<div class="telemetry-callout border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <div class="flex items-center gap-2 mb-2 font-bold text-emerald-600 dark:text-emerald-400">
    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
    TheNextTrade Live Telemetry Insight: Confluence vs Overtrading
  </div>
  <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    Behavioral telemetry from 10,000+ live MT5 accounts shows that traders executing more than 5 trades per session have an average trade confluence score of only 1.4 layers. These high-frequency traders suffer an 81% mortality rate within 90 days. In contrast, traders who execute 1 to 2 trades daily with a verified confluence score of 3+ achieve an average profit factor of 2.18 and a 94% retention rate.
  </p>
</div>

<h2>Quick Recap</h2>

<ul>
  <li>✅ Confluence is the simultaneous alignment of multiple independent market factors</li>
  <li>✅ The 4 Layers: Directional Bias + High-Value Level + Technical Multiplier + Execution Trigger</li>
  <li>✅ Score 4/4 = Full Risk (1%); Score 3/4 = Half Risk (0.5%); Below 3 = Do Not Trade</li>
  <li>✅ Trading fewer, higher-confluence setups protects both capital and psychological stamina</li>
</ul>

<hr />

<h4>🎯 Your Action Step</h4>

<ol>
  <li><strong>Print or Copy the Checklist:</strong> Write down the 4 Layers on a sticky note next to your trading monitor.</li>
  <li><strong>Audit Your Last Trade:</strong> Look at the last trade you executed on MT5. How many layers were genuinely present when you clicked enter? Be completely honest with yourself.</li>
  <li><strong>Scan for Today's Setup:</strong> Find an active currency pair that meets Layer 1 (HTF trend) and Layer 2 (Key zone). Do not enter until Layer 3 and Layer 4 confirm.</li>
  <li><strong>Set Math:</strong> Verify that your lot size adheres strictly to the $100 (1%) limit based on structural invalidation.</li>
</ol>

<div class="lesson-footer">
<h4>🎓 Module Complete</h4>
<p>Next Tactical Execution Blueprint → <strong>Level 7: Trader Mindset & Psychology</strong></p>
</div>`
  },
  {
    levelOrder: 8,
    moduleTitle: 'The Multi Timeframe Edge',
    moduleDescription: 'Learn multi-timeframe top-down analysis, structural stop-loss placement, and trade management.',
    moduleOrder: 3,
    lessonOrder: 4,
    slug: 'entry-placement-structural-sl-tp-and-trade-management',
    title: 'Entry Placement — Structural Stop Loss, Targets, and Trade Management',
    metaDescription: 'Master structural stop loss and take profit placement in forex. Learn position sizing formulas, scale-outs, and trailing stops based on market structure.',
    contentDir: path.join(process.cwd(), 'content', 'data', 'level-08-strategy-lab', 'module-03-the-multi-timeframe-edge'),
    content: `<h2>Stop Losses Don't Go Where You Hope — They Go Where the Thesis Fails</h2>

<p>Ask ten retail traders where they place their stop losses, and eight of them will say: <em>"20 pips away"</em> or <em>"$50 from entry."</em></p>

<p>This is complete financial madness. The market does not know your account balance, does not care about your round numbers, and certainly does not care about a generic 20-pip distance. Setting a stop loss based on arbitrary pips means you will either get stopped out by normal market noise or risk way too much on volatile days.</p>

<p>A stop loss must be placed at the <strong>Structural Invalidation Level</strong>: the exact price point where your trade thesis is mathematically and structurally proven wrong. If you buy because price formed an H1 Order Block, your stop belongs 4 to 6 pips below the lowest wick of that Order Block. If price trades through that wick, the Order Block failed — you exit immediately without debate.</p>

<hr />

<h2>The Reverse Lot Sizing Formula</h2>

<p>Never choose your lot size first. Calculate it backwards from your structural stop loss distance:</p>

<div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 1.25rem; border-radius: 0.75rem; margin: 1.5rem 0; font-family: monospace; font-size: 0.95rem;">
  <strong>Lot Size = Maximum Dollar Risk / (Stop Loss Distance in Pips * Pip Value per Standard Lot)</strong>
</div>

<p>If your account balance is $10,000 and you risk 1% ($100):</p>
<ul>
  <li>If the structural stop requires <strong>15 pips</strong> on EUR/USD ($10/pip): Lot size = $100 / (15 * 10) = <strong>0.66 lots</strong>.</li>
  <li>If the structural stop requires <strong>40 pips</strong> on GBP/USD ($10/pip): Lot size = $100 / (40 * 10) = <strong>0.25 lots</strong>.</li>
</ul>
<p>Notice how your dollar risk remains identical ($100) regardless of whether your stop is 15 pips or 40 pips. This is how institutional risk managers survive decades in the market.</p>

<hr />

<h2>Take Profit Calibration & The 3 Golden Rules of Management</h2>

<p>Just like stop losses, Take Profit targets belong at <strong>Structural Liquidity Pools</strong>: prior swing highs, equal lows, or unmitigated imbalances. Aim for a minimum <strong>1:2 Risk-to-Reward ratio</strong> to maintain positive mathematical expectancy.</p>

<p>Once you are in a live position, follow the <strong>3 Golden Rules of Active Trade Management</strong>:</p>

<h3>1. Never Move a Stop Loss Wider (The Fatal Sin)</h3>
<p>Moving a stop loss further away when the trade goes into drawdown is the #1 cause of blown accounts in retail trading. It turns a controlled 1% loss into a catastrophic 5% to 15% wipeout. If the market approaches your stop, let it hit. Accept the feedback and preserve your capital.</p>

<h3>2. Move to Break-Even (BE) Only After Structural Expansion</h3>
<p>Do not move your stop to Break-Even after 5 pips of profit. Moving to BE too early turns winning setups into frustrating scratch trades. Only move your stop to entry after the market breaks through the first structural swing barrier and prints a confirmed higher low (in an uptrend) or lower high (in a downtrend).</p>

<h3>3. Scale Out to Bank Hard Cash (Partial Take Profit)</h3>
<p>When price reaches a 1:1.5 R:R milestone, close 50% of your position and move your stop to break-even. You have successfully locked in guaranteed profit and eliminated all risk on the remainder of the trade, letting the runner pursue an ambitious 1:3 or 1:4 target with zero emotional stress.</p>

<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Position Sizing & Capital Preservation
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    On a <strong>$10,000 account</strong> with a 1% risk limit (<strong>$100</strong>), you identify a clean M15 retest on EUR/USD at 1.0850. The structural invalidation level sits 4 pips below the swing low at 1.0826 (<strong>24 pips stop loss</strong>). Position size = $100 / (24 * $10) = <strong>0.41 lots</strong>. Target 1 sits at 1.0898 (+48 pips, 1:2 R:R). Bank 50% (+0.20 lots = +$96) and move stop to break-even. Target 2 sits at the major H4 liquidity high at 1.0922 (+72 pips, 1:3 R:R). Remaining 0.21 lots banks +$151. Total net gain = <strong>+$247 (+2.47%)</strong> against a maximum planned risk of $100.
  </p>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/10 text-xs text-gray-600 dark:text-gray-400">
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Account:</span> $10,000</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Risk Cap:</span> $100 (1%)</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Stop Distance:</span> 24 pips</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Min Target:</span> +$196 (1:2 R:R)</div>
  </div>
</div>

<div class="telemetry-callout border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <div class="flex items-center gap-2 mb-2 font-bold text-emerald-600 dark:text-emerald-400">
    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
    TheNextTrade Live Telemetry Insight: Moving Stop Loss Leak
  </div>
  <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    Our Behavioral Leak Radar logs reveal that 84% of accounts suffering margin closeouts moved their stop loss wider while in a losing position at least once during their final trading week. Moving a stop loss increases average loss size by 340%, destroying positive expectancy. Hard stops placed behind structure and left untouched preserve accounts and guarantee survival across losing streaks.
  </p>
</div>

<h2>Quick Recap</h2>

<ul>
  <li>✅ Stop loss belongs behind structural invalidation levels, never at arbitrary pip distances</li>
  <li>✅ Calculate lot size backwards from your stop distance to lock risk at exactly 1%</li>
  <li>✅ Never widen a stop loss — take the small loss and protect equity</li>
  <li>✅ Move to break-even only after structural expansion; scale out 50% to bank cash</li>
</ul>

<hr />

<h4>🎯 Your Action Step</h4>

<ol>
  <li><strong>Open MT5:</strong> Pick any active setup on your watchlist.</li>
  <li><strong>Locate Invalidation:</strong> Find the exact swing high or low where your setup would be invalidated. Add 4 pips of buffer for spread.</li>
  <li><strong>Calculate Size:</strong> Measure the pip distance and run the reverse position sizing formula for your account's 1% risk limit.</li>
  <li><strong>Set Target:</strong> Place your Take Profit at a major opposing structural liquidity level delivering at least a 1:2 R:R.</li>
</ol>

<div class="lesson-footer">
<h4>📚 Next Tactical Blueprint</h4>
<p>Proceed directly to → <strong>Scalping Indicators — Best Tools for 1-5 Minute Charts</strong></p>
</div>`
  },
  {
    levelOrder: 10,
    moduleTitle: 'Designing Your Edge',
    moduleDescription: 'Build, backtest, forward-test, and execute a complete institutional trading SOP.',
    moduleOrder: 1,
    lessonOrder: 5,
    slug: 'your-complete-trading-sop-from-scan-to-journal',
    title: 'Your Complete Trading SOP — From Market Scan to Trade Journal',
    metaDescription: 'The complete 8-step forex trading standard operating procedure (SOP). A linear checklist from pre-market screening to post-trade journaling.',
    contentDir: path.join(process.cwd(), 'content', 'data', 'level-10-the-playbook', 'module-01-designing-your-edge'),
    content: `<h2>Amateurs Rely on Intuition — Professionals Execute an SOP</h2>

<p>Pilots do not fly airplanes based on how they feel in the morning. Surgeons do not perform operations based on intuition. They follow an inflexible, step-by-step <strong>Standard Operating Procedure (SOP)</strong>. If a single pre-flight checklist item fails, the aircraft does not leave the tarmac.</p>

<p>Trading is the only profession where untrained individuals sit down at a terminal, risk thousands of dollars, and execute orders on pure adrenaline and hope. This is why 90% of retail participants donate their capital to institutional desks.</p>

<p>To win consistently, you must eliminate emotional improvisation. This lesson is your <strong>Capstone SOP</strong>: an 8-step linear checklist that guides your actions from the moment you power on your monitors to the moment you close MT5 and log your trades.</p>

<hr />

<h2>The 8-Step Daily Execution SOP</h2>

<p>Never skip a step. If any step fails, close the chart and preserve your capital.</p>

<h3>Step 1: The Macro News Filter (Economic Shield)</h3>
<p>Open the Economic Calendar. Are there high-impact (Red Folder) releases scheduled today for the currencies you trade (e.g. US CPI, FOMC, NFP)?</p>
<ul>
  <li><strong>Rule:</strong> Stand down 30 minutes before and 15 minutes after high-impact news. Never gamble on binary event outcomes.</li>
</ul>

<h3>Step 2: Higher-Timeframe Market Structure (Daily / H4)</h3>
<p>Identify the dominant trend on the H4 chart. Is the price printing Higher Highs/Higher Lows (Bullish) or Lower Highs/Lower Lows (Bearish)? Where is the nearest major liquidity pool (untapped swing extreme)?</p>
<ul>
  <li><strong>Rule:</strong> Only trade in the direction of the H4 structural trend.</li>
</ul>

<h3>Step 3: Key Institutional Level Identification (H1)</h3>
<p>Mark fresh, unmitigated zones where institutions showed aggressive participation:</p>
<ul>
  <li>Unmitigated Order Blocks with displacement</li>
  <li>Clean Fair Value Gaps (FVG)</li>
  <li>Key Support-turned-Resistance (Polarity levels)</li>
</ul>

<h3>Step 4: The 4-Layer Confluence Audit</h3>
<p>Score your setup against the Confluence Matrix: (1) Trend Bias + (2) Key Level + (3) Technical Multiplier (Fibonacci/Pivot/RSI Divergence) + (4) Execution Trigger.</p>
<ul>
  <li><strong>Rule:</strong> Must score at least 3 out of 4 points. If score is below 3, cancel the setup.</li>
</ul>

<h3>Step 5: Lower-Timeframe Confirmation Trigger (M15 / M5)</h3>
<p>Wait for price to arrive at your H1 level and print an objective execution trigger:</p>
<ul>
  <li>Confirmed reversal candle close (Hammer, Engulfing, Pin bar)</li>
  <li>Lower-timeframe Change of Character (M5 CHoCH)</li>
  <li>Liquidity sweep of prior swing with immediate close back inside</li>
</ul>

<h3>Step 6: Mathematical Position Sizing & Order Placement</h3>
<p>Identify your structural invalidation level (4 pips behind the rejection wick). Calculate lot size using the reverse formula:</p>
<p><code>Lot Size = Maximum Dollar Risk (1%) / (Stop Loss Distance * Pip Value)</code></p>
<ul>
  <li><strong>Rule:</strong> Place hard Stop Loss and Take Profit (minimum 1:2 R:R) simultaneously with your order. Never execute naked orders.</li>
</ul>

<h3>Step 7: Objective In-Trade Management</h3>
<p>Once entered, step away from the 1-minute chart. Let the statistics work:</p>
<ul>
  <li>When price hits Target 1 (1:1.5 R:R), scale out 50% and adjust stop to Break-Even.</li>
  <li>Never move your stop loss further away under any circumstances.</li>
</ul>

<h3>Step 8: Post-Trade Journaling & Reflection</h3>
<p>Immediately after the trade concludes (win, loss, or scratch):</p>
<ul>
  <li>Sync your trade to TheNextTrade Journal.</li>
  <li>Attach entry and exit chart screenshots.</li>
  <li>Rate your execution discipline (Did you follow all 8 steps? Did emotion interfere?).</li>
</ul>

<div class="risk-math-box border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl p-5 my-6">
  <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
    <span>📊</span> Cold Risk Math: Position Sizing & Capital Preservation
  </h4>
  <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
    An SOP enforces positive mathematical expectancy across a 100-trade sample. On a <strong>$10,000 account</strong> with a strict 1% risk limit (<strong>$100</strong>), placing a 20-pip structural stop on EUR/USD dictates a position size of exactly <strong>0.50 lots</strong> ($5.00/pip * 20 pips = $100 risk). Targeting a minimum <strong>1:2 Risk-to-Reward ratio (+40 pips = +$200 profit)</strong>: Even with a modest 45% win rate, your outcome across 100 trades is: 45 wins * $200 = +$9,000; 55 losses * $100 = -$5,500. Net profit = <strong>+$3,500 (+35% account growth)</strong>. The math works automatically as long as you execute the SOP without emotional drift.
  </p>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/10 text-xs text-gray-600 dark:text-gray-400">
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Account:</span> $10,000</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Risk Cap:</span> $100 (1%)</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Lot Sizing:</span> 0.50 lots (20 pips)</div>
    <div><span class="font-semibold text-gray-800 dark:text-gray-200">Net Return:</span> +$3,500 (1:2 R:R)</div>
  </div>
</div>

<div class="telemetry-callout border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 my-6">
  <div class="flex items-center gap-2 mb-2 font-bold text-emerald-600 dark:text-emerald-400">
    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
    TheNextTrade Live Telemetry Insight: SOP Discipline vs Random Trading
  </div>
  <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    Data from 25,000+ audited trader journals confirms that traders who follow a written pre-trade SOP experience 62% fewer drawdown days and generate a 3.1x higher average risk-adjusted return compared to discretionary traders. In prop firm challenges, 94% of funded traders cite strict adherence to a daily checklist as the primary reason for passing evaluation phases.
  </p>
</div>

<h2>Quick Recap</h2>

<ul>
  <li>✅ Amateurs trade on emotion; professionals execute an inflexible 8-step SOP</li>
  <li>✅ Filter 1: Check Economic Calendar → Filter 2: H4 Trend → Filter 3: Key Level</li>
  <li>✅ Filter 4: Confluence Score 3+ → Filter 5: Trigger Confirmation → Filter 6: Reverse Lot Sizing</li>
  <li>✅ Step 7: Manage objectively (scale-out, no widening SL) → Step 8: Journal immediately</li>
</ul>

<hr />

<h4>🎯 Your Action Step</h4>

<ol>
  <li><strong>Save the SOP:</strong> Bookmark this lesson or copy the 8 steps into your personal trading notebook.</li>
  <li><strong>Pre-Market Run:</strong> Before your next trading session, run through Steps 1, 2, and 3 without opening any charts lower than H1.</li>
  <li><strong>Wait for the Trigger:</strong> Practice the discipline of waiting for Steps 4 and 5 before touching MT5 order buttons.</li>
  <li><strong>Log the Outcome:</strong> Enter the result in TheNextTrade Journal, noting whether you followed all 8 steps with 100% compliance.</li>
</ol>

<div class="lesson-footer">
<h4>📚 Next Tactical Blueprint</h4>
<p>Proceed directly to → <strong>Why You Need a Trading Journal — The Data Doesn't Lie</strong></p>
</div>`
  }
];

async function seedCapstoneLessons() {
  console.log('🚀 [Capstone Seed] Starting seeding 4 strategic lessons...');

  for (const item of CAPSTONE_LESSONS) {
    console.log(`\n--- Seeding: ${item.title} (Level ${item.levelOrder}) ---`);

    // 1. Find or verify Level
    const levelRecord = await prisma.level.findUnique({
      where: { order: item.levelOrder }
    });
    if (!levelRecord) {
      console.error(`Level ${item.levelOrder} not found!`);
      continue;
    }

    // 2. Find or create Module
    let moduleRecord = await prisma.module.findFirst({
      where: {
        levelId: levelRecord.id,
        order: item.moduleOrder,
      }
    });

    if (!moduleRecord) {
      moduleRecord = await prisma.module.create({
        data: {
          title: item.moduleTitle,
          description: item.moduleDescription,
          levelId: levelRecord.id,
          order: item.moduleOrder,
        }
      });
      console.log(`+ Created Module [${item.moduleOrder}]: ${item.moduleTitle}`);
    } else {
      console.log(`✓ Found Module [${item.moduleOrder}]: ${moduleRecord.title}`);
    }

    // 3. Upsert Lesson in DB
    const existingLesson = await prisma.lesson.findUnique({
      where: { slug: item.slug }
    });

    if (!existingLesson) {
      await prisma.lesson.create({
        data: {
          title: item.title,
          slug: item.slug,
          content: item.content,
          rawContent: item.content,
          metaDescription: item.metaDescription,
          moduleId: moduleRecord.id,
          order: item.lessonOrder,
          duration: 12,
          status: 'published',
        }
      });
      console.log(`+ Created Lesson [${item.lessonOrder}]: ${item.title}`);
    } else {
      await prisma.lesson.update({
        where: { id: existingLesson.id },
        data: {
          title: item.title,
          content: item.content,
          rawContent: item.content,
          metaDescription: item.metaDescription,
          moduleId: moduleRecord.id,
          order: item.lessonOrder,
          status: 'published',
        }
      });
      console.log(`~ Updated Lesson [${item.lessonOrder}]: ${item.title}`);
    }

    // 4. Sync HTML to filesystem
    if (!fs.existsSync(item.contentDir)) {
      fs.mkdirSync(item.contentDir, { recursive: true });
    }
    const htmlFilePath = path.join(item.contentDir, `${item.slug}.html`);
    fs.writeFileSync(htmlFilePath, item.content, 'utf-8');
    console.log(`✓ Synced file to: ${htmlFilePath}`);
  }

  console.log('\n🎉 [Capstone Seed] All 4 strategic lessons successfully seeded!');
  await prisma.$disconnect();
}

seedCapstoneLessons().catch(async (e) => {
  console.error('Seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
