/**
 * Seed — Academy new lessons (N1–N5) theo docs/academy/academy-content-gap-plan.md
 *
 * Tạo 6 lesson MỚI (status=draft) chèn vào đúng vị trí:
 *   - N1  Platform Usage          → L2 m3 (trước "Your First Trade on a Demo")
 *   - N2  Economic Calendar       → L9 m1 (sau "The Economic Calendar — Your Weekly Cheat Sheet")
 *   - N3a Going Live: Psychology  → L12 m1 (sau "Going Live — Your First Real Money Checklist")
 *   - N3b Going Live: Finance     → L12 m1 (sau N3a)
 *   - N4  Trading Style           → L2 m2 (sau "Which Analysis Style Fits You?")
 *   - N5  Mobile Trading          → L2 m3 (sau N1)
 *
 * Đặc điểm:
 *   - Map module bằng level.order + module.order (KHÔNG hardcode UUID).
 *   - Idempotent: bỏ qua lesson đã tồn tại theo slug.
 *   - Dịch chuyển order an toàn trong transaction (Lesson.order không unique).
 *   - content = placeholder HTML (draft), rawContent = nội dung writing brief (.md).
 *
 * Chạy: npx ts-node prisma/seed-academy-new-lessons.ts
 */

export {};

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const CONTENT_DIR = path.join(process.cwd(), "content", "data");

// ── Định nghĩa 6 lesson mới ────────────────────────────────────────────────
const LESSONS = [
  {
    key: "N1",
    title: "Meet Your Trading Platform — MT4, MT5, and cTrader Basics",
    slug: "meet-your-trading-platform-mt4-mt5-and-more",
    tone: "conversational",
    duration: 12,
    levelOrder: 2,
    moduleOrder: 3,
    anchorSlug: "your-first-trade-on-a-demo-a-step-by-step-walkthrough",
    before: true,
    briefPath:
      "level-02-the-foundation/module-03-your-first-charts/meet-your-trading-platform-mt4-mt5-and-more.md",
    images: [
      "platform-overview.png",
      "order-types-market-vs-pending.png",
      "sl-tp-ticket.png",
      "position-management.png",
    ],
  },
  {
    key: "N2",
    title:
      "Reading the Economic Calendar — And Reacting to the News the Right Way",
    slug: "reading-the-economic-calendar-and-reacting-to-the-news",
    tone: "professional",
    duration: 12,
    levelOrder: 9,
    moduleOrder: 1,
    anchorSlug: "the-economic-calendar-your-weekly-cheat-sheet",
    before: false,
    briefPath:
      "level-09-market-forces/module-01-what-drives-currencies/reading-the-economic-calendar-and-reacting-to-the-news.md",
    images: [
      "calendar-columns-guide.png",
      "news-reaction-phases.png",
      "nfp-cpi-fomc-cheatsheet.png",
      "news-trading-risk.png",
    ],
  },
  {
    key: "N3a",
    title: "Going Live — The Psychology of Trading Real Money",
    slug: "going-live-the-psychology-of-trading-real-money",
    tone: "motivational",
    duration: 10,
    levelOrder: 12,
    moduleOrder: 1,
    anchorSlug: "going-live-your-first-real-money-checklist",
    before: false,
    briefPath:
      "level-12-ready-to-trade/module-01-your-pre-launch-checklist/going-live-the-psychology-of-trading-real-money.md",
    images: [
      "demo-vs-real-mind.png",
      "loss-shock-curve.png",
      "emotion-to-action-traps.png",
    ],
  },
  {
    key: "N3b",
    title:
      "Going Live — The Financial Side: Capital, Lot Size, and Expectations",
    slug: "going-live-the-financial-side-of-real-money",
    tone: "motivational",
    duration: 10,
    levelOrder: 12,
    moduleOrder: 1,
    anchorSlug: "going-live-the-psychology-of-trading-real-money",
    before: false,
    briefPath:
      "level-12-ready-to-trade/module-01-your-pre-launch-checklist/going-live-the-financial-side-of-real-money.md",
    images: [
      "realistic-capital.png",
      "lot-size-math.png",
      "expectation-reality.png",
    ],
  },
  {
    key: "N4",
    title:
      "Choosing Your Trading Style — Scalping, Day, Swing, or Position",
    slug: "choosing-your-trading-style-scalping-day-swing-position",
    tone: "conversational",
    duration: 8,
    levelOrder: 2,
    moduleOrder: 2,
    anchorSlug: "which-analysis-style-fits-you-finding-your-edge",
    before: false,
    briefPath:
      "level-02-the-foundation/module-02-the-three-lenses-of-analysis/choosing-your-trading-style-scalping-day-swing-position.md",
    images: [
      "four-styles-comparison.png",
      "style-fit-flowchart.png",
      "avoid-style-hopping.png",
    ],
  },
  {
    key: "N5",
    title: "Trading on Mobile — Stay in Control on the Go",
    slug: "trading-on-mobile-stay-in-control-on-the-go",
    tone: "conversational",
    duration: 6,
    levelOrder: 2,
    moduleOrder: 3,
    anchorSlug: "meet-your-trading-platform-mt4-mt5-and-more",
    before: false,
    briefPath:
      "level-02-the-foundation/module-03-your-first-charts/trading-on-mobile-stay-in-control-on-the-go.md",
    images: [
      "mobile-vs-desktop.png",
      "price-alert-setup.png",
      "mobile-risk-warning.png",
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

type LessonDef = (typeof LESSONS)[number];

async function getModule(levelOrder: number, moduleOrder: number) {
  const level = await prisma.level.findUnique({ where: { order: levelOrder } });
  if (!level) throw new Error(`Level order ${levelOrder} not found in DB`);
  const module = await prisma.module.findFirst({
    where: { levelId: level.id, order: moduleOrder },
  });
  if (!module)
    throw new Error(
      `Module ${levelOrder}.${moduleOrder} not found in DB (level "${level.title}")`
    );
  return module;
}

function buildPlaceholderHtml(title: string, images: string[]) {
  const imageList = images
    .map((f) => `    <li><code>/images/academy/.../${f}</code></li>`)
    .join("\n");
  return `<h1>${title}</h1>
<p><strong>⚠️ Draft — writing brief only.</strong> Full lesson content chưa được viết (xem rawContent).</p>
<p>Lesson này được seed theo <code>docs/academy/academy-content-gap-plan.md</code>. Sau khi có nội dung hoàn chỉnh, thay thế placeholder này qua Admin UI rồi publish.</p>
<h2>Planned images</h2>
<ul>
${imageList}
</ul>`;
}

function readBrief(briefPath: string) {
  const full = path.join(CONTENT_DIR, briefPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Brief file not found: ${full}`);
  }
  return fs.readFileSync(full, "utf8");
}

// Chèn 1 lesson vào sau (hoặc trước) anchor, dịch order an toàn.
async function insertLesson(def: LessonDef) {
  const existing = await prisma.lesson.findUnique({
    where: { slug: def.slug },
    select: { id: true },
  });
  if (existing) {
    console.log(`SKIP (đã tồn tại): ${def.key} — ${def.slug}`);
    return;
  }

  const module = await getModule(def.levelOrder, def.moduleOrder);

  const anchor = await prisma.lesson.findUnique({
    where: { slug: def.anchorSlug },
    select: { id: true, order: true, moduleId: true },
  });
  if (!anchor) throw new Error(`Anchor không tồn tại: ${def.anchorSlug}`);
  if (anchor.moduleId !== module.id)
    throw new Error(
      `Anchor ${def.anchorSlug} không thuộc module ${def.levelOrder}.${def.moduleOrder}`
    );

  const newOrder = def.before ? anchor.order : anchor.order + 1;

  const rawContent = readBrief(def.briefPath);
  const content = buildPlaceholderHtml(def.title, def.images);

  await prisma.$transaction(async (tx: any) => {
    await tx.lesson.updateMany({
      where: { moduleId: module.id, order: { gte: newOrder } },
      data: { order: { increment: 1 } },
    });
    await tx.lesson.create({
      data: {
        title: def.title,
        slug: def.slug,
        content,
        rawContent,
        tone: def.tone,
        duration: def.duration,
        moduleId: module.id,
        order: newOrder,
        status: "draft",
      },
    });
  });

  console.log(
    `INSERT ${def.key}: order=${newOrder} module=${def.levelOrder}.${def.moduleOrder} → ${def.slug}`
  );
}

async function main() {
  console.log("Seeding academy new lessons (N1–N5)...\n");
  for (const def of LESSONS) {
    await insertLesson(def);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
