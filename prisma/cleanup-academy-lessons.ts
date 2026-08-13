/**
 * Cleanup — xóa 2 lesson dư trong Academy (đã xác minh an toàn, idempotent)
 *
 * 1. "Going Live — Your First Real Money Checklist" (L12 m1, order 1)
 *    → Đã tách thành N3a (Psychology) + N3b (Finance) theo kế hoạch.
 *    → Nội dung đầy đủ đã lưu sẵn tại content/data/level-12-.../going-live-your-first-real-money-checklist.{html,md}
 *    → Xóa DB row + renumber L12 m1 về liền mạch (1..N).
 *
 * 2. "Interest Rates — The #1 Force Moving Currencies" (L9 m1, order 1) — LESSON RỖNG
 *    → Shell dựng nhầm sau bài thật 1 ngày, content = 0, không progress/comments,
 *      không code nào reference. Bài thật là interest-rates-the-number-one-force-moving-currencies.
 *
 * Chạy: npx ts-node prisma/cleanup-academy-lessons.ts
 */

export {};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const L12_M1 = "cmmvrl9as001fwqshh1zar7jd"; // Your Pre-Launch Checklist
const GOING_LIVE_OLD = "going-live-your-first-real-money-checklist";
const DUP_SLUG = "interest-rates-the-1-force-moving-currencies";

async function main() {
  console.log("Cleanup academy duplicate/obsolete lessons...\n");

  // 1) Xóa bài Going Live checklist cũ + renumber L12 m1
  await prisma.$transaction(async (tx: any) => {
    const old = await tx.lesson.findUnique({
      where: { slug: GOING_LIVE_OLD },
      select: { id: true, order: true },
    });
    if (old) {
      await tx.lesson.delete({ where: { id: old.id } });
      console.log(`Deleted: ${GOING_LIVE_OLD} (was order ${old.order})`);
    } else {
      console.log(`Skip: ${GOING_LIVE_OLD} not found`);
    }
    const after = await tx.lesson.updateMany({
      where: { moduleId: L12_M1, order: { gte: 2 } },
      data: { order: { decrement: 1 } },
    });
    console.log(`Renumbered ${after.count} remaining lessons in L12 m1`);
  });

  // 2) Xóa lesson rỗng trùng lặp trong L9 m1
  const dup = await prisma.lesson.findUnique({
    where: { slug: DUP_SLUG },
    select: { id: true, order: true },
  });
  if (dup) {
    await prisma.lesson.delete({ where: { id: dup.id } });
    console.log(`Deleted: ${DUP_SLUG} (empty duplicate)`);
  } else {
    console.log(`Skip: ${DUP_SLUG} not found`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
