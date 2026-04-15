import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO, endOfDay } from "date-fns";

interface EmotionStats {
    emotion: string;
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
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

        // Fetch closed trades with psychology data
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                entryDate: { gte: startDate, lte: endDate },
            },
            orderBy: { entryDate: "asc" },
            select: {
                id: true,
                pnl: true,
                result: true,
                entryDate: true,
                lotSize: true,
                emotionBefore: true,
                emotionAfter: true,
                confidenceLevel: true,
                followedPlan: true,
            },
        });

        // Calculate emotion before stats
        const emotionBeforeMap = new Map<string, { wins: number; losses: number; pnl: number }>();
        for (const trade of trades) {
            if (!trade.emotionBefore) continue;
            const current = emotionBeforeMap.get(trade.emotionBefore) || { wins: 0, losses: 0, pnl: 0 };
            current.pnl += trade.pnl || 0;
            if (trade.result === "WIN") current.wins++;
            if (trade.result === "LOSS") current.losses++;
            emotionBeforeMap.set(trade.emotionBefore, current);
        }

        const emotionBeforeStats: EmotionStats[] = Array.from(emotionBeforeMap.entries())
            .map(([emotion, data]) => {
                const total = data.wins + data.losses;
                return {
                    emotion,
                    totalTrades: total,
                    winCount: data.wins,
                    lossCount: data.losses,
                    winRate: total > 0 ? (data.wins / total) * 100 : 0,
                    totalPnL: data.pnl,
                    avgPnL: total > 0 ? data.pnl / total : 0,
                };
            })
            .sort((a, b) => b.winRate - a.winRate);

        // Calculate emotion after stats
        const emotionAfterMap = new Map<string, { wins: number; losses: number; pnl: number }>();
        for (const trade of trades) {
            if (!trade.emotionAfter) continue;
            const current = emotionAfterMap.get(trade.emotionAfter) || { wins: 0, losses: 0, pnl: 0 };
            current.pnl += trade.pnl || 0;
            if (trade.result === "WIN") current.wins++;
            if (trade.result === "LOSS") current.losses++;
            emotionAfterMap.set(trade.emotionAfter, current);
        }

        const emotionAfterStats: EmotionStats[] = Array.from(emotionAfterMap.entries())
            .map(([emotion, data]) => {
                const total = data.wins + data.losses;
                return {
                    emotion,
                    totalTrades: total,
                    winCount: data.wins,
                    lossCount: data.losses,
                    winRate: total > 0 ? (data.wins / total) * 100 : 0,
                    totalPnL: data.pnl,
                    avgPnL: total > 0 ? data.pnl / total : 0,
                };
            });

        // Confidence level correlation
        const confidenceMap = new Map<number, { wins: number; total: number; pnl: number }>();
        for (const trade of trades) {
            if (trade.confidenceLevel === null) continue;
            const current = confidenceMap.get(trade.confidenceLevel) || { wins: 0, total: 0, pnl: 0 };
            current.total++;
            current.pnl += trade.pnl || 0;
            if (trade.result === "WIN") current.wins++;
            confidenceMap.set(trade.confidenceLevel, current);
        }

        const confidenceCorrelation = Array.from(confidenceMap.entries())
            .map(([level, data]) => ({
                level,
                winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
                avgPnL: data.total > 0 ? data.pnl / data.total : 0,
                tradeCount: data.total,
            }))
            .sort((a, b) => a.level - b.level);

        // Plan adherence stats
        const followed = trades.filter(t => t.followedPlan === true);
        const notFollowed = trades.filter(t => t.followedPlan === false);

        const planAdherenceStats = {
            followed: {
                count: followed.length,
                winRate: followed.length > 0
                    ? (followed.filter(t => t.result === "WIN").length / followed.length) * 100
                    : 0,
                totalPnL: followed.reduce((sum, t) => sum + (t.pnl || 0), 0),
            },
            notFollowed: {
                count: notFollowed.length,
                winRate: notFollowed.length > 0
                    ? (notFollowed.filter(t => t.result === "WIN").length / notFollowed.length) * 100
                    : 0,
                totalPnL: notFollowed.reduce((sum, t) => sum + (t.pnl || 0), 0),
            },
        };

        // Tilt indicators
        const revengeTrades = trades.filter(t => t.emotionBefore === "revenge");
        const fomoTrades = trades.filter(t => t.emotionBefore === "fomo");

        // Calculate avg PnL after previous trade result
        let afterLossPnL = 0;
        let afterLossCount = 0;
        let afterWinPnL = 0;
        let afterWinCount = 0;

        for (let i = 1; i < trades.length; i++) {
            const prevTrade = trades[i - 1];
            const currentTrade = trades[i];

            if (prevTrade.result === "LOSS") {
                afterLossPnL += currentTrade.pnl || 0;
                afterLossCount++;
            } else if (prevTrade.result === "WIN") {
                afterWinPnL += currentTrade.pnl || 0;
                afterWinCount++;
            }
        }

        // Advanced Tilt Indicators (Consecutive Losses & Martingale)
        let currentLossStreak = 0;
        let maxLossStreak = 0;
        let sizingUpCount = 0; // Count instances where size increased > 50% after a loss
        let winStreakSizeUp = 0; // Overconfidence: sizing up after wins
        let notFollowingPlanStreak = 0;
        let maxNotFollowingPlanStreak = 0;
        const sortedTrades = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

        // Calculate average lot size
        const totalLots = sortedTrades.reduce((sum, t) => sum + (t.lotSize || 0), 0);
        const avgLotSize = sortedTrades.length > 0 ? totalLots / sortedTrades.length : 0;

        // Overtrading detection: count days with > 5 trades
        const tradesByDay = new Map<string, number>();
        for (const trade of sortedTrades) {
            const dayKey = new Date(trade.entryDate).toISOString().split('T')[0];
            tradesByDay.set(dayKey, (tradesByDay.get(dayKey) || 0) + 1);
        }
        const overtradingDays = Array.from(tradesByDay.values()).filter(count => count > 5).length;

        for (let i = 0; i < sortedTrades.length; i++) {
            const trade = sortedTrades[i];

            // Streak calculation
            if (trade.result === "LOSS") {
                currentLossStreak++;
                maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
            } else {
                currentLossStreak = 0;
            }

            // Not following plan streak
            if (trade.followedPlan === false) {
                notFollowingPlanStreak++;
                maxNotFollowingPlanStreak = Math.max(maxNotFollowingPlanStreak, notFollowingPlanStreak);
            } else if (trade.followedPlan === true) {
                notFollowingPlanStreak = 0;
            }

            // Martingale detection (check if previous trade was loss, and current size is significantly larger)
            if (i > 0) {
                const prevTrade = sortedTrades[i - 1];
                if (prevTrade.result === "LOSS") {
                    const sizeIncrease = (trade.lotSize || 0) / (prevTrade.lotSize || 1);
                    // If size increased by > 50% AND is significantly above average
                    if (sizeIncrease > 1.5 && (trade.lotSize || 0) > avgLotSize) {
                        sizingUpCount++;
                    }
                }

                // Overconfidence: sizing up after consecutive wins
                if (prevTrade.result === "WIN") {
                    const sizeIncrease = (trade.lotSize || 0) / (prevTrade.lotSize || 1);
                    if (sizeIncrease > 1.5 && (trade.lotSize || 0) > avgLotSize) {
                        winStreakSizeUp++;
                    }
                }
            }
        }

        const tiltIndicators = {
            revengeTradeCount: revengeTrades.length,
            fomoTradeCount: fomoTrades.length,
            avgPnLAfterLoss: afterLossCount > 0 ? afterLossPnL / afterLossCount : 0,
            avgPnLAfterWin: afterWinCount > 0 ? afterWinPnL / afterWinCount : 0,
            currentLossStreak, // Current active streak at the end of the period
            maxLossStreak,
            sizingUpCount, // Potential martingale/revenge sizing
            // NEW indicators
            overtradingDays, // Days with > 5 trades
            winStreakSizeUp, // Overconfidence sizing after wins
            notFollowingPlanStreak: maxNotFollowingPlanStreak, // Max streak of not following plan
        };

        // Emotion Trend: weekly aggregation
        const weekMap = new Map<string, { weekStart: string; emotions: Map<string, number>; wins: number; total: number; pnl: number }>();
        for (const trade of sortedTrades) {
            const d = new Date(trade.entryDate);
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
            const key = weekStart.toISOString().split('T')[0];
            if (!weekMap.has(key)) {
                weekMap.set(key, { weekStart: key, emotions: new Map(), wins: 0, total: 0, pnl: 0 });
            }
            const week = weekMap.get(key)!;
            week.total++;
            week.pnl += trade.pnl || 0;
            if (trade.result === "WIN") week.wins++;
            if (trade.emotionBefore) {
                week.emotions.set(trade.emotionBefore, (week.emotions.get(trade.emotionBefore) || 0) + 1);
            }
        }
        const emotionTrend = Array.from(weekMap.values())
            .map(w => {
                let dominant = "—";
                let maxCount = 0;
                w.emotions.forEach((count, emotion) => { if (count > maxCount) { maxCount = count; dominant = emotion; } });
                return {
                    weekStart: w.weekStart,
                    winRate: w.total > 0 ? (w.wins / w.total) * 100 : 0,
                    avgPnL: w.total > 0 ? w.pnl / w.total : 0,
                    tradeCount: w.total,
                    dominantEmotion: dominant,
                };
            })
            .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

        // Mood Heatmap: day-of-week × trading session (UTC-based)
        const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const SLOTS = ["Sydney", "Tokyo", "London", "New York"]; // 21-03, 03-09, 09-15, 15-21 UTC
        const heatmapGrid: Record<string, { trades: number; wins: number; emotions: Map<string, number> }> = {};
        for (const day of DAYS) for (const slot of SLOTS) {
            heatmapGrid[`${day}-${slot}`] = { trades: 0, wins: 0, emotions: new Map() };
        }
        for (const trade of sortedTrades) {
            const d = new Date(trade.entryDate);
            const dayIndex = d.getUTCDay(); // 0=Sun..6=Sat
            if (dayIndex === 0 || dayIndex === 6) continue;
            const dayName = DAYS[dayIndex - 1];
            const hour = d.getUTCHours();
            const slot = hour >= 21 || hour < 3 ? "Sydney" : hour < 9 ? "Tokyo" : hour < 15 ? "London" : "New York";
            const cell = heatmapGrid[`${dayName}-${slot}`];
            if (!cell) continue;
            cell.trades++;
            if (trade.result === "WIN") cell.wins++;
            if (trade.emotionBefore) {
                cell.emotions.set(trade.emotionBefore, (cell.emotions.get(trade.emotionBefore) || 0) + 1);
            }
        }
        const moodHeatmap = DAYS.map(day => ({
            day,
            slots: SLOTS.map(slot => {
                const cell = heatmapGrid[`${day}-${slot}`];
                let dominant = "—";
                let maxC = 0;
                cell.emotions.forEach((c, e) => { if (c > maxC) { maxC = c; dominant = e; } });
                return {
                    slot,
                    trades: cell.trades,
                    winRate: cell.trades > 0 ? (cell.wins / cell.trades) * 100 : 0,
                    dominantEmotion: dominant,
                };
            }),
        }));

        return NextResponse.json({
            emotionBeforeStats,
            emotionAfterStats,
            confidenceCorrelation,
            planAdherenceStats,
            tiltIndicators,
            emotionTrend,
            moodHeatmap,
        });
    } catch (error) {
        console.error("Psychology analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch psychology analytics" },
            { status: 500 }
        );
    }
}
