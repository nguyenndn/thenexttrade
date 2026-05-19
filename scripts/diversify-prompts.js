const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'featured-images-to-generate.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// ============================================================
// STYLE PALETTES — each category gets a unique visual identity
// ============================================================
const styles = {
  brokers: `**Style & Composition:** Clean, trustworthy fintech aesthetic. Light gradient background transitioning from soft white to pale blue-gray. Accent colors: deep navy blue and emerald green for trust signals. Include subtle shield/checkmark motifs, comparison table elements, and clean typography. The feel should be corporate, authoritative, and reassuring — like a premium financial comparison platform.`,

  technical_indicators: `**Style & Composition:** Data-rich analytical aesthetic. Deep navy blue background with vibrant electric blue and cyan data visualizations. Include glowing chart lines, oscillator waves, and flowing data streams. The feel should be precise, mathematical, and institutional — like a Bloomberg terminal rendered as modern art.`,

  chart_patterns: `**Style & Composition:** Elegant pattern-recognition aesthetic. Rich dark teal background with warm amber and soft gold geometric shapes forming chart patterns. Include subtle candlestick formations, trendlines, and symmetrical geometric structures. The feel should be educational, clean, and visually satisfying — like an architect's blueprint for market movements.`,

  price_action: `**Style & Composition:** Bold, high-contrast price action aesthetic. Gradient background from charcoal to deep indigo. Accent with sharp white candlestick silhouettes, neon green for bullish and soft red for bearish. Include raw price movement visualizations and clean market structure. The feel should be raw, authentic, and powerful — like reading the market's heartbeat directly.`,

  risk_management: `**Style & Composition:** Protective, shield-centric aesthetic. Gradient background from dark slate to warm amber-bronze. Include visual metaphors of shields, safety nets, and protective barriers. Accent colors: amber gold for caution and deep green for security. The feel should be serious, grounded, and protective — like a fortress guarding your capital.`,

  psychology: `**Style & Composition:** Introspective, human-centric aesthetic. Soft gradient background from deep purple to warm rose-gold. Include abstract neural pathway visualizations, brain-wave patterns, and emotional spectrum elements. Accent colors: soft violet, warm coral, and mindful teal. The feel should be contemplative, personal, and transformative — like a journey into the trader's mind.`,

  fundamentals: `**Style & Composition:** Institutional macro-economic aesthetic. Rich gradient from midnight navy to dark forest green. Include abstract representations of economic data flows, global currency symbols, and central bank motifs. Accent colors: presidential gold and crisp white. The feel should be authoritative, global, and sophisticated — like a Wall Street research report cover.`,

  strategies: `**Style & Composition:** Dynamic, action-oriented strategy aesthetic. Vibrant gradient from deep ocean blue to electric violet. Include flowing arrows, momentum trails, and strategic grid patterns. Accent colors: bright cyan for entries, warm orange for targets. The feel should be energetic, precise, and methodical — like a military operation planned to perfection.`,

  beginner_basics: `**Style & Composition:** Welcoming, educational aesthetic. Clean gradient from soft sky blue to warm cream white. Include friendly geometric shapes, step-by-step pathway visualizations, and clear iconography. Accent colors: warm coral orange and calm sage green. The feel should be approachable, clear, and encouraging — like a friendly mentor guiding your first steps.`,

  market_analysis: `**Style & Composition:** Panoramic, multi-dimensional market view aesthetic. Rich gradient from deep sapphire blue to royal purple. Include globe visualizations, interconnected market nodes, and flowing data ribbons. Accent colors: golden amber for insights and silver-white for data points. The feel should be expansive, connected, and insightful — like seeing the entire financial world from above.`,

  pairs_sessions: `**Style & Composition:** Geographic, time-zone aesthetic. Dark gradient from midnight blue (left) transitioning to golden sunrise (right), representing market sessions across the globe. Include subtle world map contours, clock elements, and currency pair symbols. Accent colors: Tokyo cherry pink, London royal blue, New York amber gold. The feel should be global, dynamic, and time-aware.`,

  advanced_concepts: `**Style & Composition:** Sophisticated, layered complexity aesthetic. Deep gradient from charcoal black to rich burgundy wine. Include fractal patterns, Fibonacci spirals, and wave structures. Accent colors: platinum silver and subtle gold. The feel should be intellectual, layered, and masterclass-level — like advanced mathematics meeting art.`,
};

// ============================================================
// CLASSIFICATION — map article slugs/titles to categories
// ============================================================
function classifyArticle(item) {
  const t = (item.title + ' ' + item.slug).toLowerCase();

  // Broker reviews & comparisons
  if (t.includes('broker') || t.includes('regulated') || t.includes('ecn') || t.includes('market maker') || t.includes('spread') && t.includes('broker'))
    return 'brokers';

  // Trading platforms
  if (t.includes('tradingview') || t.includes('metatrader') || t.includes('mt4') || t.includes('mt5') || t.includes('ctrader') || t.includes('platform') || t.includes('demo account') || t.includes('vps'))
    return 'brokers';

  // Psychology & Mindset
  if (t.includes('psychology') || t.includes('emotion') || t.includes('fear') || t.includes('greed') || t.includes('fomo') || t.includes('revenge') || t.includes('impulse') || t.includes('confidence') || t.includes('mindset') || t.includes('losing streak') || t.includes('patience') || t.includes('confirmation bias') || t.includes('analysis paralysis') || t.includes('overtrading'))
    return 'psychology';

  // Risk Management
  if (t.includes('risk') || t.includes('stop loss') || t.includes('position size') || t.includes('drawdown') || t.includes('leverage') && t.includes('danger') || t.includes('overleverag') || t.includes('protect profit') || t.includes('hedging') || t.includes('1 percent rule') || t.includes('losing trade') || t.includes('correlation risk'))
    return 'risk_management';

  // Chart Patterns
  if (t.includes('pattern') || t.includes('head and shoulders') || t.includes('double top') || t.includes('double bottom') || t.includes('triple top') || t.includes('triangle') || t.includes('wedge') || t.includes('flag') || t.includes('pennant') || t.includes('cup and handle') || t.includes('rectangle') || t.includes('rounding bottom') || t.includes('harmonic'))
    return 'chart_patterns';

  // Price Action & SMC
  if (t.includes('price action') || t.includes('candlestick') || t.includes('candle') || t.includes('doji') || t.includes('engulfing') || t.includes('pin bar') || t.includes('hammer') || t.includes('shooting star') || t.includes('morning star') || t.includes('evening star') || t.includes('tweezer') || t.includes('spinning top') || t.includes('order block') || t.includes('fair value gap') || t.includes('fvg') || t.includes('liquidity sweep') || t.includes('smart money') || t.includes('choch') || t.includes('break of structure') || t.includes('naked chart'))
    return 'price_action';

  // Technical Indicators
  if (t.includes('indicator') || t.includes('rsi') || t.includes('macd') || t.includes('bollinger') || t.includes('stochastic') || t.includes('ichimoku') || t.includes('moving average') || t.includes('sma') || t.includes('ema') || t.includes('atr') || t.includes('adx') || t.includes('parabolic sar') || t.includes('pivot point') || t.includes('divergence') || t.includes('volume analysis') || t.includes('fibonacci'))
    return 'technical_indicators';

  // Strategies
  if (t.includes('strategy') || t.includes('scalping') || t.includes('swing trading') || t.includes('day trading') || t.includes('trend following') || t.includes('breakout') || t.includes('range trading') || t.includes('position trading') || t.includes('grid trading') || t.includes('mean reversion') || t.includes('martingale') || t.includes('sniper entry') || t.includes('session') && t.includes('trading'))
    return 'strategies';

  // Fundamentals & Macro
  if (t.includes('fundamental') || t.includes('interest rate') || t.includes('inflation') || t.includes('gdp') || t.includes('cpi') || t.includes('nfp') || t.includes('unemployment') || t.includes('geopolitical') || t.includes('carry trade') || t.includes('economic calendar') || t.includes('news trading') || t.includes('trade balance') || t.includes('bond yield'))
    return 'fundamentals';

  // Market Analysis broad
  if (t.includes('sentiment') || t.includes('dxy') || t.includes('cot report') || t.includes('intermarket') || t.includes('oil') || t.includes('correlation') || t.includes('market structure') || t.includes('top down') || t.includes('gold price') || t.includes('technical analysis vs') || t.includes('how to analyze'))
    return 'market_analysis';

  // Currency Pairs & Sessions
  if (t.includes('currency pair') || t.includes('london session') || t.includes('asian session') || t.includes('new york session') || t.includes('overlap') || t.includes('volatile') || t.includes('xau') || t.includes('gold trading'))
    return 'pairs_sessions';

  // Trading discipline & planning
  if (t.includes('trading plan') || t.includes('journal') || t.includes('trading routine') || t.includes('trading rules') || t.includes('trading system') || t.includes('backtest'))
    return 'psychology';

  // Beginner basics
  if (t.includes('beginner') || t.includes('what is') || t.includes('how to start') || t.includes('explained') || t.includes('step by step') || t.includes('forex lot') || t.includes('pip') || t.includes('bid and ask') || t.includes('spread explained') || t.includes('market hours') || t.includes('how much money') || t.includes('long vs short') || t.includes('margin vs') || t.includes('forex quote') || t.includes('profitable'))
    return 'beginner_basics';

  // Advanced
  if (t.includes('elliott wave') || t.includes('multiple timeframe'))
    return 'advanced_concepts';

  // Technical Analysis general
  if (t.includes('technical analysis') || t.includes('support and resistance') || t.includes('trendline') || t.includes('trend') && t.includes('identify'))
    return 'beginner_basics';

  // Default
  return 'market_analysis';
}

// ============================================================
// PROCESS — classify, assign style, update prompt
// ============================================================
const categoryCount = {};

const updated = data.map((item) => {
  const category = classifyArticle(item);
  categoryCount[category] = (categoryCount[category] || 0) + 1;

  // Build new prompt with the category-specific style
  const styleBlock = styles[category];

  // Extract the concept section from original prompt
  const conceptMatch = item.prompt.match(/\*\*Concept & Context:\*\*(.*?)(?=\*\*Style|$)/s);
  const conceptPart = conceptMatch
    ? `**Concept & Context:**${conceptMatch[1].trim()}`
    : '';

  // Extract the title part
  const titleMatch = item.prompt.match(/^(.*?)\.\n\n/s);
  const titlePart = titleMatch ? titleMatch[1] + '.' : item.prompt.split('\n\n')[0];

  const newPrompt = `${titlePart}\n\n${conceptPart}\n\n${styleBlock}`;

  return { ...item, prompt: newPrompt, _category: category };
});

// Log category distribution
console.log('\n=== Category Distribution ===\n');
const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
for (const [cat, count] of sorted) {
  console.log(`  ${cat.padEnd(22)} → ${count} articles`);
}
console.log(`  ${'TOTAL'.padEnd(22)} → ${data.length} articles\n`);

// Remove internal _category before saving
const cleanData = updated.map(({ _category, ...rest }) => rest);

// Save updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(cleanData, null, 2), 'utf-8');
console.log('✅ Updated featured-images-to-generate.json\n');

// Regenerate TXT file
const txtPath = path.join(__dirname, '..', 'featured-images-prompts.txt');
const lines = cleanData.map((item) => {
  return item.prompt.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
});
fs.writeFileSync(txtPath, lines.join('\n\n'), 'utf-8');
console.log('✅ Regenerated featured-images-prompts.txt\n');
