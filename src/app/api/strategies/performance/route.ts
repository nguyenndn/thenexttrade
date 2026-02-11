import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO, endOfDay } from "date-fns";

interface StrategyPerformance {
    strategy: string;
    color: string;
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
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
        const endDate = endDateParam ? endOfDay(parseISO(endDateParam)) : endOfMonth(now);

        // Get user's strategies with colors
        const strategies = await prisma.strategy.findMany({
            where: { userId: user.id },
            select: { name: true, color: true },
        });
        const strategyColors = new Map(strategies.map(s => [s.name, s.color]));

        // Get closed trades with strategy
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                strategy: { not: null },
                entryDate: { gte: startDate, lte: endDate },
            },
            select: {
                strategy: true,
                pnl: true,
                result: true,
            },
        });

        // Aggregate by strategy
        const strategyMap = new Map<string, {
            wins: number;
            losses: number;
            grossProfit: number;
            grossLoss: number;
            totalPnL: number;
        }>();

        for (const trade of trades) {
            if (!trade.strategy) continue;

            const current = strategyMap.get(trade.strategy) || {
                wins: 0,
                losses: 0,
                grossProfit: 0,
                grossLoss: 0,
                totalPnL: 0,
            };

            const pnl = trade.pnl || 0;
            current.totalPnL += pnl;

            if (trade.result === "WIN") {
                current.wins++;
                current.grossProfit += pnl;
            } else if (trade.result === "LOSS") {
                current.losses++;
                current.grossLoss += Math.abs(pnl);
            }

            strategyMap.set(trade.strategy, current);
        }

        // Build response
        const performance: StrategyPerformance[] = Array.from(strategyMap.entries())
            .map(([strategy, data]) => {
                const total = data.wins + data.losses;
                return {
                    strategy,
                    color: strategyColors.get(strategy) || "#6366F1",
                    totalTrades: total,
                    winCount: data.wins,
                    lossCount: data.losses,
                    winRate: total > 0 ? (data.wins / total) * 100 : 0,
                    totalPnL: data.totalPnL,
                    avgPnL: total > 0 ? data.totalPnL / total : 0,
                    profitFactor: data.grossLoss > 0
                        ? data.grossProfit / data.grossLoss
                        : data.grossProfit > 0 ? Infinity : 0,
                };
            })
            .sort((a, b) => b.totalPnL - a.totalPnL);

        return NextResponse.json({ performance });
    } catch (error) {
        console.error("Strategy performance error:", error);
        return NextResponse.json(
            { error: "Failed to fetch strategy performance" },
            { status: 500 }
        );
    }
}
