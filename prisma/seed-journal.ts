// Seed 100 realistic XAUUSD journal entries
// Usage: npx tsx prisma/seed-journal.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomFloat(min: number, max: number, decimals = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    // Find first user
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) {
        console.error("No user found! Please sign in first.");
        process.exit(1);
    }
    console.log(`Found user: ${user.id}`);

    // Target account ID (from user's Trading Accounts page)
    const TARGET_ACCOUNT_ID = "cmlpeb7260003k0js0qo840wm";

    const account = await prisma.tradingAccount.findUnique({
        where: { id: TARGET_ACCOUNT_ID },
        select: { id: true, name: true }
    });

    if (!account) {
        console.error(`Account ${TARGET_ACCOUNT_ID} not found!`);
        process.exit(1);
    }
    console.log(`Using account: ${account.name} (${account.id})`);

    // Clean up any previously seeded XAUUSD entries in this account
    const deleted = await prisma.journalEntry.deleteMany({
        where: { userId: user.id, symbol: "XAUUSD" }
    });
    if (deleted.count > 0) {
        console.log(`Cleaned up ${deleted.count} old XAUUSD entries`);
    }

    // Tags pool
    const tagPool = ["Breakout", "Trend", "Scalp", "News", "Support", "Resistance", "Reversal", "Asian Session", "London Open", "NY Session"];
    const sessions = ["Sydney", "Tokyo", "London", "New York"];
    const emotions = ["Calm", "Confident", "Anxious", "Excited", "Neutral", "Focused"];

    // Generate 100 trades spanning the last 3 months
    const now = new Date();
    const entries = [];

    for (let i = 0; i < 100; i++) {
        // Random date within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const hoursOffset = Math.floor(Math.random() * 16) + 1; // 1-16 hours for trade duration

        const entryDate = new Date(now);
        entryDate.setDate(now.getDate() - daysAgo);
        entryDate.setHours(Math.floor(Math.random() * 20) + 2, Math.floor(Math.random() * 60), 0, 0);

        const exitDate = new Date(entryDate);
        exitDate.setHours(exitDate.getHours() + hoursOffset);

        // XAUUSD realistic prices (2400-2700 range)
        const basePrice = randomFloat(2450, 2680, 2);
        const type = randomChoice(["BUY", "SELL"] as const);

        // Generate realistic entry/exit with some spread
        const entryPrice = basePrice;

        // Win rate ~55-60% for realistic results 
        const isWin = Math.random() < 0.57;
        const pipsMove = randomFloat(5, 80, 2); // 5-80 pips movement

        let exitPrice: number;
        if (type === "BUY") {
            exitPrice = isWin
                ? parseFloat((entryPrice + pipsMove).toFixed(2))
                : parseFloat((entryPrice - pipsMove).toFixed(2));
        } else {
            exitPrice = isWin
                ? parseFloat((entryPrice - pipsMove).toFixed(2))
                : parseFloat((entryPrice + pipsMove).toFixed(2));
        }

        // Lot size variations
        const lotSize = randomChoice([0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.5]);

        // PnL calculation (XAUUSD: 1 lot = 100 oz, so PnL = pips * lotSize * 100)
        const rawPnl = type === "BUY"
            ? (exitPrice - entryPrice) * lotSize * 100
            : (entryPrice - exitPrice) * lotSize * 100;
        const pnl = parseFloat(rawPnl.toFixed(2));

        // SL/TP
        const slDistance = randomFloat(10, 50, 2);
        const tpDistance = randomFloat(15, 100, 2);
        const stopLoss = type === "BUY" ? entryPrice - slDistance : entryPrice + slDistance;
        const takeProfit = type === "BUY" ? entryPrice + tpDistance : entryPrice - tpDistance;

        // Result
        let result: "WIN" | "LOSS" | "BREAK_EVEN";
        if (Math.abs(pnl) < 1) {
            result = "BREAK_EVEN";
        } else if (pnl > 0) {
            result = "WIN";
        } else {
            result = "LOSS";
        }

        // Random tags (0-3)
        const numTags = Math.floor(Math.random() * 4);
        const tags: string[] = [];
        for (let t = 0; t < numTags; t++) {
            const tag = randomChoice(tagPool);
            if (!tags.includes(tag)) tags.push(tag);
        }

        entries.push({
            userId: user.id,
            accountId: account.id,
            symbol: "XAUUSD",
            type: type as any,
            entryPrice,
            exitPrice,
            stopLoss: parseFloat(stopLoss.toFixed(2)),
            takeProfit: parseFloat(takeProfit.toFixed(2)),
            lotSize,
            pnl,
            commission: randomFloat(-2, -0.5, 2),
            swap: randomFloat(-1, 0.5, 2),
            status: "CLOSED" as any,
            result: result as any,
            entryDate,
            exitDate,
            entryReason: randomChoice([
                "Break above resistance zone",
                "Trendline bounce on H4",
                "Bullish engulfing at support",
                "Bearish rejection at supply zone",
                "Moving average crossover",
                "RSI divergence signal",
                "London session breakout",
                "Pullback to 50% Fib level",
                "Double bottom formation",
                "Head and shoulders pattern",
            ]),
            exitReason: randomChoice([
                "Hit take profit target",
                "Stop loss triggered",
                "Manual close at resistance",
                "Trailing stop hit",
                "End of session close",
                "Reversal signal appeared",
                "News event risk management",
                "Target reached early",
            ]),
            notes: randomChoice([
                "Good execution, followed plan well.",
                "Market was choppy, need to be more patient.",
                "Entry was slightly late, but trade played out.",
                "Perfect setup, textbook trade.",
                "Emotional entry, should have waited for confirmation.",
                "Risk-reward was excellent on this setup.",
                null,
                null,
            ]),
            tags,
            tradingSession: randomChoice(sessions),
            emotionBefore: randomChoice(emotions),
            emotionAfter: randomChoice(emotions),
            confidenceLevel: Math.floor(Math.random() * 5) + 1,
            followedPlan: Math.random() > 0.3, // 70% followed plan
            images: [],
        });
    }

    // Sort by entryDate for cleaner insertion
    entries.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());

    console.log(`Inserting ${entries.length} journal entries...`);

    // Batch insert
    const result = await prisma.journalEntry.createMany({
        data: entries,
    });

    console.log(`✅ Successfully seeded ${result.count} XAUUSD journal entries!`);

    // Print summary
    const wins = entries.filter(e => e.result === "WIN").length;
    const losses = entries.filter(e => e.result === "LOSS").length;
    const totalPnl = entries.reduce((sum, e) => sum + e.pnl, 0);
    console.log(`   Wins: ${wins} | Losses: ${losses} | Win Rate: ${((wins / entries.length) * 100).toFixed(1)}%`);
    console.log(`   Total PnL: $${totalPnl.toFixed(2)}`);
    console.log(`   Date Range: ${entries[0].entryDate.toLocaleDateString()} → ${entries[entries.length - 1].entryDate.toLocaleDateString()}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
