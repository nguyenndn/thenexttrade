import { prisma } from "@/lib/prisma";
import { FIRST_SESSION_ROLLOUT_AT } from "./constants";

export interface FirstInsightPayload {
    shouldShow: boolean;
    facts: string[];
    primaryCta: string;
    secondaryCta: string;
}

/**
 * Computes and returns the first insight payload for a user after their first trades.
 * Returns shouldShow = false if user has no trades or already viewed the insight.
 */
export async function getFirstInsightPayload(
    userId: string
): Promise<FirstInsightPayload> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true, createdAt: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const onboarding = (settings.onboarding || {}) as Record<string, any>;
    const firstSession = (onboarding.firstSession || {}) as Record<string, any>;

    const isLegacyUser = user?.createdAt
        ? user.createdAt < FIRST_SESSION_ROLLOUT_AT
        : true;

    if (isLegacyUser && !firstSession.startedAt) {
        return {
            shouldShow: false,
            facts: [],
            primaryCta: "/dashboard",
            secondaryCta: "/dashboard",
        };
    }

    // Check if user already viewed the first insight
    if (
        firstSession.firstInsightViewedAt ||
        firstSession.firstSyncCelebratedAt
    ) {
        return {
            shouldShow: false,
            facts: [],
            primaryCta: "/dashboard",
            secondaryCta: "/dashboard",
        };
    }

    // Fetch user's trade entries
    const entries = await prisma.journalEntry.findMany({
        where: { userId },
        select: {
            pnl: true,
            symbol: true,
            tradingSession: true,
            result: true,
        },
    });

    const accounts = await prisma.tradingAccount.findMany({
        where: { userId },
        select: { totalTrades: true },
    });

    const totalAccountTrades = accounts.reduce(
        (acc, a) => acc + a.totalTrades,
        0
    );
    const totalEntriesCount = entries.length;
    const totalTrades = Math.max(totalEntriesCount, totalAccountTrades);

    if (totalTrades === 0) {
        return {
            shouldShow: false,
            facts: [],
            primaryCta: "/dashboard",
            secondaryCta: "/dashboard",
        };
    }

    const facts: string[] = [];

    // Fact 1: Trade Count
    facts.push(
        `You successfully synced/logged your first ${totalTrades} trade(s).`
    );

    // Fact 2: Net P/L (if pnl values exist)
    const pnlList = entries
        .map((e) => e.pnl)
        .filter((p): p is number => p !== null);
    if (pnlList.length > 0) {
        const netPnL = pnlList.reduce((acc, p) => acc + p, 0);
        const sign = netPnL >= 0 ? "+" : "";
        facts.push(
            `Your net profit/loss for this period is ${sign}$${netPnL.toFixed(2)}.`
        );
    }

    // Fact 3: Win Rate (if closed trades exist)
    const closedEntries = entries.filter(
        (e) => e.result === "WIN" || e.result === "LOSS"
    );
    if (closedEntries.length > 0) {
        const wins = closedEntries.filter((e) => e.result === "WIN").length;
        const winRate = (wins / closedEntries.length) * 100;
        facts.push(
            `Your initial win rate is ${winRate.toFixed(1)}% (${wins}/${closedEntries.length} wins).`
        );
    }

    // Fact 4: Top Symbol (if symbol values exist)
    const symbols = entries
        .map((e) => e.symbol)
        .filter((s): s is string => !!s);
    if (symbols.length > 0 && facts.length < 3) {
        const counts: Record<string, number> = {};
        symbols.forEach((s) => (counts[s] = (counts[s] || 0) + 1));
        const topSymbol = Object.keys(counts).reduce((a, b) =>
            counts[a] > counts[b] ? a : b
        );
        facts.push(`Your most active trading symbol is ${topSymbol}.`);
    }

    // Fact 5: Session Hint (if session values exist)
    const sessions = entries
        .map((e) => e.tradingSession)
        .filter((s): s is string => !!s);
    if (sessions.length > 0 && facts.length < 3) {
        const counts: Record<string, number> = {};
        sessions.forEach((s) => (counts[s] = (counts[s] || 0) + 1));
        const topSession = Object.keys(counts).reduce((a, b) =>
            counts[a] > counts[b] ? a : b
        );
        facts.push(
            `You executed most of your trades during the ${topSession} session.`
        );
    }

    // Limit to max 3 facts as per product spec
    const limitedFacts = facts.slice(0, 3);

    // Check if a report already exists to decide CTAs
    const reportCount = await prisma.tradingReport.count({ where: { userId } });

    const primaryCta = "/dashboard/analytics?source=first-insight";
    const secondaryCta =
        reportCount === 0
            ? "/dashboard/reports?action=generate&source=first-insight"
            : "/dashboard/reports";

    return {
        shouldShow: true,
        facts: limitedFacts,
        primaryCta,
        secondaryCta,
    };
}
