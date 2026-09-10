import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { cookies } from "next/headers";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import { getPairConfig } from "@/lib/calculators";

export interface TradingAlert {
    id: string;
    level: "warning" | "danger" | "info";
    icon: string;
    title: string;
    description: string;
}

export async function TradingAlertBanner() {
    const user = await getAuthUser();
    if (!user) return null;

    const cookieStore = await cookies();
    const accountId = cookieStore.get("last_account_id")?.value;
    if (!accountId) return null;

    const account = await prisma.tradingAccount.findUnique({
        where: { id: accountId, userId: user.id },
        select: {
            balance: true,
            maxDailyLoss: true,
            maxDailyTrades: true,
            maxRiskPercent: true,
            timezone: true,
            currency: true,
        },
    });

    if (!account) return null;

    // No rules configured - skip
    const hasRules =
        account.maxDailyLoss ||
        account.maxDailyTrades ||
        account.maxRiskPercent;
    if (!hasRules) return null;

    // Get today's date range in account timezone
    const tz = account.timezone || "Etc/UTC";
    const now = new Date();

    // Calculate today boundaries in account timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const todayStr = formatter.format(now); // "YYYY-MM-DD"
    const todayStart = parseLocalStartOfDay(todayStr, tz);
    const todayEnd = parseLocalEndOfDay(todayStr, tz);

    // Fetch today's closed trades for this account (aligned by close/exit date)
    const todayTrades = await prisma.journalEntry.findMany({
        where: {
            userId: user.id,
            accountId: accountId,
            status: "CLOSED",
            OR: [
                { exitDate: { gte: todayStart, lte: todayEnd } },
                { exitDate: null, entryDate: { gte: todayStart, lte: todayEnd } },
            ],
        },
        select: {
            id: true,
            pnl: true,
            result: true,
            symbol: true,
            lotSize: true,
            entryPrice: true,
            stopLoss: true,
            exitDate: true,
            entryDate: true,
        },
        orderBy: { exitDate: "desc" },
    });

    const alerts: TradingAlert[] = [];

    // 1. Daily Loss Check
    if (account.maxDailyLoss && account.maxDailyLoss > 0) {
        const totalLossToday = todayTrades
            .filter((t) => (t.pnl || 0) < 0)
            .reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);

        const lossPercent = (totalLossToday / account.maxDailyLoss) * 100;

        if (lossPercent >= 100) {
            alerts.push({
                id: "daily-loss-exceeded",
                level: "danger",
                icon: "🛑",
                title: "Daily Loss Limit Exceeded",
                description: `You've lost $${totalLossToday.toFixed(0)} today (limit: $${account.maxDailyLoss.toFixed(0)}). Consider stopping for today.`,
            });
        } else if (lossPercent >= 80) {
            alerts.push({
                id: "daily-loss-warning",
                level: "warning",
                icon: "⚠️",
                title: "Approaching Daily Loss Limit",
                description: `You've lost $${totalLossToday.toFixed(0)} of $${account.maxDailyLoss.toFixed(0)} limit (${lossPercent.toFixed(0)}%). Be cautious.`,
            });
        }
    }

    // 2. Max Daily Trades Check
    if (account.maxDailyTrades && account.maxDailyTrades > 0) {
        const tradesCount = todayTrades.length;

        if (tradesCount >= account.maxDailyTrades) {
            alerts.push({
                id: "overtrading",
                level: "warning",
                icon: "🚨",
                title: "Overtrading Alert",
                description: `You've placed ${tradesCount} trades today (limit: ${account.maxDailyTrades}). Review your plan before continuing.`,
            });
        }
    }

    // 3. Max Risk % / Trade Check
    if (
        account.maxRiskPercent &&
        account.maxRiskPercent > 0 &&
        account.balance > 0
    ) {
        for (const trade of todayTrades) {
            if (trade.stopLoss && trade.entryPrice) {
                const slDistance = Math.abs(trade.entryPrice - trade.stopLoss);
                const { contractSize } = getPairConfig(trade.symbol);
                const riskAmount = slDistance * trade.lotSize * contractSize;
                const riskPercent = (riskAmount / account.balance) * 100;
                if (riskPercent > account.maxRiskPercent) {
                    alerts.push({
                        id: `risk-exceeded-${trade.id}`,
                        level: "danger",
                        icon: "⚠️",
                        title: "Risk Limit Exceeded",
                        description: `Trade on ${trade.symbol} exceeded your ${account.maxRiskPercent}% risk limit (${riskPercent.toFixed(1)}%). Protect your capital.`,
                    });
                    break;
                }
            }
        }
    }

    if (alerts.length === 0) return null;

    // Dispatch risk alerts directly into the Notification table (Bell)
    for (const alert of alerts) {
        const dedupeKey = `TRADING_ALERT:${accountId}:${todayStr}:${alert.id}`;
        try {
            await prisma.notification.upsert({
                where: {
                    userId_dedupeKey: {
                        userId: user.id,
                        dedupeKey,
                    },
                },
                create: {
                    userId: user.id,
                    type: "FEATURE_UPDATE",
                    title: `Risk Alert: ${alert.title}`,
                    message: alert.description,
                    link: "/dashboard/intelligence",
                    icon: "AlertTriangle",
                    priority: alert.level === "danger" ? "URGENT" : "HIGH",
                    dedupeKey,
                    metadata: {
                        alertId: alert.id,
                        actionType: "NAVIGATE",
                    },
                },
                update: {},
            });
        } catch {
            /* Duplicate write blocked atomically */
        }
    }

    // Alerts are held within the Notification Bell without displaying on the dashboard
    return null;
}
