/**
 * Full Database Synchronization & Clean-up Script
 * Uses 127.0.0.1:5432 for reliable Windows PostgreSQL connection
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:ServBay.dev@127.0.0.1:5432/gsn_crm",
        },
    },
});

const LEVEL_CONFIG = [
    { order: 1, dir: "level-01-first-steps", title: "First Steps", description: "Market fundamentals, pips, lots, leverage, and margin mechanics" },
    { order: 2, dir: "level-02-the-foundation", title: "The Foundation", description: "Broker selection, MT5 setup, mobile trading, and trading style fit" },
    { order: 3, dir: "level-03-protect-your-money", title: "Protect Your Money", description: "The 1% risk rule, position sizing formulas, and R:R ratios" },
    { order: 4, dir: "level-04-price-action", title: "Market Structure & Price Action", description: "HH/HL/LH/LL, BOS, CHoCH, Key S&R levels, trendlines, and candlestick signals" },
    { order: 5, dir: "level-05-technical-tools", title: "Smart Money & Institutional Tools", description: "Supply & Demand zones, Order Blocks, Fair Value Gaps, and core momentum indicators" },
    { order: 6, dir: "level-06-pattern-mastery", title: "Pattern Mastery & Confluence", description: "High-probability chart patterns and multi-indicator confluence" },
    { order: 7, dir: "level-07-trader-mindset", title: "Trader Mindset & Psychology", description: "Overcoming FOMO, revenge trading, overtrading, and keeping a bulletproof journal" },
    { order: 8, dir: "level-08-strategy-lab", title: "Strategy Lab", description: "Trend-following strategies, breakout/retest systems, and risk-managed execution" },
    { order: 9, dir: "level-09-market-forces", title: "Market Forces & Macro", description: "Interest rates, central bank policies, and navigating the Economic Calendar" },
    { order: 10, dir: "level-10-the-playbook", title: "The Playbook", description: "Building a personalized trading plan, backtesting, and forward testing" },
    { order: 11, dir: "level-11-global-view", title: "Global View & Gold", description: "Intermarket cross-connections, currency crosses, and institutional Gold (XAUUSD) trading" },
    { order: 12, dir: "level-12-ready-to-trade", title: "Ready to Trade & Going Live", description: "The psychology of real money, capital management, and execution tools" },
];

async function runSync() {
    console.log("=== EXECUTING DATABASE CLEANUP & SYNCHRONIZATION ===");

    // Step 1: Delete all Ichimoku & Elliott Wave lessons by ID and slug
    const targetLessonsToDelete = [
        "cmnj448ni002vpjyxdo5zk5j2", // Ichimoku Cloud
        "cmnk7o9d7000fjpe4ta5qoggd", // Elliott Wave Theory
        "cmnk7o9d8000hjpe4slqglixf", // Impulse vs Corrective Waves
    ];

    for (const id of targetLessonsToDelete) {
        try {
            await prisma.userProgress.deleteMany({ where: { lessonId: id } });
            await prisma.lesson.deleteMany({ where: { id } });
            console.log(`✓ Deleted lesson ID: ${id}`);
        } catch (e) {
            console.warn(`! Could not delete lesson ID ${id}:`, e.message);
        }
    }

    // Delete any remaining matching slugs/titles
    const deletedByPattern = await prisma.lesson.deleteMany({
        where: {
            OR: [
                { slug: { contains: "ichimoku" } },
                { slug: { contains: "elliott" } },
                { title: { contains: "Ichimoku" } },
                { title: { contains: "Elliott" } },
            ],
        },
    });
    console.log(`✓ Cleaned up ${deletedByPattern.count} lessons matching Ichimoku/Elliott patterns.`);

    // Clean up empty modules
    const modulesWithNoLessons = await prisma.module.findMany({
        where: {
            lessons: { none: {} },
        },
    });
    for (const mod of modulesWithNoLessons) {
        await prisma.module.delete({ where: { id: mod.id } });
        console.log(`✓ Deleted empty module: ${mod.title} (${mod.id})`);
    }

    // Step 2: Sync all 12 Levels, Modules, and Lessons from content/data/
    const contentBase = path.join(process.cwd(), "content", "data");

    for (const lvl of LEVEL_CONFIG) {
        console.log(`\n--- Syncing Level ${lvl.order}: ${lvl.title} ---`);

        let levelRecord = await prisma.level.findUnique({ where: { order: lvl.order } });
        if (!levelRecord) {
            levelRecord = await prisma.level.create({
                data: {
                    title: lvl.title,
                    description: lvl.description,
                    order: lvl.order,
                    accessLevel: "PUBLIC",
                },
            });
            console.log(`+ Created Level ${lvl.order}: ${lvl.title}`);
        } else {
            levelRecord = await prisma.level.update({
                where: { id: levelRecord.id },
                data: {
                    title: lvl.title,
                    description: lvl.description,
                },
            });
            console.log(`~ Updated Level ${lvl.order}: ${lvl.title}`);
        }

        const levelDir = path.join(contentBase, lvl.dir);
        if (!fs.existsSync(levelDir)) {
            console.warn(`! Directory not found: ${levelDir}`);
            continue;
        }

        const moduleDirs = fs
            .readdirSync(levelDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort();

        let moduleOrder = 1;
        for (const modDir of moduleDirs) {
            const rawModTitle = modDir.replace(/^module-\d+-/, "").replace(/-/g, " ");
            const modTitle = rawModTitle
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");

            let modRecord = await prisma.module.findFirst({
                where: {
                    levelId: levelRecord.id,
                    order: moduleOrder,
                },
            });

            if (!modRecord) {
                modRecord = await prisma.module.create({
                    data: {
                        title: modTitle,
                        description: `Module ${moduleOrder} of ${lvl.title}`,
                        levelId: levelRecord.id,
                        order: moduleOrder,
                    },
                });
                console.log(`  + Created Module ${moduleOrder}: ${modTitle}`);
            } else {
                modRecord = await prisma.module.update({
                    where: { id: modRecord.id },
                    data: {
                        title: modTitle,
                    },
                });
                console.log(`  ~ Updated Module ${moduleOrder}: ${modTitle}`);
            }

            const fullModPath = path.join(levelDir, modDir);
            const files = fs.readdirSync(fullModPath);
            const htmlFiles = files.filter((f) => f.endsWith(".html")).sort();

            let lessonOrder = 1;
            for (const htmlFile of htmlFiles) {
                const slug = htmlFile.replace(/\.html$/, "");
                const htmlPath = path.join(fullModPath, htmlFile);
                const mdPath = path.join(fullModPath, `${slug}.md`);

                const htmlContent = fs.readFileSync(htmlPath, "utf8");
                let mdContent = htmlContent;
                let title = slug
                    .replace(/-/g, " ")
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");

                if (fs.existsSync(mdPath)) {
                    mdContent = fs.readFileSync(mdPath, "utf8");
                    const titleMatch = mdContent.match(/title:\s*"([^"]+)"/);
                    if (titleMatch && titleMatch[1]) {
                        title = titleMatch[1];
                    }
                }

                const existingLesson = await prisma.lesson.findUnique({ where: { slug } });

                if (!existingLesson) {
                    await prisma.lesson.create({
                        data: {
                            title,
                            slug,
                            content: htmlContent,
                            rawContent: mdContent,
                            moduleId: modRecord.id,
                            order: lessonOrder,
                            duration: 10,
                            status: "published",
                        },
                    });
                    console.log(`    + Created Lesson [${lessonOrder}]: ${title}`);
                } else {
                    await prisma.lesson.update({
                        where: { id: existingLesson.id },
                        data: {
                            title,
                            content: htmlContent,
                            rawContent: mdContent,
                            moduleId: modRecord.id,
                            order: lessonOrder,
                            status: "published",
                        },
                    });
                    console.log(`    ~ Updated Lesson [${lessonOrder}]: ${title}`);
                }

                lessonOrder++;
            }

            moduleOrder++;
        }
    }

    console.log("\n=== DATABASE SYNC & CLEANUP FULLY COMPLETED! ===");
}

runSync()
    .catch((err) => {
        console.error("Sync error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
