const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function syncFiles() {
  console.log('Syncing content/data files with DB...');

  // 1. S&R merged file
  const srLesson = await prisma.lesson.findUnique({
    where: { slug: 'how-to-draw-support-and-resistance-and-stop-guessing' },
  });
  if (srLesson) {
    const srDir = path.join(process.cwd(), 'content', 'data', 'level-04-price-action', 'module-01-price-boundaries-support-resistance');
    if (fs.existsSync(srDir)) {
      const targetFile = path.join(srDir, 'how-to-draw-support-and-resistance-and-stop-guessing.html');
      fs.writeFileSync(targetFile, srLesson.content, 'utf-8');
      console.log(`✓ Updated ${targetFile}`);

      const oldFile = path.join(srDir, 'support-and-resistance-the-only-2-lines-you-actually-need.html');
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log(`✓ Deleted old duplicate file: ${oldFile}`);
      }
    }
  }

  // 2. Economic calendar merged file
  const calLesson = await prisma.lesson.findUnique({
    where: { slug: 'reading-the-economic-calendar-and-reacting-to-the-news' },
  });
  if (calLesson) {
    const calDir = path.join(process.cwd(), 'content', 'data', 'level-09-market-forces', 'module-01-what-drives-currencies');
    if (fs.existsSync(calDir)) {
      const targetFile = path.join(calDir, 'reading-the-economic-calendar-and-reacting-to-the-news.html');
      fs.writeFileSync(targetFile, calLesson.content, 'utf-8');
      console.log(`✓ Updated ${targetFile}`);

      const oldFile = path.join(calDir, 'the-economic-calendar-your-weekly-cheat-sheet.html');
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log(`✓ Deleted old duplicate file: ${oldFile}`);
      }
    }
  }

  // 3. Remove how-to-count-waves if it exists in content/data
  const wavePattern = 'how-to-count-waves';
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanDir(full);
      } else if (ent.name.includes(wavePattern)) {
        fs.unlinkSync(full);
        console.log(`✓ Removed orphan file: ${full}`);
      }
    }
  }
  scanDir(path.join(process.cwd(), 'content', 'data'));

  console.log('File sync completed!');
  await prisma.$disconnect();
}

syncFiles().catch(console.error);
