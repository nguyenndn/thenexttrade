const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const levels = [
  { order: 1, title: 'First Steps', description: 'Khám phá Forex — What forex is, who trades it, and how margin works.' },
  { order: 2, title: 'The Foundation', description: 'Nền tảng Giao dịch — Choosing a broker, types of analysis, and chart basics.' },
  { order: 3, title: 'Chart Reading', description: 'Đọc hiểu Biểu đồ — Support & resistance, candlesticks, Fibonacci, moving averages, indicators.' },
  { order: 4, title: 'Pattern Mastery', description: 'Nhận diện Mô hình — Combining indicators, chart patterns, and pivot points.' },
  { order: 5, title: 'Strategy Lab', description: 'Chiến lược Nâng cao — Divergences, market environments, breakouts, multi-timeframe analysis.' },
  { order: 6, title: 'Market Forces', description: 'Phân tích Cơ bản — Economic indicators, news trading, sentiment analysis.' },
  { order: 7, title: 'Global View', description: 'Liên thị trường — How global markets (stocks, bonds, commodities) affect forex.' },
  { order: 8, title: 'The Playbook', description: 'Kế hoạch Giao dịch — Building a trading system, keeping a journal.' },
  { order: 9, title: 'Risk Control', description: 'Quản lý Rủi ro — Position sizing, stop losses, risk-reward ratio, scaling.' },
  { order: 10, title: 'Trader Mindset', description: 'Tâm lý Giao dịch — Emotions, discipline, common mistakes.' },
  { order: 11, title: 'Ready to Trade', description: 'Sẵn sàng Thực chiến — Prop trading, scams, your trading career.' },
];

async function main() {
  console.log('🌱 Seeding 11 Academy Levels...\n');

  for (const level of levels) {
    // Check if level with this order already exists
    const existing = await prisma.level.findUnique({ where: { order: level.order } });
    
    if (existing) {
      // Update if exists
      const updated = await prisma.level.update({
        where: { order: level.order },
        data: { title: level.title, description: level.description },
      });
      console.log(`  ♻️  Updated Level ${level.order}: ${updated.title} (id: ${updated.id})`);
    } else {
      // Create new
      const created = await prisma.level.create({ data: level });
      console.log(`  ✅ Created Level ${level.order}: ${created.title} (id: ${created.id})`);
    }
  }

  console.log('\n✨ Done! All 11 levels seeded.');
}

main()
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
