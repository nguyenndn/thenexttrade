import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { subDays, addDays, startOfMonth } from "date-fns";
import { TradeType, TradeStatus, TradeResult } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if we already have data to avoid double seeding
        const count = await prisma.journalEntry.count({
            where: { userId: user.id }
        });

        if (count > 5) {
            return NextResponse.json({ message: "Data already exists", count });
        }

        // Generate valid trading pairs
        const pairs = ["EURUSD", "GBPUSD", "XAUUSD", "US30", "BTCUSD", "ETHUSD", "USDJPY"];
        const types: TradeType[] = ["BUY", "SELL"];

        // Create ~50 trades for the current and previous month
        const trades = [];
        const today = new Date();
        const startDate = subDays(today, 45); // Start 45 days ago

        for (let i = 0; i < 50; i++) {
            // Random date between startDate and today
            const dateOffset = Math.floor(Math.random() * 45);
            const entryDate = addDays(startDate, dateOffset);

            // Random outcome (45% Win, 45% Loss, 10% BE)
            const rand = Math.random();
            let result: TradeResult = "LOSS";
            let pnl = 0;

            if (rand > 0.55) {
                result = "WIN";
                pnl = Math.floor(Math.random() * 500) + 100; // Win $100-$600
            } else if (rand > 0.1) {
                result = "LOSS";
                pnl = -Math.floor(Math.random() * 300) - 50; // Loss $50-$350
            } else {
                result = "BREAK_EVEN";
                pnl = 0;
            }

            const symbol = pairs[Math.floor(Math.random() * pairs.length)];

            trades.push({
                userId: user.id,
                symbol: symbol,
                type: types[Math.floor(Math.random() * types.length)],
                entryDate: entryDate,
                exitDate: addDays(entryDate, Math.random() < 0.8 ? 0 : 1), // Mostly intraday
                entryPrice: Math.random() * 2000,
                exitPrice: Math.random() * 2000,
                lotSize: 1,
                pnl: pnl,
                status: "CLOSED" as TradeStatus,
                result: result,
                notes: "Auto-generated dummy trade | Strategy: Trend Following | Session: NY",
                images: []
            });
        }

        // Bulk create
        await prisma.journalEntry.createMany({
            data: trades
        });

        return NextResponse.json({ success: true, message: `Created ${trades.length} dummy trades` });

    } catch (error) {
        console.error("Seeding Error:", error);
        return NextResponse.json(
            { error: "Failed to seed data" },
            { status: 500 }
        );
    }
}
