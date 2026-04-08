import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { cookies } from "next/headers";
import { TradingAlertBannerClient } from "./TradingAlertBannerClient";

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
            maxDailyLoss: true,
            maxDailyTrades: true,
            cooldownAfterLosses: true,
            timezone: true,
            currency: true,
        },
    });

    if (!account) return null;

    // No rules configured — skip
    const hasRules = account.maxDailyLoss || account.maxDailyTrades || account.cooldownAfterLosses;
    if (!hasRules) return null;

    // Get today's date range in account timezone
    const tz = account.timezone || "Etc/UTC";
    const now = new Date();
    
    // Calculate today boundaries in account timezone
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    const todayStr = formatter.format(now); // "2026-04-08"
    const todayStart = new Date(`${todayStr}T00:00:00`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999`);

    // Fetch today's closed trades for this account
    const todayTrades = await prisma.journalEntry.findMany({
        where: {
            userId: user.id,
            accountId: accountId,
            status: "CLOSED",
            entryDate: { gte: todayStart, lte: todayEnd },
        },
        select: {
            pnl: true,
            result: true,
            entryDate: true,
        },
        orderBy: { entryDate: "desc" },
    });

    const alerts: TradingAlert[] = [];

    // 1. Daily Loss Check
    if (account.maxDailyLoss && account.maxDailyLoss > 0) {
        const totalLossToday = todayTrades
            .filter(t => (t.pnl || 0) < 0)
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
                description: `You've placed ${tradesCount} trades today (limit: ${account.maxDailyTrades}). Are you following your plan?`,
            });
        }
    }

    // 3. Consecutive Losses Cooldown
    if (account.cooldownAfterLosses && account.cooldownAfterLosses > 0) {
        // Check recent consecutive losses (most recent first)
        let consecutiveLosses = 0;
        for (const trade of todayTrades) {
            if (trade.result === "LOSS") {
                consecutiveLosses++;
            } else {
                break; // Stop counting at first non-loss
            }
        }

        if (consecutiveLosses >= account.cooldownAfterLosses) {
            alerts.push({
                id: "cooldown",
                level: "danger",
                icon: "🧊",
                title: "Cooldown Recommended",
                description: `${consecutiveLosses} consecutive losses. Take a break, review your trades, and come back with a clear mind.`,
            });
        }
    }

    if (alerts.length === 0) return null;

    return <TradingAlertBannerClient alerts={alerts} />;
}
