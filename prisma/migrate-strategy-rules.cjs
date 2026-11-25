const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseLegacyLines(rawRules) {
    if (!rawRules || typeof rawRules !== "string" || !rawRules.trim()) {
        return [];
    }
    return rawRules
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•\d.)]+\s*/, "").trim())
        .filter((line) => line.length >= 3)
        .map((line) => line.slice(0, 140));
}

async function main() {
    const strategiesWithLegacyRules = await prisma.strategy.findMany({
        where: {
            rules: { not: null },
        },
        include: {
            tradingRules: {
                select: { id: true, title: true },
            },
        },
    });

    let migratedStrategies = 0;
    let createdRulesCount = 0;

    for (const strat of strategiesWithLegacyRules) {
        const lines = parseLegacyLines(strat.rules);
        const existingTitles = new Set(
            strat.tradingRules.map((r) => r.title.trim().toLowerCase())
        );

        const newTitles = [];
        for (const line of lines) {
            const normalized = line.toLowerCase();
            if (!existingTitles.has(normalized)) {
                existingTitles.add(normalized);
                newTitles.push(line);
            }
        }

        await prisma.$transaction(async (tx) => {
            if (newTitles.length > 0) {
                await tx.tradingRule.createMany({
                    data: newTitles.map((title, idx) => ({
                        userId: strat.userId,
                        strategyId: strat.id,
                        title,
                        category: "ENTRY",
                        severity: "HIGH",
                        isActive: true,
                        sortOrder: strat.tradingRules.length + idx,
                    })),
                });
                createdRulesCount += newTitles.length;
            }

            await tx.strategy.update({
                where: { id: strat.id },
                data: { rules: null },
            });
        });

        migratedStrategies += 1;
    }

    console.log(
        `[migrate-strategy-rules] Processed ${migratedStrategies} strategy record(s), created ${createdRulesCount} structured TradingRule row(s).`
    );
}

main()
    .catch((err) => {
        console.error("[migrate-strategy-rules] Failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
