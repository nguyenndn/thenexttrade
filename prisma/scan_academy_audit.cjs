const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sample() {
  const lessons = await prisma.lesson.findMany({
    take: 3,
    select: { title: true, slug: true, tone: true, content: true, metaDescription: true }
  });
  for (const l of lessons) {
    console.log('=== LESSON:', l.title, '===');
    console.log('Slug:', l.slug);
    console.log('Tone:', l.tone);
    console.log('Meta:', l.metaDescription);
    console.log('Length:', l.content.length, 'chars');
    console.log('Preview:');
    console.log(l.content.slice(0, 600));
    console.log('\n-----------------------------------\n');
  }
  await prisma.$disconnect();
}

sample().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
