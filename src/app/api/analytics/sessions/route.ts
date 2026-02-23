import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

interface SessionStats {
    session: string;
    displayName: string;
    color: string;
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
}

interface HourlyStats {
    hour: number;
    hourLabel: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
}

const SESSION_COLORS: Record<string, string> = {
    SYDNEY: "#F59E0B",      // Amber
    TOKYO: "#EF4444",       // Red
    LONDON: "#3B82F6",      // Blue
    NEW_YORK: "#10B981",    // Green
    LONDON_NY_OVERLAP: "#8B5CF6", // Purple
    TOKYO_LONDON_OVERLAP: "#EC4899", // Pink
    OFF_HOURS: "#6B7280",   // Gray
};

const SESSION_NAMES: Record<string, string> = {
    SYDNEY: "Sydney/Asian",
    TOKYO: "Tokyo",
    LONDON: "London",
    NEW_YORK: "New York",
    LONDON_NY_OVERLAP: "London/NY Overlap",
    TOKYO_LONDON_OVERLAP: "Tokyo/London Overlap",
    OFF_HOURS: "Off Hours",
};

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const accountId = searchParams.get("accountId");

        const now = new Date();
        const startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(now);
        const endDate = endDateParam ? parseISO(endDateParam) : endOfMonth(now);

        const whereClause: any = {
            userId: user.id,
            status: "CLOSED", // Only closed trades for PnL analysis
            entryDate: { gte: startDate, lte: endDate },
        };

        if (accountId) whereClause.accountId = accountId;

        // Fetch trades
        const trades = await prisma.journalEntry.findMany({ // Assuming JournalEntry is the model name
            where: whereClause,
            select: {
                id: true,
                pnl: true,
                status: true, // Assuming result/status is available
                exitPrice: true, // Check if win/loss is determined by status or pnl
                entryDate: true,
                tradingSession: true,
            },
        });

        // Calculate session for trades without session field
        const tradesWithSession = trades.map(trade => ({
            ...trade,
            session: trade.tradingSession || detectSession(trade.entryDate),
            // Determine Win/Loss based on PnL if not explicit
            isWin: (trade.pnl !== null && trade.pnl > 0),
            isLoss: (trade.pnl !== null && trade.pnl <= 0) // Treat 0 as loss or break-even? keeping simple for now
        }));

        // Group by session
        const sessionMap = new Map<string, {
            wins: number;
            losses: number;
            grossProfit: number;
            grossLoss: number;
            totalPnL: number;
        }>();

        for (const trade of tradesWithSession) {
            const current = sessionMap.get(trade.session) || {
                wins: 0, losses: 0, grossProfit: 0, grossLoss: 0, totalPnL: 0,
            };

            const pnl = trade.pnl || 0;
            current.totalPnL += pnl;

            if (trade.isWin) {
                current.wins++;
                current.grossProfit += pnl;
            } else {
                current.losses++;
                current.grossLoss += Math.abs(pnl);
            }

            sessionMap.set(trade.session, current);
        }

        // Build session stats
        const sessionStats: SessionStats[] = Array.from(sessionMap.entries())
            .map(([session, data]) => {
                const total = data.wins + data.losses;
                return {
                    session,
                    displayName: SESSION_NAMES[session] || session,
                    color: SESSION_COLORS[session] || "#6B7280",
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

        // Group by hour (0-23)
        const hourMap = new Map<number, { wins: number; total: number; pnl: number }>();

        for (const trade of tradesWithSession) {
            const hour = new Date(trade.entryDate).getUTCHours();
            const current = hourMap.get(hour) || { wins: 0, total: 0, pnl: 0 };

            current.total++;
            current.pnl += trade.pnl || 0;
            if (trade.isWin) current.wins++;

            hourMap.set(hour, current);
        }

        // Build hourly stats
        const hourlyStats: HourlyStats[] = Array.from(hourMap.entries())
            .map(([hour, data]) => ({
                hour,
                hourLabel: `${hour.toString().padStart(2, '0')}:00`,
                totalTrades: data.total,
                winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
                totalPnL: data.pnl,
            }))
            .sort((a, b) => a.hour - b.hour);

        // Fill missing hours
        const fullHourlyStats: HourlyStats[] = [];
        for (let i = 0; i < 24; i++) {
            const existing = hourlyStats.find(h => h.hour === i);
            if (existing) {
                fullHourlyStats.push(existing);
            } else {
                fullHourlyStats.push({
                    hour: i,
                    hourLabel: `${i.toString().padStart(2, '0')}:00`,
                    totalTrades: 0,
                    winRate: 0,
                    totalPnL: 0
                });
            }
        }

        // Find best/worst
        const bestSession = sessionStats.length > 0
            ? sessionStats.reduce((best, curr) => curr.totalPnL > best.totalPnL ? curr : best).session
            : null;

        const worstSession = sessionStats.length > 0
            ? sessionStats.reduce((worst, curr) => curr.totalPnL < worst.totalPnL ? curr : worst).session
            : null;

        const hourlyWithTrades = fullHourlyStats.filter(h => h.totalTrades >= 3);
        const bestHour = hourlyWithTrades.length > 0
            ? hourlyWithTrades.reduce((best, curr) => curr.winRate > best.winRate ? curr : best).hour
            : null;

        const worstHour = hourlyWithTrades.length > 0
            ? hourlyWithTrades.reduce((worst, curr) => curr.winRate < worst.winRate ? curr : worst).hour
            : null;

        // Generate recommendations
        const recommendations: { type: 'positive' | 'negative' | 'warning' | 'neutral', text: string }[] = [];

        // 1. Phân tích Session tốt nhất
        if (bestSession) {
            const best = sessionStats.find(s => s.session === bestSession);
            if (best) {
                if (best.profitFactor >= 2 && best.winRate >= 50) {
                    recommendations.push({
                        type: 'positive',
                        text: `Goldmine: The ${SESSION_NAMES[bestSession] || bestSession} session is highly consistent. Your Win Rate is ${best.winRate.toFixed(0)}% with a Profit Factor of ${best.profitFactor.toFixed(2)}. Prioritize capital allocation for this timeframe.`
                    });
                } else if (best.winRate > 55) {
                    recommendations.push({
                        type: 'positive',
                        text: `Solid Performance: Your win rate during the ${SESSION_NAMES[bestSession] || bestSession} session is excellent (${best.winRate.toFixed(0)}%). This is your safest window for entries.`
                    });
                } else if (best.totalPnL > 0) {
                     recommendations.push({
                        type: 'positive',
                        text: `Profitable: The ${SESSION_NAMES[bestSession] || bestSession} session yields your highest profit, despite a ${best.winRate.toFixed(0)}% win rate. Keep up this current Risk/Reward ratio.`
                    });
                }
            }
        }

        // 2. Phân tích Session tệ nhất
        if (worstSession && worstSession !== bestSession) {
            const worst = sessionStats.find(s => s.session === worstSession);
            if (worst) {
                if (worst.totalPnL < 0 && worst.profitFactor < 0.5) {
                    recommendations.push({
                        type: 'negative',
                        text: `Red Alert: The ${SESSION_NAMES[worstSession] || worstSession} session is draining your account. Profit Factor is critically low (${worst.profitFactor.toFixed(2)}). Recommendation: Stay out of the market during this session to preserve capital.`
                    });
                } else if (worst.winRate < 45) {
                    recommendations.push({
                        type: 'warning',
                        text: `Restrict Entries: Poor performance during the ${SESSION_NAMES[worstSession] || worstSession} session (${worst.winRate.toFixed(0)}% Win). Market structure here might not align with your core strategy.`
                    });
                }
            }
        }

        // 3. Phân tích Khung giờ
        if (bestHour !== null && worstHour !== null && bestHour !== worstHour) {
            const bHour = fullHourlyStats.find(h => h.hour === bestHour);
            const wHour = fullHourlyStats.find(h => h.hour === worstHour);
            
            if (bHour && bHour.winRate >= 60 && bHour.totalTrades >= 3) {
                recommendations.push({
                    type: 'positive',
                    text: `Golden Hour: ${bestHour.toString().padStart(2, '0')}:00 - ${bestHour.toString().padStart(2, '0')}:59 UTC is your peak performance window (${bHour.winRate.toFixed(0)}% Win).`
                });
            }
            if (wHour && wHour.winRate <= 30 && wHour.totalTrades >= 3) {
                recommendations.push({
                    type: 'negative',
                    text: `Danger Zone: You frequently face losses at ${worstHour.toString().padStart(2, '0')}:00 UTC (${wHour.winRate.toFixed(0)}% Win). It is highly recommended to step away from the charts during this hour.`
                });
            }
        }
        
        // 4. Fallback nếu Data chưa đủ cấu thành Insight sâu sắc
        if (recommendations.length === 0 && sessionStats.length > 0) {
             recommendations.push({
                 type: 'neutral',
                 text: "Insufficient Data: No session has proven exceptionally profitable or excessively risky yet. Keep journaling more trades to uncover actionable insights."
             });
        }

        return NextResponse.json({
            sessionStats,
            hourlyStats: fullHourlyStats,
            bestSession,
            worstSession,
            bestHour,
            worstHour,
            recommendations,
        });
    } catch (error) {
        console.error("Session analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch session analytics" },
            { status: 500 }
        );
    }
}

function detectSession(entryDate: Date): string {
    const dateObj = new Date(entryDate);
    const hour = dateObj.getUTCHours();

    const activeSessions: string[] = [];

    if (hour >= 21 || hour < 6) activeSessions.push("SYDNEY");
    if (hour >= 0 && hour < 9) activeSessions.push("TOKYO");
    if (hour >= 7 && hour < 16) activeSessions.push("LONDON");
    if (hour >= 12 && hour < 21) activeSessions.push("NEW_YORK");

    if (activeSessions.includes("LONDON") && activeSessions.includes("NEW_YORK")) {
        return "LONDON_NY_OVERLAP";
    }
    if (activeSessions.includes("TOKYO") && activeSessions.includes("LONDON")) {
        return "TOKYO_LONDON_OVERLAP";
    }

    return activeSessions[0] || "OFF_HOURS";
}
