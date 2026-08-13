import { prisma } from "@/lib/prisma";
import { DataConfidenceLevel, InsightSnapshotView } from "@/lib/trader-growth/types";
import {
    MIN_OBSERVATION_TRADES,
    MIN_ACTIONABLE_TRADES,
    HIGH_CONFIDENCE_TRADES,
} from "./constants";

export async function getOrCreateFirstInsight(
    userId: string,
    accountId?: string
): Promise<InsightSnapshotView | null> {
    const whereAccount = accountId ? { accountId, userId } : { userId };

    // Fetch closed trades
    const trades = await prisma.journalEntry.findMany({
        where: {
            ...whereAccount,
            status: "CLOSED",
        },
        select: {
            id: true,
            symbol: true,
            result: true,
            pnl: true,
            entryDate: true,
            exitDate: true,
            tradingSession: true,
            followedPlan: true,
            mistakes: true,
        },
        orderBy: { exitDate: "desc" },
    });

    const sampleSize = trades.length;
    if (sampleSize < MIN_OBSERVATION_TRADES) {
        return null; // Not enough trades for an observation
    }

    // Determine confidence
    let confidence: DataConfidenceLevel = "LOW";
    if (sampleSize >= HIGH_CONFIDENCE_TRADES) {
        confidence = "HIGH";
    } else if (sampleSize >= MIN_ACTIONABLE_TRADES) {
        confidence = "MEDIUM";
    }

    // Calculate decisive stats (excluding break-even from denominator)
    const wins = trades.filter((t) => t.result === "WIN").length;
    const losses = trades.filter((t) => t.result === "LOSS").length;
    const breakEvens = trades.filter((t) => t.result === "BREAK_EVEN" || t.result === "BE_PLUS").length;
    const decisiveCount = wins + losses;
    const winRateVal = decisiveCount > 0 ? Math.round((wins / decisiveCount) * 100) : null;
    const winRateText = winRateVal !== null ? `${winRateVal}% win rate` : `${breakEvens} break-even trades`;

    // Symbol distribution
    const symbolCounts: Record<string, number> = {};
    trades.forEach((t) => {
        if (t.symbol) {
            symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
        }
    });

    const topSymbolEntry = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0];
    const topSymbol = topSymbolEntry ? topSymbolEntry[0] : "XAUUSD";
    const topSymbolCount = topSymbolEntry ? topSymbolEntry[1] : 0;

    // Session distribution
    const sessionCounts: Record<string, number> = {};
    trades.forEach((t) => {
        if (t.tradingSession) {
            sessionCounts[t.tradingSession] = (sessionCounts[t.tradingSession] || 0) + 1;
        }
    });
    const topSession = Object.entries(sessionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "US";

    let insightType = "MOST_TRADED_DESCRIPTIVE";
    let title = `Primary Focus: ${topSymbol} (${topSymbolCount} trades)`;
    let summary = `Your trading activity shows a primary focus on ${topSymbol} across ${sampleSize} closed trades (${winRateText}).`;

    if (sampleSize >= MIN_ACTIONABLE_TRADES) {
        insightType = "WEAK_SESSION_DAY_SYMBOL";
        title = `Actionable Pattern Identified for ${topSymbol}`;
        summary = `Based on ${sampleSize} closed trades, ${topSymbol} accounts for ${Math.round((topSymbolCount / sampleSize) * 100)}% of your execution volume in the ${topSession} session.`;
    }

    // Stable fingerprint independent of changing sampleSize so snapshot is updated/superseded rather than duplicated
    const fingerprint = `${insightType}:${topSymbol || "GENERAL"}`;
    const engineVersion = "v1.0";

    const periodStart = trades[trades.length - 1]?.entryDate || new Date();
    const periodEnd = trades[0]?.entryDate || new Date();

    // Idempotent upsert of snapshot
    const snapshot = await prisma.traderInsightSnapshot.upsert({
        where: {
            userId_fingerprint_engineVersion: {
                userId,
                fingerprint,
                engineVersion,
            },
        },
        create: {
            userId,
            accountId: accountId || null,
            insightType,
            fingerprint,
            title,
            summary,
            evidence: {
                sampleSize,
                topSymbol,
                topSymbolCount,
                topSession,
                winRate: winRateVal,
                wins,
                losses,
                breakEvens,
            },
            sampleSize,
            confidence,
            periodStart,
            periodEnd,
            engineVersion,
            status: "ACTIVE",
        },
        update: {
            title,
            summary,
            evidence: {
                sampleSize,
                topSymbol,
                topSymbolCount,
                topSession,
                winRate: winRateVal,
                wins,
                losses,
                breakEvens,
            },
            sampleSize,
            confidence,
            periodStart,
            periodEnd,
            updatedAt: new Date(),
        },
    });

    return {
        id: snapshot.id,
        insightType: snapshot.insightType,
        title: snapshot.title,
        summary: snapshot.summary,
        sampleSize: snapshot.sampleSize,
        confidence: snapshot.confidence as DataConfidenceLevel,
        evidence: (snapshot.evidence as Record<string, any>) || {},
        createdAt: snapshot.createdAt.toISOString(),
    };
}

export async function markInsightViewed(snapshotId: string, userId?: string): Promise<void> {
    const whereCondition = userId ? { id: snapshotId, userId, viewedAt: null } : { id: snapshotId, viewedAt: null };
    await prisma.traderInsightSnapshot.updateMany({
        where: whereCondition,
        data: { viewedAt: new Date() },
    });
}
