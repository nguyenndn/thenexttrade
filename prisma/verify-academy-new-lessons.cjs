// prisma/verify-academy-new-lessons.cjs
// Run: node prisma/verify-academy-new-lessons.cjs
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const SLUGS = [
  "meet-your-trading-platform-mt4-mt5-and-more",
  "reading-the-economic-calendar-and-reacting-to-the-news",
  "going-live-the-psychology-of-trading-real-money",
  "going-live-the-financial-side-of-real-money",
  "choosing-your-trading-style-scalping-day-swing-position",
  "trading-on-mobile-stay-in-control-on-the-go",
];

async function main() {
  let allOk = true;
  for (const slug of SLUGS) {
    const l = await prisma.lesson.findUnique({
      where: { slug },
      select: { id: true, title: true, status: true, duration: true, content: true },
    });
    if (!l) {
      console.log("NOT FOUND: " + slug);
      allOk = false;
      continue;
    }
    const srcs = [...l.content.matchAll(/src="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((s) => s.startsWith("/images/academy/"));
    const missing = srcs.filter(
      (s) => !fs.existsSync(path.join(process.cwd(), "public", s))
    );
    const ok = l.status === "published" && missing.length === 0;
    if (!ok) allOk = false;
    console.log(
      (ok ? "OK   " : "FAIL ") +
        l.status.padEnd(9) +
        " | " + slug +
        " | " + (l.duration ?? "?") + "m" +
        " | " + l.content.length + " chars" +
        " | " + srcs.length + " imgs" +
        (missing.length ? " | MISSING: " + missing.join(", ") : "")
    );
  }
  console.log(allOk ? "\nALL GOOD." : "\nSOMETHING NEEDS FIXING.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
