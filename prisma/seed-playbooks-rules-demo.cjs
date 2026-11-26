const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const TARGET_USER_ID = "787334ae-0483-4afa-b9fa-4a5af8496940";
const PRIMARY_ACCOUNT_ID = "cmvbxxdur0005xuk8ioepc2e5"; // ULTIMAMARKETS BOT
const SECONDARY_ACCOUNT_ID = "cmvgndghi00pg1to44p9iqvte"; // VANTAGE 1145
const MANIFEST_PATH = path.join(__dirname, ".demo-playbooks-manifest.json");

const DEMO_STRATEGIES = [
    {
        name: "SMC London Liquidity Sweep",
        description:
            "Sweep of Asian session high/low during London open (07:00-10:00 UTC) followed by M15 Market Structure Shift (MSS) and FVG limit entry.",
        color: "#00C888",
        isPlaybook: true,
        setupType: "Reversal",
        timeframes: ["H4", "M15", "M5"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD"],
        idealEntry: "50% Fair Value Gap (FVG) after M15 MSS candle close",
        idealStopLoss: "Above/below liquidity sweep wick + 3 pips spread buffer",
        idealTakeProfit: "Opposite Asian session range liquidity pool",
        riskRewardMin: 3.0,
        rules: [
            {
                title: "Mark Asian session high & low (00:00-07:00 UTC) before London open",
                category: "SESSION",
                severity: "MEDIUM",
            },
            {
                title: "Wait for clean liquidity sweep above/below Asian boundary",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Require M15 candle body close confirming Market Structure Shift (MSS)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Move stop-loss to break-even at +1.5R and scale out 50% at +2.5R",
                category: "EXIT",
                severity: "MEDIUM",
            },
        ],
    },
    {
        name: "ICT NY Silver Bullet Scalp",
        description:
            "High-precision execution inside the 10:00-11:00 AM EST macro window targeting M1/M5 Fair Value Gaps after session liquidity raids.",
        color: "#06B6D4",
        isPlaybook: true,
        setupType: "Scalp",
        timeframes: ["M15", "M5", "M1"],
        pairs: ["XAUUSD", "EURUSD", "US30"],
        idealEntry: "Proximal or 50% FVG formed inside 10:00-11:00 AM EST window",
        idealStopLoss: "Beyond displacement swing extreme (max 25 pips on Gold)",
        idealTakeProfit: "Nearest opposing session liquidity pool (15-30 pips)",
        riskRewardMin: 2.0,
        rules: [
            {
                title: "Execute strictly inside 10:00-11:00 AM EST Silver Bullet window",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Confirm BSL/SSL liquidity raid followed by impulsive displacement",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Set limit entry at FVG — never market-chase extended candles",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Flatten position before 11:30 AM EST if target is unfulfilled",
                category: "MANAGEMENT",
                severity: "MEDIUM",
            },
        ],
    },
    {
        name: "H4 Break & Retest Continuation",
        description:
            "Trend-following pullback setup capturing the first retest of a broken H1/H4 structural support-resistance flip zone.",
        color: "#3B82F6",
        isPlaybook: true,
        setupType: "Continuation",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["XAUUSD", "GBPUSD", "EURUSD", "BTCUSD"],
        idealEntry: "First pullback retest into broken H1/H4 S&R flip zone",
        idealStopLoss: "1 ATR beyond retested structural pivot",
        idealTakeProfit: "Next H4 structural swing high/low target",
        riskRewardMin: 2.5,
        rules: [
            {
                title: "Aligned H4 market structure (clear Higher Highs or Lower Lows)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Decisive H1 body close beyond horizontal key level",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "M15 rejection confirmation (Pinbar or Engulfing) on retest",
                category: "ENTRY",
                severity: "MEDIUM",
            },
            {
                title: "Pass on setup if required stop-loss exceeds 35 pips on XAUUSD",
                category: "RISK",
                severity: "HIGH",
            },
        ],
    },
    {
        name: "Supply & Demand Zone Flip",
        description:
            "Institutional order-flow setup trading fresh unmitigated H1 demand-to-supply or supply-to-demand polarity flips.",
        color: "#F59E0B",
        isPlaybook: true,
        setupType: "Reversal",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["XAUUSD", "USDJPY", "EURUSD"],
        idealEntry: "Proximal edge of fresh unmitigated H1 flip base",
        idealStopLoss: "5 pips beyond invalidation wick of origin candle",
        idealTakeProfit: "Opposing H1 unmitigated Supply/Demand zone",
        riskRewardMin: 3.0,
        rules: [
            {
                title: "Origin base must break opposing zone with strong Marubozu imbalance",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "First-touch mitigation only — skip zones tested 2+ times",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Bank 50% partial profit at 2R mid-range liquidity",
                category: "EXIT",
                severity: "MEDIUM",
            },
        ],
    },
    {
        name: "Asian Range Breakout",
        description:
            "Standard volatility expansion trade when tight Asian consolidation breaks at Frankfurt/London open.",
        color: "#8B5CF6",
        isPlaybook: false,
        setupType: null,
        timeframes: [],
        pairs: [],
        idealEntry: null,
        idealStopLoss: null,
        idealTakeProfit: null,
        riskRewardMin: null,
        rules: [
            {
                title: "Asian session consolidation box tighter than 80 pips on Gold",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Enter only after M15 candle closes outside box boundary",
                category: "ENTRY",
                severity: "HIGH",
            },
        ],
    },
];

const DEMO_GLOBAL_RULES = [
    {
        title: "Hard stop-loss on MT5 server within 30s of entry — never widen SL",
        description:
            "Every open position must carry a server-side stop-loss. Moving SL further into drawdown is strictly prohibited.",
        category: "RISK",
        severity: "HIGH",
        accountId: null,
    },
    {
        title: "Daily circuit breaker: stop after 2 consecutive losses or -2R day",
        description:
            "Close MT5 charts for the remainder of the day once 2 back-to-back losses occur on this account.",
        category: "RISK",
        severity: "HIGH",
        accountId: PRIMARY_ACCOUNT_ID,
    },
    {
        title: "No revenge sizing — never increase lot size after a losing trade",
        description:
            "Position size on trade N+1 after a loss must be equal to or smaller than baseline risk.",
        category: "PSYCHOLOGY",
        severity: "HIGH",
        accountId: null,
    },
    {
        title: "Flat 15 minutes before & after Tier-1 USD Red Folder news (CPI, NFP, FOMC)",
        description:
            "Cancel pending limit orders and avoid new entries around high-slippage macro releases.",
        category: "SESSION",
        severity: "MEDIUM",
        accountId: null,
    },
    {
        title: "No impulsive late-night entries after 22:30 ICT (post-NY liquidity drop)",
        description:
            "Spreads widen and follow-through drops after NY close — protect weekly gains.",
        category: "PSYCHOLOGY",
        severity: "MEDIUM",
        accountId: null,
    },
    {
        title: "Log setup grade & screenshot chart before closing trading session",
        description:
            "Audit execution quality while price action context is still fresh.",
        category: "MANAGEMENT",
        severity: "LOW",
        accountId: null,
    },
];

async function cleanupDemoData() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.log("[seed-playbooks-rules-demo] No manifest found; nothing to clean up.");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    await prisma.$transaction(async (tx) => {
        if (manifest.taggedTradeIds?.length > 0) {
            await tx.tradeRuleCheck.deleteMany({
                where: {
                    userId: TARGET_USER_ID,
                    journalEntryId: { in: manifest.taggedTradeIds },
                },
            });
            await tx.journalEntry.updateMany({
                where: {
                    userId: TARGET_USER_ID,
                    id: { in: manifest.taggedTradeIds },
                },
                data: {
                    strategy: null,
                    playbookGrade: null,
                    playbookComplianceScore: null,
                    followedPlan: null,
                },
            });
        }
        if (manifest.createdGlobalRuleIds?.length > 0) {
            await tx.tradingRule.deleteMany({
                where: {
                    userId: TARGET_USER_ID,
                    id: { in: manifest.createdGlobalRuleIds },
                },
            });
        }
        if (manifest.createdStrategyIds?.length > 0) {
            await tx.tradingRule.deleteMany({
                where: {
                    userId: TARGET_USER_ID,
                    strategyId: { in: manifest.createdStrategyIds },
                },
            });
            await tx.strategy.deleteMany({
                where: {
                    userId: TARGET_USER_ID,
                    id: { in: manifest.createdStrategyIds },
                },
            });
        }
    });

    fs.unlinkSync(MANIFEST_PATH);
    console.log("[seed-playbooks-rules-demo] Demo data cleanly reverted.");
}

async function seedDemoData() {
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
        throw new Error("Refusing to run demo seed on non-localhost DATABASE_URL!");
    }

    // If previously seeded, clean up first so re-runs are 100% idempotent
    if (fs.existsSync(MANIFEST_PATH)) {
        await cleanupDemoData();
    }

    const createdStrategyIds = [];
    const createdGlobalRuleIds = [];
    const strategyMap = new Map(); // name -> { id, isPlaybook, rules: [...] }

    // 1. Create Demo Playbooks & Strategies + Strategy-scoped Rules
    for (const stratDef of DEMO_STRATEGIES) {
        let strat = await prisma.strategy.findUnique({
            where: {
                userId_name: { userId: TARGET_USER_ID, name: stratDef.name },
            },
            include: { tradingRules: true },
        });

        if (!strat) {
            strat = await prisma.strategy.create({
                data: {
                    userId: TARGET_USER_ID,
                    name: stratDef.name,
                    description: stratDef.description,
                    rules: null,
                    color: stratDef.color,
                    isPlaybook: stratDef.isPlaybook,
                    setupType: stratDef.setupType,
                    timeframes: stratDef.timeframes,
                    pairs: stratDef.pairs,
                    idealEntry: stratDef.idealEntry,
                    idealStopLoss: stratDef.idealStopLoss,
                    idealTakeProfit: stratDef.idealTakeProfit,
                    riskRewardMin: stratDef.riskRewardMin,
                    referenceImages: [],
                },
                include: { tradingRules: true },
            });
            createdStrategyIds.push(strat.id);

            for (let idx = 0; idx < stratDef.rules.length; idx++) {
                const r = stratDef.rules[idx];
                const createdRule = await prisma.tradingRule.create({
                    data: {
                        userId: TARGET_USER_ID,
                        strategyId: strat.id,
                        title: r.title,
                        category: r.category,
                        severity: r.severity,
                        isActive: true,
                        sortOrder: idx,
                    },
                });
                strat.tradingRules.push(createdRule);
            }
        }

        strategyMap.set(strat.name, strat);
    }

    // 2. Create Demo Global Rules (preserving existing user rules)
    const existingGlobalRules = await prisma.tradingRule.findMany({
        where: { userId: TARGET_USER_ID, strategyId: null },
    });
    const existingGlobalByTitle = new Map(
        existingGlobalRules.map((r) => [r.title.trim().toLowerCase(), r])
    );

    const allGlobalRules = [...existingGlobalRules];
    for (let idx = 0; idx < DEMO_GLOBAL_RULES.length; idx++) {
        const g = DEMO_GLOBAL_RULES[idx];
        const key = g.title.trim().toLowerCase();
        if (!existingGlobalByTitle.has(key)) {
            const created = await prisma.tradingRule.create({
                data: {
                    userId: TARGET_USER_ID,
                    accountId: g.accountId,
                    strategyId: null,
                    title: g.title,
                    description: g.description,
                    category: g.category,
                    severity: g.severity,
                    isActive: true,
                    sortOrder: existingGlobalRules.length + idx,
                },
            });
            createdGlobalRuleIds.push(created.id);
            allGlobalRules.push(created);
        }
    }

    const revengeRule = allGlobalRules.find((r) =>
        r.title.toLowerCase().includes("revenge sizing")
    );
    const hardSlRule = allGlobalRules.find((r) =>
        r.title.toLowerCase().includes("hard stop-loss")
    );
    const newsRule = allGlobalRules.find((r) =>
        r.title.toLowerCase().includes("red folder news")
    );
    const lateNightRule = allGlobalRules.find((r) =>
        r.title.toLowerCase().includes("22:30")
    );
    const riskMaxRule = allGlobalRules.find((r) =>
        r.title.toLowerCase().includes("risk max 1-2%")
    );

    // 3. Tag a realistic slice of recent CLOSED untagged trades (Nov 2026) & attach TradeRuleChecks
    const recentWins = await prisma.journalEntry.findMany({
        where: {
            userId: TARGET_USER_ID,
            accountId: { in: [PRIMARY_ACCOUNT_ID, SECONDARY_ACCOUNT_ID] },
            status: "CLOSED",
            strategy: null,
            pnl: { gt: 5 },
            exitDate: { gte: new Date("2026-11-01T00:00:00Z") },
        },
        orderBy: { exitDate: "desc" },
        take: 42,
        select: { id: true, accountId: true, pnl: true },
    });

    const recentLosses = await prisma.journalEntry.findMany({
        where: {
            userId: TARGET_USER_ID,
            accountId: { in: [PRIMARY_ACCOUNT_ID, SECONDARY_ACCOUNT_ID] },
            status: "CLOSED",
            strategy: null,
            pnl: { lt: -5 },
            exitDate: { gte: new Date("2026-11-01T00:00:00Z") },
        },
        orderBy: { exitDate: "desc" },
        take: 22,
        select: { id: true, accountId: true, pnl: true },
    });

    // Assignment plan:
    // Playbooks get strong positive expectancy (realistic disciplined edge)
    // Standard strategy gets mixed results
    const winDistribution = [
        "SMC London Liquidity Sweep",
        "SMC London Liquidity Sweep",
        "ICT NY Silver Bullet Scalp",
        "H4 Break & Retest Continuation",
        "Supply & Demand Zone Flip",
        "Asian Range Breakout",
    ];
    const lossDistribution = [
        "ICT NY Silver Bullet Scalp",
        "Asian Range Breakout",
        "Asian Range Breakout",
        "SMC London Liquidity Sweep",
        "H4 Break & Retest Continuation",
        "Supply & Demand Zone Flip",
    ];

    const taggedTradeIds = [];
    const ruleChecksToInsert = [];

    // Process Wins (high compliance: A+ / A)
    for (let i = 0; i < recentWins.length; i++) {
        const trade = recentWins[i];
        const stratName = winDistribution[i % winDistribution.length];
        const strat = strategyMap.get(stratName);
        if (!strat) continue;

        const isPerfect = i % 4 !== 3;
        const grade = strat.isPlaybook ? (isPerfect ? "A+" : "A") : null;
        const score = strat.isPlaybook ? (isPerfect ? 100 : 83) : null;

        await prisma.journalEntry.update({
            where: { id: trade.id },
            data: {
                strategy: stratName,
                playbookGrade: grade,
                playbookComplianceScore: score,
                followedPlan: true,
            },
        });
        taggedTradeIds.push(trade.id);

        // Attach checks for strategy rules + core global rules
        for (let rIdx = 0; rIdx < strat.tradingRules.length; rIdx++) {
            const sr = strat.tradingRules[rIdx];
            const status = !isPerfect && rIdx === strat.tradingRules.length - 1 ? "SKIPPED" : "FOLLOWED";
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: sr.id,
                status,
                note: status === "SKIPPED" ? "Closed manually at +2.1R before final session target" : null,
            });
        }

        for (const gr of [riskMaxRule, hardSlRule, revengeRule, newsRule].filter(Boolean)) {
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: gr.id,
                status: "FOLLOWED",
                note: null,
            });
        }
    }

    // Process Losses (realistic behavioral leaks on specific rules -> powers Discipline Advisor!)
    for (let i = 0; i < recentLosses.length; i++) {
        const trade = recentLosses[i];
        const stratName = lossDistribution[i % lossDistribution.length];
        const strat = strategyMap.get(stratName);
        if (!strat) continue;

        const isImpulsiveLeak = i < 9; // First 9 losses broke key discipline rules
        const grade = strat.isPlaybook ? (isImpulsiveLeak ? "C" : "B") : null;
        const score = strat.isPlaybook ? (isImpulsiveLeak ? 40 : 67) : null;

        await prisma.journalEntry.update({
            where: { id: trade.id },
            data: {
                strategy: stratName,
                playbookGrade: grade,
                playbookComplianceScore: score,
                followedPlan: !isImpulsiveLeak,
            },
        });
        taggedTradeIds.push(trade.id);

        for (let rIdx = 0; rIdx < strat.tradingRules.length; rIdx++) {
            const sr = strat.tradingRules[rIdx];
            const brokeEntryRule = isImpulsiveLeak && rIdx === 1;
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: sr.id,
                status: brokeEntryRule ? "BROKEN" : "FOLLOWED",
                note: brokeEntryRule
                    ? "Entered early before M15 confirmation candle closed"
                    : null,
            });
        }

        // Primary Behavioral Leak #1: Revenge sizing (broken 8 times!)
        if (revengeRule) {
            const brokeRevenge = i < 8;
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: revengeRule.id,
                status: brokeRevenge ? "BROKEN" : "FOLLOWED",
                note: brokeRevenge
                    ? "Doubled lot size immediately after prior XAUUSD stop-out"
                    : null,
            });
        }

        // Secondary Leak #2: Late-night post-NY entries (broken 5 times)
        if (lateNightRule) {
            const brokeLateNight = i >= 2 && i < 7;
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: lateNightRule.id,
                status: brokeLateNight ? "BROKEN" : "FOLLOWED",
                note: brokeLateNight
                    ? "Took low-liquidity chop trade at 23:15 ICT"
                    : null,
            });
        }

        // Leak #3: Widened Stop-Loss (broken 3 times)
        if (hardSlRule) {
            const brokeSl = i < 3;
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: hardSlRule.id,
                status: brokeSl ? "BROKEN" : "FOLLOWED",
                note: brokeSl ? "Dragged SL 12 pips wider during NY open spike" : null,
            });
        }

        // Risk 1-2% rule (broken 2 times)
        if (riskMaxRule) {
            const brokeRisk = i < 2;
            ruleChecksToInsert.push({
                userId: TARGET_USER_ID,
                journalEntryId: trade.id,
                tradingRuleId: riskMaxRule.id,
                status: brokeRisk ? "BROKEN" : "FOLLOWED",
                note: brokeRisk ? "Oversized 3.2% risk on single Gold scalp" : null,
            });
        }
    }

    if (ruleChecksToInsert.length > 0) {
        await prisma.tradeRuleCheck.createMany({
            data: ruleChecksToInsert,
            skipDuplicates: true,
        });
    }

    fs.writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(
            {
                seededAt: new Date().toISOString(),
                createdStrategyIds,
                createdGlobalRuleIds,
                taggedTradeIds,
            },
            null,
            2
        )
    );

    console.log(
        `[seed-playbooks-rules-demo] Seeded ${createdStrategyIds.length} strategies/playbooks, ${createdGlobalRuleIds.length} global rules, tagged ${taggedTradeIds.length} closed trades, and inserted ${ruleChecksToInsert.length} rule compliance checks.`
    );
}

const isCleanup = process.argv.includes("--cleanup");
(isCleanup ? cleanupDemoData() : seedDemoData())
    .catch((err) => {
        console.error("[seed-playbooks-rules-demo] Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
