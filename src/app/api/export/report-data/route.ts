import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
} from "date-fns";

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

        // Fetch trades
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                entryDate: { gte: startDate, lte: endDate },
            },
            select: {
                entryDate: true,
                symbol: true,
                type: true,
                pnl: true,
                result: true,
                // @ts-ignore
                strategy: true,
                // riskReward: true, // Assuming this field might exist or be calculated, currently not in basics
            },
            orderBy: { entryDate: "desc" },
        });

        // Calculate summary stats
        const wins = trades.filter((t) => t.result === "WIN");
        const losses = trades.filter((t) => t.result === "LOSS");
        const breakEven = trades.filter((t) => t.result === "BREAK_EVEN");

        const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
        const netPnL = grossProfit - grossLoss;

        const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
        const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

        const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl || 0)) : 0;
        const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl || 0)) : 0;

        // By pair
        const pairMap = new Map<string, { pnl: number; wins: number; total: number }>();
        for (const trade of trades) {
            const symbol = trade.symbol;
            const current = pairMap.get(symbol) || { pnl: 0, wins: 0, total: 0 };
            current.pnl += trade.pnl || 0;
            current.total++;
            if (trade.result === "WIN") current.wins++;
            pairMap.set(symbol, current);
        }

        const byPair = Array.from(pairMap.entries())
            .map(([symbol, data]) => ({
                symbol,
                trades: data.total,
                pnl: data.pnl,
                winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
            }))
            .sort((a, b) => b.pnl - a.pnl);

        // By strategy
        const stratMap = new Map<string, { pnl: number; wins: number; total: number }>();
        for (const trade of trades) {
            const name = (trade as any).strategy || "No Strategy";
            const current = stratMap.get(name) || { pnl: 0, wins: 0, total: 0 };
            current.pnl += trade.pnl || 0;
            current.total++;
            if (trade.result === "WIN") current.wins++;
            stratMap.set(name, current);
        }

        const byStrategy = Array.from(stratMap.entries())
            .map(([name, data]) => ({
                name,
                trades: data.total,
                pnl: data.pnl,
                winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
            }))
            .sort((a, b) => b.pnl - a.pnl);

        // By day
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const byDay = days.map((day) => {
            const dayTrades = trades.filter((t) =>
                isSameDay(new Date(t.entryDate), day)
            );
            return {
                date: format(day, "MMM dd"),
                trades: dayTrades.length,
                pnl: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
            };
        });

        // Recent trades (last 10)
        const recentTrades = trades.slice(0, 10).map((t) => ({
            date: format(new Date(t.entryDate), "MMM dd"),
            symbol: t.symbol,
            type: t.type,
            pnl: t.pnl || 0,
            result: t.result || "",
        }));

        const reportData = {
            period: `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`,
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
            generatedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
            userName: user.name || user.email || "Trader",
            summary: {
                totalTrades: trades.length,
                winningTrades: wins.length,
                losingTrades: losses.length,
                breakEvenTrades: breakEven.length,
                winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
                netPnL,
                grossProfit,
                grossLoss,
                profitFactor: grossLoss > 0 ? grossProfit / grossLoss : 0,
                avgWin,
                avgLoss,
                largestWin,
                largestLoss,
            },
            byPair,
            byStrategy,
            byDay,
            recentTrades,
        };

        return NextResponse.json(reportData);
    } catch (error) {
        console.error("Report data error:", error);
        return NextResponse.json(
            { error: "Failed to generate report data" },
            { status: 500 }
        );
    }
}
