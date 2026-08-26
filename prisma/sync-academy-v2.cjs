/**
 * Full Academy Database Synchronization Script (Prisma CommonJS)
 * - Removes obsolete lessons (Elliott Wave, Ichimoku)
 * - Upserts 12 Levels, Modules, and Lessons directly from content/data/
 * - Sets status: "published" for ready lessons
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

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

async function syncAcademy() {
    console.log("=== STARTING ACADEMY V2 SYNCHRONIZATION ===");

    // Step 1: Cleanup obsolete lessons in DB
    const obsoleteSlugs = [
        "elliott-wave-basics-the-5-3-rhythm-of-markets",
        "impulse-waves-how-to-ride-the-trend-with-elliott",
        "corrective-waves-reading-pullbacks-before-they-happen",
        "ichimoku-cloud-simplified-the-all-in-one-indicator-you-need",
        "applying-sandr-and-candlesticks-together-the-power-combo",
        "overtrading-when-more-trades-less-profit",
        "interest-rates-the-1-force-moving-currencies",
    ];

    console.log(`Deleting ${obsoleteSlugs.length} obsolete lessons if present in DB...`);
    for (const slug of obsoleteSlugs) {
        try {
            await prisma.lesson.deleteMany({ where: { slug } });
            console.log(`✓ Removed DB record for: ${slug}`);
        } catch (e) {
            // Ignore if not present
        }
    }

    // Step 2: Iterate and sync Levels, Modules, and Lessons
    const contentBase = path.join(process.cwd(), "content", "data");

    for (const lvl of LEVEL_CONFIG) {
        console.log(`\n--- Syncing Level ${lvl.order}: ${lvl.title} ---`);

        // Upsert Level
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

        // Get subdirectories (modules)
        const moduleDirs = fs
            .readdirSync(levelDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort();

        let moduleOrder = 1;
        for (const modDir of moduleDirs) {
            // Module title from folder name, e.g., "module-01-welcome-to-the-market" -> "Welcome to the Market"
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

            // Sync Lessons in this Module
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

                // Check if lesson exists
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

    console.log("\n=== ACADEMY SYNCHRONIZATION COMPLETED SUCCESSFULLY! ===");
}

syncAcademy()
    .catch((err) => {
        console.error("Sync failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
