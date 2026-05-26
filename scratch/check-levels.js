const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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

  console.log('--- LEVELS SUMMARY ---');
  levels.forEach(level => {
    let moduleCount = level.modules.length;
    let lessonCount = level.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    console.log(`Level ${level.order}: ${level.title} | ${moduleCount} Modules | ${lessonCount} Lessons`);
    console.log(`  Description: ${level.description}`);
    level.modules.forEach(m => {
      console.log(`    - Module ${m.order}: ${m.title} (${m.lessons.length} Lessons)`);
    });
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
