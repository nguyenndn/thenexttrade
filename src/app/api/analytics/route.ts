import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
    startOfMonth,
    endOfMonth,
    parseISO,
    format,
    getDay,
    addHours,
    endOfDay
} from "date-fns";

export async function GET(request: NextRequest) {
    try {
        // 1. Auth check
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse query params
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const accountId = searchParams.get("accountId");

        // Default to current month if no dates provided
        const now = new Date();
        const startDate = startDateParam
            ? parseISO(startDateParam)
            : startOfMonth(now);
        const endDate = endDateParam
            ? endOfDay(parseISO(endDateParam))
            : endOfMonth(now);

        // 3. Build where clause
        // FIX: Use exitDate for P/L realization, not entryDate
        const whereClause: any = {
            userId: user.id,
            status: "CLOSED",
            exitDate: {
                gte: startDate,
                lte: endDate,
            },
        };

        if (accountId) {
            whereClause.accountId = accountId;
        }

        // 4. Fetch all closed trades in date range
        const trades = await prisma.journalEntry.findMany({
            where: whereClause,
            orderBy: { exitDate: "asc" }, // Order by exitDate
            select: {
                id: true,
                symbol: true,
                type: true,
                pnl: true,
                entryDate: true,
                exitDate: true,
                result: true,
                lotSize: true,
                entryPrice: true,
                exitPrice: true,
            },
        });

        // 5. Calculate summary
        const totalTrades = trades.length;
        const wins = trades.filter(t => t.result === "WIN");
        const losses = trades.filter(t => t.result === "LOSS");
        const breakEvens = trades.filter(t => t.result === "BREAK_EVEN");

        const winCount = wins.length;
        const lossCount = losses.length;
        const breakEvenCount = breakEvens.length;
        const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

        const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

        const avgWin = winCount > 0 ? grossProfit / winCount : 0;
        const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
        const avgRRR = avgLoss > 0 ? avgWin / avgLoss : 0;

        const pnlValues = trades.map(t => t.pnl || 0);
        const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
        const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

        // Calculate current streak
        let currentStreak = { type: "win" as "win" | "loss", count: 0 };
        // Reverse for streak calc (latest first)
        const reversedTrades = [...trades].reverse();
        if (reversedTrades.length > 0) {
            const firstResult = reversedTrades[0].result;
            if (firstResult === "WIN" || firstResult === "LOSS") {
                currentStreak.type = firstResult.toLowerCase() as "win" | "loss";
                for (const trade of reversedTrades) {
                    if (trade.result === firstResult) {
                        currentStreak.count++;
                    } else {
                        break;
                    }
                }
            }
        }

        // 5.5 Fetch current balance for accurate equity curve
        const accountFilter = accountId ? { userId: user.id, id: accountId } : { userId: user.id };
        const accounts = await prisma.tradingAccount.findMany({
            where: accountFilter,
            select: { balance: true }
        });
        const currentBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        // 6. Calculate equity curve
        // Backtrack from current balance to get starting balance of the period
        const totalPeriodPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        let runningBalance = currentBalance - totalPeriodPnL;

        const equityCurve: Array<{ date: string; balance: number; pnl: number }> = [];

        // Group trades by date (Broker Time Adjusted)
        const tradesByDate = new Map<string, number>();
        const BROKER_OFFSET_HOURS = 2; // Matches dashboard/page.tsx logic

        for (const trade of trades) {
            if (!trade.exitDate) continue;

            // Shift UTC time to Broker Time for correct daily grouping
            const brokerDate = addHours(trade.exitDate, BROKER_OFFSET_HOURS);
            // Use ISO string to get YYYY-MM-DD in UTC (which is our Broker Wall Clock time)
            // Avoids Local Timezone interference (e.g. GMT+7 shifting it further)
            const dateKey = brokerDate.toISOString().split('T')[0];

            const currentPnL = tradesByDate.get(dateKey) || 0;
            tradesByDate.set(dateKey, currentPnL + (trade.pnl || 0));
        }

        // Build equity curve & daily stats
        const sortedDates = Array.from(tradesByDate.keys()).sort();
        const dailyGrowthMap = new Map<string, number>();

        for (const dateKey of sortedDates) {
            const dayPnL = tradesByDate.get(dateKey) || 0;

            const growth = runningBalance !== 0 ? (dayPnL / runningBalance) * 100 : 0;
            dailyGrowthMap.set(dateKey, growth);

            runningBalance += dayPnL;

            equityCurve.push({
                date: dateKey,
                balance: runningBalance,
                pnl: dayPnL,
            });
        }

        // 7. Calculate daily P&L for calendar (Broker Time Adjusted)
        const dailyPnL = Array.from(tradesByDate.entries()).map(([date, pnl]) => {
            const tradesOnDate = trades.filter(t => {
                if (!t.exitDate) return false;
                const brokerDate = addHours(t.exitDate, BROKER_OFFSET_HOURS);
                return brokerDate.toISOString().split('T')[0] === date;
            });

            return {
                date,
                pnl,
                growth: dailyGrowthMap.get(date) || 0,
                tradeCount: tradesOnDate.length,
                trades: tradesOnDate.map(t => ({
                    id: t.id,
                    symbol: t.symbol,
                    type: t.type,
                    pnl: t.pnl || 0,
                    result: t.result
                }))
            };
        });

        // 8. Calculate pair performance
        const pairMap = new Map<string, { pnl: number; count: number; wins: number }>();
        for (const trade of trades) {
            const current = pairMap.get(trade.symbol) || { pnl: 0, count: 0, wins: 0 };
            pairMap.set(trade.symbol, {
                pnl: current.pnl + (trade.pnl || 0),
                count: current.count + 1,
                wins: current.wins + (trade.result === "WIN" ? 1 : 0),
            });
        }
        const pairPerformance = Array.from(pairMap.entries())
            .map(([symbol, data]) => ({
                symbol,
                pnl: data.pnl,
                tradeCount: data.count,
                winRate: (data.wins / data.count) * 100,
            }))
            .sort((a, b) => b.pnl - a.pnl);

        // 9. Calculate day of week performance (Broker Time Adjusted)
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayMap = new Map<number, { pnl: number; count: number }>();
        for (const trade of trades) {
            if (!trade.exitDate) continue;
            // Adjust day of week to Broker Time
            const brokerDate = addHours(trade.exitDate, BROKER_OFFSET_HOURS);
            const dayIndex = brokerDate.getUTCDay(); // Use UTC Day to avoid local timezone shift

            const current = dayMap.get(dayIndex) || { pnl: 0, count: 0 };
            dayMap.set(dayIndex, {
                pnl: current.pnl + (trade.pnl || 0),
                count: current.count + 1,
            });
        }
        const dayOfWeekPerformance = Array.from(dayMap.entries())
            .map(([dayIndex, data]) => ({
                day: dayNames[dayIndex],
                dayIndex,
                pnl: data.pnl,
                tradeCount: data.count,
            }))
            .sort((a, b) => a.dayIndex - b.dayIndex);

        // 10. Get recent trades
        const recentTrades = trades.slice(-10).reverse().map(t => ({
            id: t.id,
            symbol: t.symbol,
            type: t.type,
            pnl: t.pnl || 0,
            entryDate: t.entryDate.toISOString(), // Keep original timestamp
            exitDate: t.exitDate?.toISOString(),
            result: t.result || "BREAK_EVEN",
        }));

        // 11. Return response
        return NextResponse.json({
            summary: {
                totalTrades,
                winCount,
                lossCount,
                breakEvenCount,
                winRate,
                profitFactor,
                totalPnL,
                grossProfit,
                grossLoss,
                avgWin,
                avgLoss,
                avgRRR,
                bestTrade,
                worstTrade,
                currentStreak,
            },
            equityCurve,
            dailyPnL,
            pairPerformance,
            dayOfWeekPerformance,
            recentTrades,
        });
    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
