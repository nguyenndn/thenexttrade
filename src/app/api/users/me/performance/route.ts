
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const entries = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
            },
            orderBy: {
                entryDate: "asc",
            }
        });

        // --- Basic Stats ---
        const totalTrades = entries.length;
        if (totalTrades === 0) {
            return NextResponse.json({
                overview: {
                    netProfit: 0,
                    winRate: 0,
                    profitFactor: 0,
                    totalTrades: 0,
                    avgWin: 0,
                    avgLoss: 0,
                    bestPair: "N/A",
                    worstPair: "N/A"
                },
                equityCurve: [],
                pairStats: [],
                winLossDistribution: { WIN: 0, LOSS: 0, BREAK_EVEN: 0 }
            });
        }

        let totalWinPnL = 0;
        let totalLossPnL = 0;
        let winCount = 0;
        let lossCount = 0;
        let breakEvenCount = 0;
        let netProfit = 0;

        // --- Pair Stats Map ---
        const pairStatsMap: Record<string, { pnl: number, wins: number, total: number }> = {};

        // --- Equity Curve Data ---
        // Aggregate PnL by Date
        const equityMap: Record<string, number> = {};

        entries.forEach(entry => {
            const pnl = entry.pnl || 0;
            netProfit += pnl;

            // Basic Counts
            if (entry.result === "WIN") {
                winCount++;
                totalWinPnL += pnl;
            } else if (entry.result === "LOSS") {
                lossCount++;
                totalLossPnL += Math.abs(pnl); // Keep valid positive number for Factor Calc
            } else {
                breakEvenCount++;
            }

            // Pair Stats
            if (!pairStatsMap[entry.symbol]) {
                pairStatsMap[entry.symbol] = { pnl: 0, wins: 0, total: 0 };
            }
            pairStatsMap[entry.symbol].pnl += pnl;
            pairStatsMap[entry.symbol].total += 1;
            if (entry.result === "WIN") pairStatsMap[entry.symbol].wins += 1;

            // Equity Curve Preparation: Group by Day
            const dateStr = new Date(entry.entryDate).toISOString().split('T')[0];
            if (!equityMap[dateStr]) equityMap[dateStr] = 0;
            equityMap[dateStr] += pnl;
        });

        // --- Calculations ---
        const winRate = (winCount / totalTrades) * 100;
        const profitFactor = totalLossPnL === 0 ? totalWinPnL : (totalWinPnL / totalLossPnL);
        const avgWin = winCount > 0 ? totalWinPnL / winCount : 0;
        const avgLoss = lossCount > 0 ? (totalLossPnL / lossCount) * -1 : 0; // Negative value for display

        // Find Best/Worst Pair
        const pairsArr = Object.entries(pairStatsMap).map(([symbol, stats]) => ({
            symbol,
            ...stats,
            winRate: (stats.wins / stats.total) * 100
        }));

        const bestPairObj = pairsArr.reduce((prev, current) => (prev.pnl > current.pnl) ? prev : current, pairsArr[0]);
        const worstPairObj = pairsArr.reduce((prev, current) => (prev.pnl < current.pnl) ? prev : current, pairsArr[0]);

        // Build Equity Curve (Cumulative)
        const sortedDates = Object.keys(equityMap).sort();
        let runningBalance = 0;
        const equityCurve = sortedDates.map(date => {
            runningBalance += equityMap[date];
            return {
                date,
                pnl: equityMap[date],
                balance: runningBalance
            };
        });

        return NextResponse.json({
            overview: {
                netProfit,
                winRate,
                profitFactor,
                totalTrades,
                avgWin,
                avgLoss,
                bestPair: bestPairObj?.symbol || "N/A",
                worstPair: worstPairObj?.symbol || "N/A"
            },
            equityCurve,
            pairStats: pairsArr.sort((a, b) => b.pnl - a.pnl), // Sort by Profit
            winLossDistribution: { WIN: winCount, LOSS: lossCount, BREAK_EVEN: breakEvenCount }
        });

    } catch (error) {
        console.error("Performance API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
