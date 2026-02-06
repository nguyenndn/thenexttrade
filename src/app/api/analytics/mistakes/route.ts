
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";
import { getMistakeByCode } from "@/lib/mistakes";

interface MistakeStats {
    code: string;
    name: string;
    category: string;
    severity: string;
    emoji: string;
    count: number;
    totalPnL: number;
    avgPnL: number;
    winRate: number;
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const now = new Date();
        const startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(now);
        const endDate = endDateParam ? parseISO(endDateParam) : endOfMonth(now);

        // Fetch closed trades
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                entryDate: { gte: startDate, lte: endDate },
            },
            select: {
                id: true,
                pnl: true,
                result: true,
                mistakes: true,
            },
        });

        // Separate trades with and without mistakes
        const tradesWithMistakes = trades.filter(t => {
            const mistakes = t.mistakes as string[];
            return mistakes && mistakes.length > 0;
        });
        const tradesWithoutMistakes = trades.filter(t => {
            const mistakes = t.mistakes as string[];
            return !mistakes || mistakes.length === 0;
        });

        // Calculate win rates
        const cleanWins = tradesWithoutMistakes.filter(t => t.result === "WIN").length;
        const cleanTradeWinRate = tradesWithoutMistakes.length > 0
            ? (cleanWins / tradesWithoutMistakes.length) * 100
            : 0;

        const mistakeWins = tradesWithMistakes.filter(t => t.result === "WIN").length;
        const mistakeTradeWinRate = tradesWithMistakes.length > 0
            ? (mistakeWins / tradesWithMistakes.length) * 100
            : 0;

        // Aggregate mistakes
        const mistakeMap = new Map<string, {
            count: number;
            totalPnL: number;
            wins: number;
            losses: number;
        }>();

        for (const trade of tradesWithMistakes) {
            const mistakes = trade.mistakes as string[];
            const pnl = trade.pnl || 0;

            for (const code of mistakes) {
                const current = mistakeMap.get(code) || {
                    count: 0, totalPnL: 0, wins: 0, losses: 0,
                };

                current.count++;
                current.totalPnL += pnl;

                if (trade.result === "WIN") current.wins++;
                if (trade.result === "LOSS") current.losses++;

                mistakeMap.set(code, current);
            }
        }

        // Build mistake stats
        const mistakeStats: MistakeStats[] = Array.from(mistakeMap.entries())
            .map(([code, data]) => {
                const mistake = getMistakeByCode(code);
                const total = data.wins + data.losses; // or just count? count includes break even
                // Let's use count for consistency
                const totalTrades = data.count;

                return {
                    code,
                    name: mistake?.name || code,
                    category: mistake?.category || "Other",
                    severity: mistake?.severity || "medium",
                    emoji: mistake?.emoji || "❓",
                    count: data.count,
                    totalPnL: data.totalPnL,
                    avgPnL: totalTrades > 0 ? data.totalPnL / totalTrades : 0,
                    winRate: totalTrades > 0 ? (data.wins / totalTrades) * 100 : 0,
                };
            })
            .sort((a, b) => a.totalPnL - b.totalPnL); // Sort by PnL (most costly first)

        // Aggregate by category
        const mistakesByCategory: Record<string, number> = {};
        for (const stat of mistakeStats) {
            mistakesByCategory[stat.category] = (mistakesByCategory[stat.category] || 0) + stat.count;
        }

        // Finding most costly and frequent
        const mostCostlyMistake = mistakeStats.length > 0 ? mistakeStats[0].code : null;

        // Most frequent
        const sortedByFreq = [...mistakeStats].sort((a, b) => b.count - a.count);
        const mostFrequentMistake = sortedByFreq.length > 0 ? sortedByFreq[0].code : null;

        // Calculate total cost of mistakes (Sum of PnL of all trades with mistakes? Or proportional?)
        // Simple approach: Sum of PnL of all trades that had at least one mistake.
        // NOTE: If a trade has 2 mistakes, we don't double count its PnL in the "Total Cost" metric for the user summary.
        const costOfMistakes = tradesWithMistakes.reduce((sum, t) => sum + (t.pnl || 0), 0);

        const totalMistakes = Array.from(mistakeMap.values()).reduce((sum, m) => sum + m.count, 0);

        return NextResponse.json({
            mistakeStats,
            totalMistakes,
            mostCostlyMistake,
            mostFrequentMistake,
            mistakesByCategory,
            tradesWithMistakes: tradesWithMistakes.length,
            tradesWithoutMistakes: tradesWithoutMistakes.length,
            cleanTradeWinRate,
            mistakeTradeWinRate,
            costOfMistakes,
        });
    } catch (error) {
        console.error("Mistakes analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch mistake analytics" },
            { status: 500 }
        );
    }
}
