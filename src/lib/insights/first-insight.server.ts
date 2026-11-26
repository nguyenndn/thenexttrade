import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    const normalizedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;
    const accountFilter = normalizedAccountId
        ? Prisma.sql`AND "accountId" = ${normalizedAccountId}`
        : Prisma.empty;

    const [summaryRows, topSymbolRows, topSessionRows] = await Promise.all([
        prisma.$queryRaw<
            Array<{
                sampleSize: number | bigint;
                wins: number | bigint;
                losses: number | bigint;
                breakEvens: number | bigint;
                periodStart: Date | null;
                periodEnd: Date | null;
            }>
        >`
            SELECT
                COUNT(*)::int AS "sampleSize",
                COUNT(*) FILTER (WHERE "result" = 'WIN')::int AS "wins",
                COUNT(*) FILTER (WHERE "result" = 'LOSS')::int AS "losses",
                COUNT(*) FILTER (WHERE "result" IN ('BREAK_EVEN', 'BE_PLUS'))::int AS "breakEvens",
                MIN("entryDate") AS "periodStart",
                MAX("entryDate") AS "periodEnd"
            FROM "journal_entries"
            WHERE "userId" = ${userId}::uuid
              AND "status" = 'CLOSED'
              ${accountFilter}
        `,
        prisma.$queryRaw<Array<{ symbol: string; cnt: number | bigint }>>`
            SELECT "symbol", COUNT(*)::int AS "cnt"
            FROM "journal_entries"
            WHERE "userId" = ${userId}::uuid
              AND "status" = 'CLOSED'
              AND "symbol" IS NOT NULL
              AND "symbol" <> ''
              ${accountFilter}
            GROUP BY "symbol"
            ORDER BY "cnt" DESC
            LIMIT 1
        `,
        prisma.$queryRaw<Array<{ session: string; cnt: number | bigint }>>`
            SELECT "trading_session" AS "session", COUNT(*)::int AS "cnt"
            FROM "journal_entries"
            WHERE "userId" = ${userId}::uuid
              AND "status" = 'CLOSED'
              AND "trading_session" IS NOT NULL
              AND "trading_session" <> ''
              ${accountFilter}
            GROUP BY "trading_session"
            ORDER BY "cnt" DESC
            LIMIT 1
        `,
    ]);

    const summaryStats = summaryRows[0];
    const sampleSize = Number(summaryStats?.sampleSize || 0);
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
    const wins = Number(summaryStats?.wins || 0);
    const losses = Number(summaryStats?.losses || 0);
    const breakEvens = Number(summaryStats?.breakEvens || 0);
    const decisiveCount = wins + losses;
    const winRateVal =
        decisiveCount > 0 ? Math.round((wins / decisiveCount) * 100) : null;
    const winRateText =
        winRateVal !== null
            ? `${winRateVal}% win rate`
            : `${breakEvens} break-even trades`;

    const topSymbol = topSymbolRows[0]?.symbol || "XAUUSD";
    const topSymbolCount = Number(topSymbolRows[0]?.cnt || 0);
    const topSession = topSessionRows[0]?.session || "US";

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

    const periodStart = summaryStats?.periodStart || new Date();
    const periodEnd = summaryStats?.periodEnd || new Date();

    // Fast read-first check: skip DB write if the snapshot is already current for this sampleSize
    const existingSnapshot = await prisma.traderInsightSnapshot.findUnique({
        where: {
            userId_fingerprint_engineVersion: {
                userId,
                fingerprint,
                engineVersion,
            },
        },
    });

    const snapshot =
        existingSnapshot &&
        existingSnapshot.sampleSize === sampleSize &&
        existingSnapshot.status === "ACTIVE"
            ? existingSnapshot
            : await prisma.traderInsightSnapshot.upsert({
                  where: {
                      userId_fingerprint_engineVersion: {
                          userId,
                          fingerprint,
                          engineVersion,
                      },
                  },
                  create: {
                      userId,
                      accountId: normalizedAccountId || null,
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
        evidence: (snapshot.evidence as Record<string, unknown>) || {},
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
