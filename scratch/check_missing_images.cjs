const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const slugs = [
    // Group A
    'entry-confirmation-the-trigger-before-you-click',
    'the-confluence-checklist-4-layers-before-you-trade',
    'entry-placement-structural-sl-tp-and-trade-management',
    'your-complete-trading-sop-from-scan-to-journal',
    // Group B
    'reading-the-economic-calendar-and-reacting-to-the-news',
    'how-to-draw-support-and-resistance-and-stop-guessing'
  ];

  for (const slug of slugs) {
    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      include: {
        module: {
          include: {
            level: true,
            lessons: { select: { slug: true, title: true, order: true } }
          }
        }
      }
    });

    if (!lesson) {
      console.log('NOT FOUND:', slug);
      continue;
    }

    const imgs = lesson.content.match(/<img[^>]+>/g) || [];
    console.log('====================================================');
    console.log(`SLUG: ${slug}`);
    console.log(`TITLE: ${lesson.title}`);
    console.log(`LEVEL: ${lesson.module.level.order} | MODULE: ${lesson.module.order} (${lesson.module.title})`);
    console.log(`CONTENT LENGTH: ${lesson.content.length} chars`);
    console.log(`IMAGES IN CONTENT: ${imgs.length}`);
    
    // Check disk directory
    const modDir = `public/images/academy/level-${String(lesson.module.level.order).padStart(2, '0')}/module-${String(lesson.module.order).padStart(2, '0')}`;
    console.log(`EXPECTED DIR: ${modDir}`);
    if (fs.existsSync(modDir)) {
      const files = fs.readdirSync(modDir);
      console.log(`FILES ON DISK (${files.length}):`, files);
    } else {
      console.log(`DIRECTORY DOES NOT EXIST`);
    }

    // List sibling lessons in this module and their images
    console.log('SIBLING LESSONS:');
    for (const sib of lesson.module.lessons) {
      const fullSib = await prisma.lesson.findUnique({
        where: { slug: sib.slug },
        select: { slug: true, title: true, content: true }
      });
      const sibImgs = (fullSib.content.match(/src="([^"]+)"/g) || []).map(s => s.replace('src="', '').replace('"', ''));
      console.log(`  - [${sib.order}] ${sib.title} (${sib.slug}): ${sibImgs.length} images -> ${sibImgs.join(', ')}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
