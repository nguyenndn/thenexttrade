import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePartnerAuth } from "@/lib/partner-auth";
import { maskAccountNumber, maskName } from "@/lib/masking";

/**
 * GET /api/v1/partners/[partner_code]/performance
 * Outbound Performance API — Partner pulls aggregated performance data
 * 
 * Query params:
 *   - accountCode: specific account code to filter
 *   - period: "all" | "3m" | "6m" | "1y" (default: "all")
 */
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ partner_code: string }> }
) {
    const { partner_code } = await props.params;

    try {
        // Authenticate partner
        const auth = await validatePartnerAuth(request, partner_code);
        if (!auth.success || !auth.partner) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status || 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const accountCode = searchParams.get("accountCode");
        const period = searchParams.get("period") || "all";

        // Get all approved registrations for this partner
        const registrations = await prisma.copyTradingRegistration.findMany({
            where: {
                partnerCode: partner_code,
                status: "APPROVED",
                ...(accountCode ? { mt5AccountNumber: accountCode } : {}),
            },
            select: {
                id: true,
                fullName: true,
                mt5AccountNumber: true,
                brokerName: true,
                customBrokerName: true,
                mt5Server: true,
                customServer: true,
                tradingCapital: true,
                createdAt: true,
            }
        });

        if (registrations.length === 0) {
            return NextResponse.json({
                meta: {
                    generatedAt: new Date().toISOString(),
                    partnerCode: partner_code,
                    cacheExpiresIn: 300,
                },
                accounts: [],
                message: accountCode
                    ? "No approved account found with this code"
                    : "No approved accounts for this partner"
            });
        }

        // Build date filter based on period
        const dateFilter = getPeriodDateFilter(period);

        // Build performance data for each registration
        const accounts = await Promise.all(
            registrations.map(async (reg) => {
                // Try to find a linked TradingAccount by MT5 account number
                const tradingAccount = await prisma.tradingAccount.findFirst({
                    where: {
                        accountNumber: reg.mt5AccountNumber,
                    },
                    select: {
                        id: true,
                        balance: true,
                        equity: true,
                        leverage: true,
                        currency: true,
                        status: true,
                        lastSync: true,
                    }
                });

                // Get trade history for this account
                const trades = tradingAccount
                    ? await prisma.journalEntry.findMany({
                        where: {
                            accountId: tradingAccount.id,
                            status: "CLOSED",
                            ...(dateFilter ? { exitDate: dateFilter } : {}),
                        },
                        select: {
                            pnl: true,
                            commission: true,
                            swap: true,
                            result: true,
                            exitDate: true,
                            symbol: true,
                            lotSize: true,
                            entryDate: true,
                        },
                        orderBy: { exitDate: "asc" }
                    })
                    : [];

                // Calculate stats
                const stats = calculatePerformanceStats(trades, tradingAccount, reg);
                const broker = reg.customBrokerName || reg.brokerName;
                const server = reg.customServer || reg.mt5Server || "";

                return {
                    accountInfo: {
                        accountCode: reg.mt5AccountNumber,
                        maskedAccountNumber: maskAccountNumber(reg.mt5AccountNumber),
                        maskedClientName: maskName(reg.fullName),
                        broker,
                        server,
                        currency: tradingAccount?.currency || "USD",
                        leverage: tradingAccount?.leverage || "N/A",
                        status: tradingAccount?.status || "PENDING",
                        lastUpdated: tradingAccount?.lastSync?.toISOString() || null,
                    },
                    ...stats,
                };
            })
        );

        return NextResponse.json({
            meta: {
                generatedAt: new Date().toISOString(),
                partnerCode: partner_code,
                cacheExpiresIn: 300,
                totalAccounts: accounts.length,
            },
            accounts: accountCode ? accounts[0] || null : accounts,
        }, {
            headers: {
                "Cache-Control": "public, max-age=300", // 5 min CDN cache
            }
        });

    } catch (error) {
        console.error("[Partner API] Performance error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPeriodDateFilter(period: string) {
    if (period === "all") return null;

    const now = new Date();
    const months: Record<string, number> = { "3m": 3, "6m": 6, "1y": 12 };
    const m = months[period];
    if (!m) return null;

    const from = new Date(now);
    from.setMonth(from.getMonth() - m);
    return { gte: from };
}

interface Trade {
    pnl: number | null;
    commission: number | null;
    swap: number | null;
    result: string | null;
    exitDate: Date | null;
    symbol: string;
    lotSize: number;
    entryDate: Date;
}

function calculatePerformanceStats(
    trades: Trade[],
    account: { balance: number; equity: number | null } | null,
    reg: { tradingCapital: number }
) {
    if (trades.length === 0) {
        return {
            coreMetrics: {
                balance: account?.balance || 0,
                equity: account?.equity || 0,
                totalDeposits: reg.tradingCapital,
                totalWithdrawals: 0,
                highestBalance: account?.balance || 0,
                netDeposits: reg.tradingCapital,
            },
            advancedStats: {
                growthPercent: 0,
                maxDrawdownPercent: 0,
                maxDrawdownUsd: 0,
                totalNetProfit: 0,
                grossProfit: 0,
                grossLoss: 0,
                profitFactor: 0,
                winRatePercent: 0,
                totalTrades: 0,
                winCount: 0,
                lossCount: 0,
                bestTrade: 0,
                worstTrade: 0,
                recoveryFactor: 0,
                avgHoldTime: "N/A",
            },
            dailyCalendar: {},
            monthlyCalendar: {},
            growthChartArray: [],
            instrumentDistribution: [],
        };
    }

    // Core calculations
    let grossProfit = 0;
    let grossLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    let totalHoldTimeMs = 0;

    const dailyMap = new Map<string, { profit: number; tradesCount: number }>();
    const monthlyMap = new Map<string, { profit: number; growthPct: number }>();
    const symbolMap = new Map<string, { profit: number; winRate: number; wins: number; total: number }>();

    trades.forEach(trade => {
        const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);

        if (netPnl > 0) {
            grossProfit += netPnl;
            winCount++;
        } else if (netPnl < 0) {
            grossLoss += Math.abs(netPnl);
            lossCount++;
        }

        bestTrade = Math.max(bestTrade, netPnl);
        worstTrade = Math.min(worstTrade, netPnl);

        // Hold time
        if (trade.exitDate && trade.entryDate) {
            totalHoldTimeMs += trade.exitDate.getTime() - trade.entryDate.getTime();
        }

        // Daily calendar
        if (trade.exitDate) {
            const dayKey = trade.exitDate.toISOString().slice(0, 10);
            const day = dailyMap.get(dayKey) || { profit: 0, tradesCount: 0 };
            day.profit += netPnl;
            day.tradesCount++;
            dailyMap.set(dayKey, day);
        }

        // Monthly calendar
        if (trade.exitDate) {
            const monthKey = trade.exitDate.toISOString().slice(0, 7);
            const month = monthlyMap.get(monthKey) || { profit: 0, growthPct: 0 };
            month.profit += netPnl;
            monthlyMap.set(monthKey, month);
        }

        // Symbol distribution
        const sym = symbolMap.get(trade.symbol) || { profit: 0, winRate: 0, wins: 0, total: 0 };
        sym.profit += netPnl;
        sym.total++;
        if (netPnl > 0) sym.wins++;
        sym.winRate = Math.round((sym.wins / sym.total) * 100);
        symbolMap.set(trade.symbol, sym);
    });

    const totalNetProfit = grossProfit - grossLoss;
    const totalTrades = trades.length;
    const initialBalance = reg.tradingCapital || (account?.balance || 0) - totalNetProfit;
    const growthPercent = initialBalance > 0 ? round((totalNetProfit / initialBalance) * 100) : 0;
    const profitFactor = grossLoss > 0 ? round(grossProfit / grossLoss) : grossProfit > 0 ? 999 : 0;
    const winRatePercent = totalTrades > 0 ? round((winCount / totalTrades) * 100) : 0;

    // Max drawdown calculation
    let peak = initialBalance;
    let maxDD = 0;
    let runningBalance = initialBalance;

    trades.forEach(trade => {
        const netPnl = (trade.pnl || 0) + (trade.commission || 0) + (trade.swap || 0);
        runningBalance += netPnl;
        if (runningBalance > peak) peak = runningBalance;
        const dd = peak - runningBalance;
        if (dd > maxDD) maxDD = dd;
    });

    const maxDrawdownPercent = peak > 0 ? round((maxDD / peak) * 100) : 0;
    const recoveryFactor = maxDD > 0 ? round(totalNetProfit / maxDD) : 0;

    // Average hold time
    const avgHoldMs = totalTrades > 0 ? totalHoldTimeMs / totalTrades : 0;
    const avgHoldTime = formatHoldTime(avgHoldMs);

    // Growth chart array
    let chartBalance = initialBalance;
    let chartPeak = initialBalance;
    const growthChartArray = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, day]) => {
            chartBalance += day.profit;
            if (chartBalance > chartPeak) chartPeak = chartBalance;
            const ddPct = chartPeak > 0 ? round(((chartPeak - chartBalance) / chartPeak) * 100) : 0;
            return {
                date,
                balance: round(chartBalance),
                drawdownPct: ddPct,
                dailyProfit: round(day.profit),
            };
        });

    // Monthly growthPct
    for (const [, month] of monthlyMap) {
        month.growthPct = initialBalance > 0 ? round((month.profit / initialBalance) * 100) : 0;
        month.profit = round(month.profit);
    }

    // Round daily profits
    for (const [, day] of dailyMap) {
        day.profit = round(day.profit);
    }

    return {
        coreMetrics: {
            balance: round(account?.balance || 0),
            equity: round(account?.equity || 0),
            totalDeposits: reg.tradingCapital,
            totalWithdrawals: 0,
            highestBalance: round(peak),
            netDeposits: reg.tradingCapital,
        },
        advancedStats: {
            growthPercent,
            maxDrawdownPercent,
            maxDrawdownUsd: round(maxDD),
            totalNetProfit: round(totalNetProfit),
            grossProfit: round(grossProfit),
            grossLoss: round(-grossLoss),
            profitFactor,
            winRatePercent,
            totalTrades,
            winCount,
            lossCount,
            bestTrade: round(bestTrade === -Infinity ? 0 : bestTrade),
            worstTrade: round(worstTrade === Infinity ? 0 : worstTrade),
            recoveryFactor,
            avgHoldTime,
        },
        dailyCalendar: Object.fromEntries(dailyMap),
        monthlyCalendar: Object.fromEntries(monthlyMap),
        growthChartArray,
        instrumentDistribution: Array.from(symbolMap.entries()).map(([symbol, data]) => ({
            symbol,
            profit: round(data.profit),
            winRate: data.winRate,
            totalTrades: data.total,
        })),
    };
}

function round(n: number, decimals = 2): number {
    return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function formatHoldTime(ms: number): string {
    if (ms <= 0) return "N/A";
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
