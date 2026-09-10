const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('📦 [Backup] Fetching all lessons from database...');
  const lessons = await prisma.lesson.findMany({
    include: {
      module: {
        include: {
          level: true,
        },
      },
    },
    orderBy: [
      { module: { level: { order: 'asc' } } },
      { module: { order: 'asc' } },
      { order: 'asc' },
    ],
  });

  const backupPath = path.join(__dirname, 'academy_backup_before_anti_ai.json');
  fs.writeFileSync(backupPath, JSON.stringify(lessons, null, 2), 'utf-8');
  console.log(`✅ [Backup] Successfully saved ${lessons.length} lessons to ${backupPath} (${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB)`);

  await prisma.$disconnect();
}

backup().catch(async (e) => {
  console.error('❌ [Backup Failed]:', e);
  await prisma.$disconnect();
  process.exit(1);
});
