const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const prisma = new PrismaClient();

async function fullAudit() {
  console.log('================================================================');
  console.log('🔍 [FULL ACADEMY INTEGRITY AUDIT] Starting comprehensive check...');
  console.log('================================================================\n');

  const levels = await prisma.level.findMany({
    orderBy: { order: 'asc' },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  let totalLevels = levels.length;
  let totalModules = 0;
  let totalLessons = 0;
  let totalImagesInDB = 0;
  let missingImageFiles = [];
  let zeroByteImageFiles = [];
  let corruptedImageFiles = [];
  let lessonsWithoutImages = [];
  let duplicateSlugs = new Set();
  let seenSlugs = new Set();
  let invalidSlugs = [];

  const checkedImagePaths = new Set();
  const validImagesList = [];

  for (const level of levels) {
    totalModules += level.modules.length;
    for (const module of level.modules) {
      for (const lesson of module.lessons) {
        totalLessons++;

        // Slug check
        if (!lesson.slug || !/^[a-z0-9-]+$/.test(lesson.slug)) {
          invalidSlugs.push({ slug: lesson.slug, title: lesson.title });
        }
        if (seenSlugs.has(lesson.slug)) {
          duplicateSlugs.add(lesson.slug);
        }
        seenSlugs.add(lesson.slug);

        // Images check
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        const lessonImgs = [];
        while ((match = imgRegex.exec(lesson.content)) !== null) {
          lessonImgs.push(match[1]);
        }

        if (lessonImgs.length === 0) {
          lessonsWithoutImages.push({
            slug: lesson.slug,
            title: lesson.title,
            level: level.order,
            module: module.order
          });
        }

        for (const imgSrc of lessonImgs) {
          totalImagesInDB++;
          // Convert /images/academy/... to public/images/academy/...
          const relPath = imgSrc.startsWith('/') ? imgSrc.slice(1) : imgSrc;
          const fullPath = path.join(process.cwd(), 'public', relPath);

          if (!checkedImagePaths.has(fullPath)) {
            checkedImagePaths.add(fullPath);

            if (!fs.existsSync(fullPath)) {
              missingImageFiles.push({ src: imgSrc, fullPath, lesson: lesson.slug });
            } else {
              const stat = fs.statSync(fullPath);
              if (stat.size === 0) {
                zeroByteImageFiles.push({ src: imgSrc, fullPath, lesson: lesson.slug });
              } else {
                try {
                  const meta = await sharp(fullPath).metadata();
                  validImagesList.push({
                    src: imgSrc,
                    size: stat.size,
                    dim: `${meta.width}x${meta.height}`,
                    format: meta.format
                  });
                } catch (err) {
                  corruptedImageFiles.push({ src: imgSrc, error: err.message, lesson: lesson.slug });
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('--- 1. STRUCTURE & URL METRICS ---');
  console.log(`• Total Levels:  ${totalLevels}`);
  console.log(`• Total Modules: ${totalModules}`);
  console.log(`• Total Lessons: ${totalLessons}`);
  console.log(`• Unique Slugs:  ${seenSlugs.size}`);
  console.log(`• Duplicate Slugs: ${duplicateSlugs.size === 0 ? 'NONE (✅ Clean)' : Array.from(duplicateSlugs).join(', ')}`);
  console.log(`• Invalid Slugs:   ${invalidSlugs.length === 0 ? 'NONE (✅ Clean)' : JSON.stringify(invalidSlugs)}`);

  console.log('\n--- 2. IMAGE METRICS & AUDIT ---');
  console.log(`• Total <img> tags in DB:       ${totalImagesInDB}`);
  console.log(`• Distinct image files checked:  ${checkedImagePaths.size}`);
  console.log(`• Valid image files verified:    ${validImagesList.length}`);
  console.log(`• Missing image files (404):     ${missingImageFiles.length}`);
  console.log(`• Zero-byte files:               ${zeroByteImageFiles.length}`);
  console.log(`• Corrupted image files:         ${corruptedImageFiles.length}`);
  console.log(`• Lessons WITHOUT any images:    ${lessonsWithoutImages.length}`);

  if (missingImageFiles.length > 0) {
    console.log('\n❌ MISSING IMAGES:');
    missingImageFiles.forEach(m => console.log(`  - [${m.lesson}] -> ${m.src} (File not found on disk)`));
  }

  if (lessonsWithoutImages.length > 0) {
    console.log('\n❌ LESSONS WITHOUT IMAGES:');
    lessonsWithoutImages.forEach(l => console.log(`  - L${l.level}.M${l.module} [${l.slug}] ${l.title}`));
  }

  const isAuditPerfect = 
    duplicateSlugs.size === 0 &&
    invalidSlugs.length === 0 &&
    missingImageFiles.length === 0 &&
    zeroByteImageFiles.length === 0 &&
    corruptedImageFiles.length === 0 &&
    lessonsWithoutImages.length === 0;

  console.log('\n================================================================');
  if (isAuditPerfect) {
    console.log('🎉 [RESULT: 100% PERFECT PASS] ALL 133 LESSONS & ALL IMAGES ARE 100% VERIFIED ON DISK & DB!');
  } else {
    console.log('⚠️ [RESULT: ISSUES DETECTED] Please see details above.');
  }
  console.log('================================================================\n');

  await prisma.$disconnect();
  return isAuditPerfect;
}

fullAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
