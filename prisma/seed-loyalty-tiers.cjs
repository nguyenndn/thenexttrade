const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STANDARD_TIERS = [
  {
    level: 1,
    name: 'Rookie Scalper',
    requiredLots: 10,
    rewardType: 'SYSTEM_PERK',
    rewardTitle: '1-Month Pro Access + Bronze Badge',
    cashAmount: 0,
    perkDescription: 'Full access to automated Journal analytics, telemetry metrics, and Pro community radar.',
    icon: 'Shield',
    badgeColor: '#CD7F32',
    order: 1,
  },
  {
    level: 2,
    name: 'Active Trader',
    requiredLots: 30,
    rewardType: 'CASH',
    rewardTitle: '$30 USDT Cash Reward + EA License',
    cashAmount: 30,
    perkDescription: 'Automated 1x MT5 Trade Manager EA license + $30 USDT direct payout.',
    icon: 'ShieldCheck',
    badgeColor: '#94A3B8',
    order: 2,
  },
  {
    level: 3,
    name: 'Flow Operator',
    requiredLots: 75,
    rewardType: 'CASH',
    rewardTitle: '$80 USDT Cash Reward + AI Coach Boost',
    cashAmount: 80,
    perkDescription: '3-Month Priority AI Diagnostics quota + $80 USDT direct payout.',
    icon: 'Zap',
    badgeColor: '#38BDF8',
    order: 3,
  },
  {
    level: 4,
    name: 'Volume Builder',
    requiredLots: 150,
    rewardType: 'CASH',
    rewardTitle: '$180 USDT Cash Reward + Systems Suite',
    cashAmount: 180,
    perkDescription: 'Full access to TheNextTrade EA Trading Systems catalog + $180 USDT direct payout.',
    icon: 'Award',
    badgeColor: '#EAB308',
    order: 4,
  },
  {
    level: 5,
    name: 'Alpha Executioner',
    requiredLots: 300,
    rewardType: 'CASH',
    rewardTitle: '$400 USDT Cash Reward + Private Alpha Channel',
    cashAmount: 400,
    perkDescription: 'Invitation to Private Telegram Alpha desk + $400 USDT direct payout.',
    icon: 'Gem',
    badgeColor: '#A855F7',
    order: 5,
  },
  {
    level: 6,
    name: 'Consistency Master',
    requiredLots: 600,
    rewardType: 'CASH',
    rewardTitle: '$900 USDT Cash Reward + Unlimited EA Accounts',
    cashAmount: 900,
    perkDescription: 'Uncapped live MT5 licenses on partner brokers + $900 USDT direct payout.',
    icon: 'Diamond',
    badgeColor: '#EC4899',
    order: 6,
  },
  {
    level: 7,
    name: 'High-Frequency Pro',
    requiredLots: 1200,
    rewardType: 'CASH',
    rewardTitle: '$1,800 USDT Cash Reward + Sponsored VPS VIP',
    cashAmount: 1800,
    perkDescription: 'Ultra-low latency London/NY sponsored MT5 VPS + $1,800 USDT direct payout.',
    icon: 'Flame',
    badgeColor: '#F97316',
    order: 7,
  },
  {
    level: 8,
    name: 'Market Maker',
    requiredLots: 2500,
    rewardType: 'CASH',
    rewardTitle: '$4,000 USDT Cash Reward + Prop Capital Fast-track',
    cashAmount: 4000,
    perkDescription: 'Priority evaluation support with partner prop desks + $4,000 USDT direct payout.',
    icon: 'Trophy',
    badgeColor: '#EAB308',
    order: 8,
  },
  {
    level: 9,
    name: 'Apex Whale',
    requiredLots: 5000,
    rewardType: 'CASH',
    rewardTitle: '$8,000 USDT Cash Reward + 1-on-1 Capital Desk',
    cashAmount: 8000,
    perkDescription: 'Dedicated institutional risk consultation desk + $8,000 USDT direct payout.',
    icon: 'Crown',
    badgeColor: '#EF4444',
    order: 9,
  },
  {
    level: 10,
    name: 'The Sovereign',
    requiredLots: 10000,
    rewardType: 'CASH',
    rewardTitle: '$18,000 USDT Cash Reward + Elite Partner Share',
    cashAmount: 18000,
    perkDescription: 'Highest honor in TheNextTrade ecosystem + $18,000 USDT direct payout.',
    icon: 'Sparkles',
    badgeColor: '#F59E0B',
    order: 10,
  },
];

async function main() {
  console.log('Seeding 10 Loyalty Tiers...');
  for (const tier of STANDARD_TIERS) {
    await prisma.loyaltyTier.upsert({
      where: { level: tier.level },
      update: tier,
      create: tier,
    });
  }
  console.log('Successfully seeded 10 Loyalty Tiers!');
}

main()
  .catch((e) => {
    console.error('Error seeding loyalty tiers:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
