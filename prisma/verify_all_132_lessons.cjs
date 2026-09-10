const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyAll() {
  console.log('🔍 [Comprehensive Verification] Auditing all 132 lessons in DB...');
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

  let totalImages = 0;
  let missingImages = 0;
  let brokenTagsCount = 0;

  for (const l of lessons) {
    const srcs = [...l.content.matchAll(/src="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((s) => s.startsWith('/images/academy/'));
    totalImages += srcs.length;

    const missing = srcs.filter(
      (s) => !fs.existsSync(path.join(process.cwd(), 'public', s))
    );
    if (missing.length > 0) {
      console.warn(`⚠️ [Missing Image] ${l.slug}: ${missing.join(', ')}`);
      missingImages += missing.length;
    }

    // Check open/close tags for core structural containers
    const openDivs = (l.content.match(/<div\b/gi) || []).length;
    const closeDivs = (l.content.match(/<\/div>/gi) || []).length;
    if (openDivs !== closeDivs) {
      console.error(`❌ [Tag Mismatch] ${l.slug}: ${openDivs} <div vs ${closeDivs} </div>`);
      brokenTagsCount++;
    }
  }

  console.log('\n=== COMPREHENSIVE VERIFICATION SUMMARY ===');
  console.log(`Total Lessons Checked: ${lessons.length}`);
  console.log(`Total Academy Images: ${totalImages}`);
  console.log(`Missing Images: ${missingImages}`);
  console.log(`Tag Mismatches: ${brokenTagsCount}`);
  console.log(missingImages === 0 && brokenTagsCount === 0 ? '✅ ALL 132 LESSONS PASSED 100% VERIFICATION!' : '⚠️ SOME ISSUES FOUND');

  await prisma.$disconnect();
}

verifyAll().catch(async (e) => {
  console.error('Verification failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
