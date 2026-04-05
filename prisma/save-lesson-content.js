/**
 * Save lesson content to DB
 * Usage: node prisma/save-lesson-content.js <slug> <content-file> [meta-description]
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  const contentFile = process.argv[3];
  const metaDesc = process.argv[4] || "";

  if (!slug || !contentFile) {
    console.error("Usage: node save-lesson-content.js <slug> <content-file> [meta-description]");
    process.exit(1);
  }

  console.log(`🔗 Connecting to DB...`);
  console.log(`📂 Reading: ${contentFile}`);
  
  const content = await readFile(contentFile, "utf-8");
  console.log(`📝 Content size: ${(content.length / 1024).toFixed(1)} KB`);

  const lesson = await prisma.lesson.findFirst({ where: { slug } });
  if (!lesson) {
    console.error(`❌ Lesson not found for slug: ${slug}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`📌 Found lesson: "${lesson.title}" (id: ${lesson.id})`);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      content,
      ...(metaDesc ? { metaDescription: metaDesc } : {}),
      status: "published",
    },
  });

  console.log(`✅ Saved & published!`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
