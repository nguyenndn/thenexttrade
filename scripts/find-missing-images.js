const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.article.updateMany({
    where: { status: 'PUBLISHED' },
    data: { status: 'DRAFT' }
  });

  console.log(`✅ Set ${result.count} articles to DRAFT`);

  // Verify
  const stats = await p.article.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('\nCurrent status breakdown:');
  stats.forEach(s => console.log(`  ${s.status}: ${s._count}`));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
