/**
 * Seed 3 Articles for TheNextTrade
 * Usage: node prisma/seed-articles.js
 */
const { PrismaClient } = require('@prisma/client');
const { marked } = require('marked');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const ARTICLES = [
  {
    title: "5 Golden Rules of Risk Management Every Trader Must Know",
    slug: "5-golden-rules-risk-management",
    categorySlug: "risk-management",
    tags: ["risk-management", "stop-loss", "position-sizing", "beginner", "money-management"],
    isFeatured: true,
    excerpt: "Blowing an account isn't about bad trades — it's about bad risk management. Here are 5 rules that will keep you in the game long enough to become profitable.",
    metaTitle: "5 Risk Management Rules for Forex Traders | TheNextTrade",
    metaDescription: "Learn the 5 essential risk management rules that separate profitable traders from blown accounts. Position sizing, stop loss, and more.",
    focusKeyword: "risk management forex",
    content: `## Why Most Traders Fail (And It's Not What You Think)

Here's a stat that might surprise you: **over 70% of retail forex traders lose money**. But it's rarely because they can't read a chart. It's because they don't manage risk.

Think of it this way — you can have a 70% win rate and STILL blow your account if your losses are 5x bigger than your wins.

Risk management isn't sexy. It won't get you excited before the market opens. But it's the single thing that separates traders who survive from those who don't.

Let's break down the 5 rules.

---

## Rule 1: Never Risk More Than 1-2% Per Trade

This is the golden rule. Non-negotiable.

If you have a $10,000 account, your maximum risk per trade should be **$100-$200**. That's it.

Why? Because even a string of 10 losses in a row (which WILL happen) only costs you 10-20% of your account. You can recover from that.

Risk 10% per trade? Five losses and you're down 50%. Now you need a 100% return just to break even. Good luck.

| Risk Per Trade | 10 Consecutive Losses | Recovery Needed |
|---|---|---|
| 1% | -10% | +11% |
| 2% | -18% | +22% |
| 5% | -40% | +67% |
| 10% | -65% | +186% |

The math doesn't lie.

---

## Rule 2: Always Use a Stop Loss

"I'll close it manually if it goes against me."

No, you won't. Your ego won't let you. You'll move your mental stop, hoping the market will come back. It won't.

**A stop loss is not optional.** It's your seatbelt. Set it BEFORE entering the trade and don't touch it.

Where to place it:
- Below the last swing low (for longs)
- Above the last swing high (for shorts)
- Beyond key support/resistance levels
- Never closer than the spread + a buffer

💡 **Pro tip:** If you can't afford the stop loss distance with proper position sizing, the trade isn't for you. Skip it.

---

## Rule 3: Aim for At Least 1:2 Risk-to-Reward

If you're risking $100, your target should be at least $200.

This means you can be wrong 60% of the time and STILL be profitable.

| Win Rate | R:R 1:1 | R:R 1:2 | R:R 1:3 |
|---|---|---|---|
| 40% | -$200 | +$200 | +$600 |
| 50% | $0 | +$500 | +$1,000 |
| 60% | +$200 | +$800 | +$1,400 |

*Based on 10 trades, $100 risk each.*

Don't chase every setup. Wait for trades where the reward clearly outweighs the risk, then strike.

---

## Rule 4: Don't Revenge Trade

You just got stopped out. You're frustrated. The market "tricked" you.

So you jump right back in with double the lot size to "make it back."

**This is how accounts die.**

After a losing trade:
1. Step away from the screen for 15 minutes
2. Review what happened objectively
3. Ask: "Does a new valid setup exist?" 
4. If yes → take it with normal risk
5. If no → close the chart and come back tomorrow

Set a **daily loss limit** of 3-5% max. Hit it? You're done for the day. No exceptions.

---

## Rule 5: Size Your Position Based on Your Stop

Most beginners pick a lot size first, then figure out where to stop. That's backwards.

The correct order:
1. **Find your entry** (based on your strategy)
2. **Set your stop loss** (based on the chart)
3. **Calculate your position size** (based on distance × risk %)

**Formula:**
\`\`\`
Position Size = (Account × Risk%) / (Stop Loss in Pips × Pip Value)
\`\`\`

Example: $5,000 account, 2% risk ($100), stop loss 25 pips on EUR/USD:
\`\`\`
$100 / (25 × $10) = 0.4 lots
\`\`\`

Never adjust the stop to fit the lot size. Always adjust the lot size to fit the stop.

---

## 📝 Quick Recap

- **1-2% max risk** per trade — survive losing streaks
- **Always use a stop loss** — set it and forget it
- **Minimum 1:2 R:R** — math works in your favor
- **No revenge trading** — emotions = losses
- **Size from stop** — let the chart determine your position

> "The goal of a successful trader is to make the best trades. Money is secondary." — Alexander Elder

Risk management isn't a skill you learn once. It's a habit you practice on every single trade. Start today.`
  },
  {
    title: "How to Read Candlestick Charts Like a Pro in 10 Minutes",
    slug: "how-to-read-candlestick-charts",
    categorySlug: "price-action",
    tags: ["technical-analysis", "candlestick-patterns", "price-action", "beginner", "tutorial"],
    isFeatured: true,
    excerpt: "Candlestick charts look intimidating at first. But once you understand the 4 parts of a candle, you'll never look at a chart the same way again.",
    metaTitle: "How to Read Candlestick Charts for Beginners | TheNextTrade",
    metaDescription: "Learn to read candlestick charts in 10 minutes. Understand body, wick, open, close, and the most important patterns every trader should know.",
    focusKeyword: "how to read candlestick charts",
    content: `## What Is a Candlestick?

Every candle on your chart tells a story. It shows you what happened during a specific time period — who won the battle between buyers and sellers.

One candle. Four data points. Infinite insight.

---

## The Anatomy of a Candle

Every candlestick has 4 components:

- **Open** — where the price started
- **Close** — where the price ended
- **High** — the highest price reached
- **Low** — the lowest price reached

The thick middle part is the **body**. The thin lines above and below are the **wicks** (or shadows).

### Green (Bullish) Candle
- Close is ABOVE the open
- Buyers dominated this period
- The bigger the body, the stronger the buying pressure

### Red (Bearish) Candle
- Close is BELOW the open
- Sellers dominated this period
- The bigger the body, the stronger the selling pressure

---

## What the Body Size Tells You

| Body Type | What It Means |
|---|---|
| **Long body** | Strong momentum — one side dominated |
| **Short body** | Indecision — buyers and sellers are balanced |
| **No body (Doji)** | Total indecision — potential reversal ahead |

A long green candle after a downtrend? Buyers are stepping in. Pay attention.

A long red candle at a resistance level? Sellers are in control. Don't buy there.

---

## What the Wicks Tell You

Wicks are where the real secrets hide.

**Long upper wick** = Price pushed up but got rejected. Sellers fought back.

**Long lower wick** = Price pushed down but bounced. Buyers fought back.

**No wicks (Marubozu)** = Pure momentum. One side completely dominated from open to close.

💡 **Key insight:** Long wicks at key levels (support/resistance) are powerful signals. A long lower wick at support = buyers defending that level aggressively.

---

## 5 Patterns You Should Know Today

### 1. Hammer 🔨
- Small body at the top, long lower wick
- Appears at the **bottom** of a downtrend
- Signal: Buyers rejected lower prices → potential reversal UP

### 2. Shooting Star ⭐
- Small body at the bottom, long upper wick
- Appears at the **top** of an uptrend
- Signal: Sellers rejected higher prices → potential reversal DOWN

### 3. Engulfing Pattern
- Second candle completely covers the first
- **Bullish engulfing**: Red then Green (bigger) → reversal up
- **Bearish engulfing**: Green then Red (bigger) → reversal down

### 4. Doji ✚
- Open and close are nearly the same price
- Market is undecided
- Often signals the END of a trend (not the start of one)

### 5. Morning Star / Evening Star ⭐
- Three-candle pattern
- **Morning Star**: Big red → Small body → Big green = Reversal UP
- **Evening Star**: Big green → Small body → Big red = Reversal DOWN
- These are STRONG reversal signals, especially at key levels

---

## The #1 Mistake Beginners Make

Trading candle patterns in isolation.

A hammer at random? Meaningless.

A hammer at a **strong support level**, with **RSI oversold**, on the **daily timeframe**? Now we're talking.

**Context is everything.** Always combine candlestick patterns with:
- Support & Resistance levels
- Trend direction
- Volume confirmation
- Higher timeframe alignment

---

## 📝 Quick Recap

- Every candle has 4 parts: **open, close, high, low**
- **Body size** = momentum strength
- **Wick length** = rejection / fight between buyers & sellers
- Learn the big 5: **Hammer, Shooting Star, Engulfing, Doji, Morning/Evening Star**
- Never trade patterns alone — **context is king**

The best part? You already have everything you need. Open your chart right now and start reading the story each candle is telling you.`
  },
  {
    title: "London Session vs New York Session: When Should You Trade?",
    slug: "london-vs-new-york-session-best-time-trade",
    categorySlug: "forex-basics",
    tags: ["forex", "day-trading", "scalping", "beginner", "strategy-guide"],
    isFeatured: true,
    excerpt: "Not all trading hours are equal. The London and New York sessions move 70% of daily forex volume. Here's how to pick the right session for your strategy.",
    metaTitle: "London vs New York Trading Session Comparison | TheNextTrade",
    metaDescription: "Compare London and New York forex sessions. Learn which session suits your strategy, when the highest volatility occurs, and the best pairs to trade.",
    focusKeyword: "best time to trade forex",
    content: `## Why Trading Sessions Matter

The forex market is open 24 hours. But that doesn't mean every hour is worth trading.

**70% of daily volume** happens during just two sessions: London and New York. The rest? Either too slow (Asian session) or too unpredictable (session transitions).

If you're trading during the wrong hours, you're fighting the market with one hand tied behind your back.

---

## The London Session (8:00 AM - 5:00 PM GMT)

London is the king of forex. It accounts for **~43% of all daily trading volume**.

### Why London Works

- **Highest liquidity** = tighter spreads
- **Clean trends** = price respects technical levels
- **Major pairs move** = EUR/USD, GBP/USD, USD/CHF come alive
- **Institutional money** = banks and hedge funds are active

### Best Time Within London

The first 2-3 hours (8:00-11:00 AM GMT) are typically the most volatile. This is when:
- European economic data drops
- Banks start executing large orders
- Trends for the day get established

### London Session Personality

| Feature | Details |
|---|---|
| **Volume** | Highest of all sessions |
| **Volatility** | High, especially first 2 hours |
| **Best pairs** | EUR/USD, GBP/USD, EUR/GBP |
| **Style** | Trend trading, breakouts |
| **Spread** | Tightest of the day |

---

## The New York Session (1:00 PM - 10:00 PM GMT)

New York is the second largest session. It brings **~17% of daily volume** and often sets the tone for the rest of the day.

### Why New York Works

- **US economic data** = NFP, CPI, Fed decisions hit HARD
- **Overlap with London** = the most powerful 4 hours in forex
- **Gold loves New York** = XAU/USD makes its biggest moves here
- **Clear reversals** = afternoon often reverses morning trends

### Best Time Within New York

The first 2-3 hours (1:00-4:00 PM GMT / 8:00-11:00 AM EST) overlap with London. This is where the magic happens:
- Highest volume of the entire 24-hour cycle
- Biggest candles form here
- Most news releases drop at 1:30 PM GMT (8:30 AM EST)

### New York Session Personality

| Feature | Details |
|---|---|
| **Volume** | High (massive during London overlap) |
| **Volatility** | Very high first 3 hours, drops off after |
| **Best pairs** | EUR/USD, USD/JPY, XAU/USD, USD/CAD |
| **Style** | News trading, momentum, reversals |
| **Spread** | Tight during overlap, wider late session |

---

## The London-New York Overlap: The Golden Hours

**1:00 PM - 5:00 PM GMT** (8:00 AM - 12:00 PM EST)

This 4-hour window is the most important period in forex. Period.

Why:
- Both London and New York are open simultaneously
- Liquidity is at its absolute peak
- Major US data releases cause explosive moves
- EUR/USD averages **80-100+ pip range** during this window
- Gold (XAU/USD) can move **$20-40** in a single hour

If you can only trade 4 hours a day, **this is the window**.

---

## Which Session Is Best for YOU?

It depends on your strategy and timezone:

| If you... | Trade... | Because... |
|---|---|---|
| **Scalp (1-5 min)** | London-NY overlap | Highest volatility + tight spreads |
| **Day trade (15m-1H)** | Full London or early NY | Clean trends and clear S/R reactions |
| **Swing trade (4H-Daily)** | Doesn't matter | You trade the daily close, not intraday noise |
| **Trade Gold** | New York session | XAU/USD makes 60%+ of its daily range here |
| **Live in Asia** | London open (3-4 PM local) | Catch the start of maximum volume |
| **Live in US** | NY open | You're already in the right timezone |

---

## Common Mistakes to Avoid

### ❌ Trading the Asian Session Like London
Asia (Tokyo) is typically range-bound. If you're a trend trader, you'll get chopped up. Save your energy.

### ❌ Trading Through Session Transitions
The hour between sessions is often messy. Spreads widen, fakeouts increase. Stay flat.

### ❌ Ignoring Your Body Clock
Trading the London open from California means waking up at midnight. Tired traders make bad decisions. Choose a session that fits your lifestyle.

### ❌ Over-Trading All Sessions
You don't need to trade 24/7. The best traders are picky. **Quality over quantity, always.**

---

## 📝 Quick Recap

- **London** (8 AM - 5 PM GMT): Highest volume, cleanest trends, tightest spreads
- **New York** (1 PM - 10 PM GMT): Big news moves, gold action, afternoon reversals
- **The Overlap** (1 PM - 5 PM GMT): The #1 time to trade forex — peak everything
- **Match your session** to your strategy, timezone, and lifestyle
- **Less is more** — 2-4 focused hours beats 12 hours of screen staring

Use our [Market Hours Tool](/tools/market-hours) to visualize all sessions in your local timezone. It updates in real-time so you always know what's open.

Happy trading! 🎯`
  }
];

async function main() {
  console.log('📰 Seeding 3 Articles...\n');

  // Find author
  const author = await prisma.user.findFirst({ select: { id: true, name: true } });
  if (!author) {
    console.error('❌ No user found. Create a user first.');
    process.exit(1);
  }
  console.log(`   Author: ${author.name} (${author.id})\n`);

  for (const article of ARTICLES) {
    // Find category
    const category = await prisma.category.findUnique({ where: { slug: article.categorySlug } });
    if (!category) {
      console.error(`   ❌ Category not found: ${article.categorySlug}`);
      continue;
    }

    // Convert markdown → HTML
    const htmlContent = await marked(article.content);

    // Upsert article
    const created = await prisma.article.upsert({
      where: { slug: article.slug },
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: htmlContent,
        status: 'PUBLISHED',
        isFeatured: article.isFeatured,
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: category.id,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        focusKeyword: article.focusKeyword,
        views: Math.floor(Math.random() * 500) + 100,
      },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: htmlContent,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        focusKeyword: article.focusKeyword,
      },
    });
    console.log(`   ✅ ${article.title}`);

    // Link tags
    for (const tagSlug of article.tags) {
      const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        await prisma.articleTag.upsert({
          where: { articleId_tagId: { articleId: created.id, tagId: tag.id } },
          create: { articleId: created.id, tagId: tag.id },
          update: {},
        });
      }
    }
    console.log(`      🏷️  ${article.tags.length} tags linked`);
  }

  console.log('\n✨ Done! 3 articles seeded and published.');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
