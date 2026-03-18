/**
 * Seed Categories (hierarchical) & Tags (flat) for Articles
 * Usage: node prisma/seed-categories-tags.js
 * Safe to re-run — uses upsert on slug
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Categories (parent → children) ───
const CATEGORIES = [
  {
    name: 'Forex Basics',
    description: 'Everything you need to know to start your forex journey — from currency pairs to how trades work.',
    children: ['What is Forex', 'Currency Pairs', 'How Trading Works'],
  },
  {
    name: 'CFD Trading',
    description: 'Learn to trade CFDs on stocks, indices, commodities, and crypto with leverage.',
    children: ['Stock CFDs', 'Index CFDs', 'Commodity CFDs', 'Crypto CFDs'],
  },
  {
    name: 'Technical Analysis',
    description: 'Read charts like a pro — patterns, indicators, and price action strategies.',
    children: ['Chart Patterns', 'Indicators & Oscillators', 'Price Action'],
  },
  {
    name: 'Fundamental Analysis',
    description: 'Understand the economic forces that move markets — interest rates, GDP, employment, and more.',
    children: ['Economic Indicators', 'Central Banks', 'News Trading'],
  },
  {
    name: 'Trading Strategies',
    description: 'Proven approaches to the market — from 1-minute scalps to multi-week swing trades.',
    children: ['Scalping', 'Day Trading', 'Swing Trading', 'Position Trading'],
  },
  {
    name: 'Risk Management',
    description: 'Protect your capital and trade another day. The #1 skill that separates winners from losers.',
    children: ['Position Sizing', 'Stop Loss Strategies', 'Portfolio Risk'],
  },
  {
    name: 'Trading Psychology',
    description: 'Master your emotions and build the mindset of a consistent, disciplined trader.',
    children: ['Discipline & Mindset', 'Fear & Greed', 'Journaling'],
  },
  {
    name: 'Broker & Platforms',
    description: 'Reviews, comparisons, and guides to help you choose the best broker and trading platform.',
    children: ['Broker Reviews', 'MT4 / MT5', 'Trading Tools'],
  },
  {
    name: 'Market Analysis',
    description: 'Daily and weekly market outlooks, trade ideas, and expert commentary on current price action.',
    children: ['Daily Outlook', 'Weekly Forecast', 'Market Commentary'],
  },
  {
    name: 'Gold & Commodities',
    description: 'Deep dives into gold (XAU/USD), oil, silver, and how commodity markets affect forex.',
    children: ['Gold (XAU/USD)', 'Oil', 'Silver'],
  },
];

// ─── Tags (flat) ───
const TAGS = [
  // Core Concepts
  'Forex', 'CFD', 'Leverage', 'Margin', 'Pips', 'Lots', 'Spread', 'Swap',
  // Instruments
  'XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'Indices', 'Crypto', 'Oil', 'Silver',
  // Analysis
  'Technical Analysis', 'Fundamental Analysis', 'Sentiment Analysis', 'Price Action',
  'Candlestick Patterns', 'Chart Patterns', 'Fibonacci', 'Moving Averages',
  'RSI', 'MACD', 'Bollinger Bands',
  // Strategy
  'Scalping', 'Day Trading', 'Swing Trading', 'Breakout', 'Trend Following',
  'Divergence', 'Multi-Timeframe', 'News Trading',
  // Risk & Psychology
  'Risk Management', 'Stop Loss', 'Position Sizing', 'Trading Psychology',
  'Money Management', 'Drawdown',
  // Platform & Tools
  'MetaTrader', 'MT5', 'Prop Trading', 'Economic Calendar', 'Backtesting', 'Trading Journal',
  // Content Type
  'Beginner', 'Intermediate', 'Advanced', 'Tutorial', 'Market Update', 'Strategy Guide',
];

async function main() {
  console.log('🌱 Seeding Categories & Tags...\n');

  // ── 1. Create Categories ──
  console.log('📂 Creating Categories...');
  let parentCount = 0;
  let childCount = 0;

  for (const cat of CATEGORIES) {
    const parentSlug = slugify(cat.name);
    const parent = await prisma.category.upsert({
      where: { slug: parentSlug },
      create: { name: cat.name, slug: parentSlug, description: cat.description },
      update: { name: cat.name, description: cat.description },
    });
    parentCount++;
    console.log(`   ✅ ${cat.name}`);

    for (const childName of cat.children) {
      const childSlug = slugify(childName);
      await prisma.category.upsert({
        where: { slug: childSlug },
        create: { name: childName, slug: childSlug, parentId: parent.id },
        update: { name: childName, parentId: parent.id },
      });
      childCount++;
      console.log(`      └─ ${childName}`);
    }
  }
  console.log(`\n   Total: ${parentCount} parents + ${childCount} children\n`);

  // ── 2. Create Tags ──
  console.log('🏷️  Creating Tags...');
  let tagCount = 0;

  for (const tagName of TAGS) {
    const tagSlug = slugify(tagName);
    await prisma.tag.upsert({
      where: { slug: tagSlug },
      create: { name: tagName, slug: tagSlug },
      update: { name: tagName },
    });
    tagCount++;
  }
  console.log(`   ✅ ${tagCount} tags created\n`);

  console.log('=' .repeat(50));
  console.log(`✨ Done! ${parentCount} parent categories, ${childCount} sub-categories, ${tagCount} tags`);
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
