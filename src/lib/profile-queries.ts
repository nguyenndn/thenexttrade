import { cache } from "react";
import { prisma } from "@/lib/prisma";

// ============================================================================
// TYPES
// ============================================================================

export interface PublicProfileData {
    name: string;
    username: string;
    image: string | null;
    headline: string | null;
    bio: string | null;
    joinedDate: Date;
    level: number;
    xp: number;
    streak: number;

    tradingStyle?: {
        archetype: string;
        archetypeTitle: string;
        dimensions?: Record<string, number>;
    } | null;

    performanceWindow: {
        label: string;
        days: number;
        qualifyingClosedTrades: number;
        calculatedAt: Date;
        latestTradeAt: Date | null;
        verificationLabel: string;
    };

    dataSource: string;
    methodologyHref: string;

    stats: {
        totalTrades: number;
        winRate: number;
        avgRR: number;
        tradeScore: number | null;
    };

    badges: Array<{
        name: string;
        icon: string;
        earnedAt: Date;
    }> | null;

    topPairs: Array<{
        symbol: string;
        winRate: number;
        trades: number;
    }> | null;

    preferredSession: {
        name: string;
        percentage: number;
    } | null;

    visibility: {
        showTradeScore: boolean;
        showBadges: boolean;
        showPairStats: boolean;
        showSessionStats: boolean;
        showTradingStyle?: boolean;
        showMoney: boolean;
        showBroker: boolean;
        showAccountNumber: boolean;
        showRealName: boolean;
        showPercentMetrics: boolean;
    };
}

// ============================================================================
// QUERIES
// ============================================================================

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
    return typeof id === "string" && UUID_REGEX.test(id);
}

async function getSessionPreference(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{ name: string; percentage: number } | null> {
    if (!isValidUuid(userId)) {
        return null;
    }

    try {
        const result = await prisma.$queryRaw<
            Array<{ session: string; cnt: bigint }>
        >`
 SELECT
 je."trading_session" as "session",
 COUNT(*) as "cnt"
 FROM "JournalEntry" je
 INNER JOIN "trading_accounts" ta ON ta.id = je."accountId"
   AND UPPER(COALESCE(ta.account_type, 'REAL')) NOT IN ('DEMO', 'CONTEST')
   AND COALESCE(ta.server, '') NOT ILIKE '%demo%'
 WHERE je."userId" = ${userId}::uuid
 AND je."status" = 'CLOSED'
 AND COALESCE(je.sync_source, 'MANUAL') <> 'MANUAL'
 AND je."trading_session" IS NOT NULL
 AND je."exitDate" >= ${startDate}
 AND je."exitDate" <= ${endDate}
 GROUP BY je."trading_session"
 ORDER BY "cnt" DESC
 LIMIT 1
 `;

        const row = result[0];
        if (!row) return null;

        const totalResult = await prisma.$queryRaw<Array<{ total: bigint }>>`
 SELECT COUNT(*) as "total"
 FROM "JournalEntry" je
 INNER JOIN "trading_accounts" ta ON ta.id = je."accountId"
   AND UPPER(COALESCE(ta.account_type, 'REAL')) NOT IN ('DEMO', 'CONTEST')
   AND COALESCE(ta.server, '') NOT ILIKE '%demo%'
 WHERE je."userId" = ${userId}::uuid
 AND je."status" = 'CLOSED'
 AND COALESCE(je.sync_source, 'MANUAL') <> 'MANUAL'
 AND je."trading_session" IS NOT NULL
 AND je."exitDate" >= ${startDate}
 AND je."exitDate" <= ${endDate}
 `;

        const totalRow = totalResult[0];
        const total = Number(totalRow?.total || 1);

        return {
            name: row.session,
            percentage: Math.round((Number(row.cnt) / total) * 100),
        };
    } catch (error) {
        console.error("Error in getSessionPreference:", error);
        return null;
    }
}

async function getVerifiedPublicStats(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    latestExitDate: Date | null;
}> {
    if (!isValidUuid(userId)) {
        return {
            totalTrades: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            latestExitDate: null,
        };
    }

    const rows = await prisma.$queryRaw<
        Array<{
            totalTrades: bigint;
            winRate: number | null;
            avgWin: number | null;
            avgLoss: number | null;
            latestExitDate: Date | null;
        }>
    >`
 SELECT
   COUNT(*) AS "totalTrades",
   COALESCE(
     ROUND(
       COUNT(CASE WHEN je.result = 'WIN' THEN 1 END) * 100.0
       / NULLIF(COUNT(CASE WHEN je.result IN ('WIN', 'LOSS') THEN 1 END), 0),
       1
     ),
     0
   ) AS "winRate",
   COALESCE(
     AVG(
       CASE
         WHEN (COALESCE(je.pnl, 0) + COALESCE(je.commission, 0) + COALESCE(je.swap, 0)) > 0
         THEN (COALESCE(je.pnl, 0) + COALESCE(je.commission, 0) + COALESCE(je.swap, 0))
       END
     ),
     0
   ) AS "avgWin",
   ABS(
     COALESCE(
       AVG(
         CASE
           WHEN (COALESCE(je.pnl, 0) + COALESCE(je.commission, 0) + COALESCE(je.swap, 0)) < 0
           THEN (COALESCE(je.pnl, 0) + COALESCE(je.commission, 0) + COALESCE(je.swap, 0))
         END
       ),
       0
     )
   ) AS "avgLoss",
   MAX(je."exitDate") AS "latestExitDate"
 FROM "JournalEntry" je
 INNER JOIN "trading_accounts" ta ON ta.id = je."accountId"
   AND UPPER(COALESCE(ta.account_type, 'REAL')) NOT IN ('DEMO', 'CONTEST')
   AND COALESCE(ta.server, '') NOT ILIKE '%demo%'
 WHERE je."userId" = ${userId}::uuid
   AND je."status" = 'CLOSED'
   AND COALESCE(je.sync_source, 'MANUAL') <> 'MANUAL'
   AND je."exitDate" >= ${startDate}
   AND je."exitDate" <= ${endDate}
 `;

    const r = rows[0];
    return {
        totalTrades: Number(r?.totalTrades ?? 0),
        winRate: Number(r?.winRate ?? 0),
        avgWin: Number(r?.avgWin ?? 0),
        avgLoss: Number(r?.avgLoss ?? 0),
        latestExitDate: r?.latestExitDate ?? null,
    };
}

async function getVerifiedPublicTopPairs(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ symbol: string; winRate: number; trades: number }>> {
    if (!isValidUuid(userId)) {
        return [];
    }

    const rows = await prisma.$queryRaw<
        Array<{
            symbol: string;
            trades: bigint;
            winRate: number | null;
        }>
    >`
 SELECT
   je.symbol AS "symbol",
   COUNT(*) AS "trades",
   COALESCE(
     ROUND(
       COUNT(CASE WHEN je.result = 'WIN' THEN 1 END) * 100.0
       / NULLIF(COUNT(CASE WHEN je.result IN ('WIN', 'LOSS') THEN 1 END), 0),
       1
     ),
     0
   ) AS "winRate"
 FROM "JournalEntry" je
 INNER JOIN "trading_accounts" ta ON ta.id = je."accountId"
   AND UPPER(COALESCE(ta.account_type, 'REAL')) NOT IN ('DEMO', 'CONTEST')
   AND COALESCE(ta.server, '') NOT ILIKE '%demo%'
 WHERE je."userId" = ${userId}::uuid
   AND je."status" = 'CLOSED'
   AND COALESCE(je.sync_source, 'MANUAL') <> 'MANUAL'
   AND je."exitDate" >= ${startDate}
   AND je."exitDate" <= ${endDate}
 GROUP BY je.symbol
 ORDER BY "trades" DESC
 LIMIT 3
 `;

    return rows.map((row) => ({
        symbol: row.symbol,
        trades: Number(row.trades),
        winRate: Number(row.winRate ?? 0),
    }));
}

// ============================================================================
// MAIN
// ============================================================================

export const getPublicProfileData = cache(
    async (username: string): Promise<PublicProfileData | null> => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return null;

    const profile = await prisma.profile.findFirst({
        where: {
            username: { equals: cleanUsername, mode: "insensitive" },
            isPublicProfile: true,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    xp: true,
                    level: true,
                    streak: true,
                    createdAt: true,
                    settings: true,
                    badges: {
                        select: {
                            badge: {
                                select: {
                                    name: true,
                                    icon: true,
                                },
                            },
                            earnedAt: true,
                        },
                        take: 10,
                        orderBy: { earnedAt: "desc" },
                    },
                },
            },
        },
    });

    if (!profile || !profile.isPublicProfile) return null;

    const userId = profile.userId;

    // Fetch verified real synced trade stats in parallel (last 90 days)
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [stats, symbols, sessionPref] = await Promise.all([
        getVerifiedPublicStats(userId, ninetyDaysAgo, now),
        profile.showPairStats
            ? getVerifiedPublicTopPairs(userId, ninetyDaysAgo, now)
            : Promise.resolve([]),
        profile.showSessionStats
            ? getSessionPreference(userId, ninetyDaysAgo, now)
            : Promise.resolve(null),
    ]);

    const calculatedAt = new Date();
    const qualifyingClosedTrades = stats.totalTrades;
    const hasVerificationSample = qualifyingClosedTrades >= 10;

    // Trade Score (only if toggled on AND enough verified real synced trades)
    let tradeScore: number | null = null;
    if (profile.showTradeScore && stats.totalTrades >= 30) {
        try {
            const primaryRealAccount = await prisma.tradingAccount.findFirst({
                where: {
                    userId,
                    accountType: { notIn: ["DEMO", "CONTEST"] },
                    NOT: { server: { contains: "demo", mode: "insensitive" } },
                },
                orderBy: [{ useForLeaderboard: "desc" }, { createdAt: "desc" }],
                select: { id: true },
            });
            if (primaryRealAccount) {
                const { getIntelligenceData } =
                    await import("@/lib/smart-analytics");
                const intelligence = await getIntelligenceData(
                    userId,
                    primaryRealAccount.id,
                    ninetyDaysAgo,
                    now
                );
                tradeScore = intelligence.tradeScore.score;
            }
        } catch {
            // Silent fail
        }
    }

    const avgRR = stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : 0;
    const canShowPercent = profile.showPercentMetrics;

    return {
        name: profile.showRealName
            ? profile.user.name || "Trader"
            : `@${profile.username}`,
        username: profile.username || "",
        image: profile.showRealName ? profile.user.image : null,
        headline: profile.profileHeadline,
        bio: profile.bio,
        joinedDate: profile.user.createdAt,
        level: profile.user.level,
        xp: profile.user.xp,
        streak: profile.user.streak,

        performanceWindow: {
            label: "Last 90 days",
            days: 90,
            qualifyingClosedTrades,
            calculatedAt,
            latestTradeAt: stats.latestExitDate,
            verificationLabel: hasVerificationSample
                ? "Verified sample"
                : "Early sample",
        },

        dataSource: "Based on synced closed trades",
        methodologyHref: "/faq",

        stats: {
            totalTrades: stats.totalTrades,
            winRate: canShowPercent ? stats.winRate : 0,
            avgRR,
            tradeScore,
        },

        badges: profile.showBadges
            ? profile.user.badges.map((b) => ({
                  name: b.badge.name,
                  icon: b.badge.icon,
                  earnedAt: b.earnedAt,
              }))
            : null,

        topPairs: profile.showPairStats
            ? symbols.map((s) => ({
                  symbol: s.symbol,
                  winRate: canShowPercent ? s.winRate : 0,
                  trades: s.trades,
              }))
            : null,

        preferredSession: sessionPref
            ? {
                  name: sessionPref.name,
                  percentage: canShowPercent ? sessionPref.percentage : 0,
              }
            : null,

        tradingStyle: (() => {
            const userSettings = (profile.user.settings as Record<string, any>) || {};
            const showTradingStyle =
                (profile as any).showTradingStyle ??
                userSettings.profileSettings?.showTradingStyle ??
                userSettings.showTradingStyle ??
                true;
            const style = userSettings.tradingStyle as {
                archetype: string;
                archetypeTitle: string;
                dimensions?: Record<string, number>;
            } | null;

            if (!showTradingStyle || !style) return null;
            return {
                archetype: style.archetype,
                archetypeTitle: style.archetypeTitle || style.archetype,
                dimensions: style.dimensions,
            };
        })(),

        visibility: {
            showTradeScore: profile.showTradeScore,
            showBadges: profile.showBadges,
            showPairStats: profile.showPairStats,
            showSessionStats: profile.showSessionStats,
            showTradingStyle: (() => {
                const userSettings = (profile.user.settings as Record<string, any>) || {};
                return (
                    (profile as any).showTradingStyle ??
                    userSettings.profileSettings?.showTradingStyle ??
                    userSettings.showTradingStyle ??
                    true
                );
            })(),
            showMoney: profile.showMoney,
            showBroker: profile.showBroker,
            showAccountNumber: profile.showAccountNumber,
            showRealName: profile.showRealName,
            showPercentMetrics: profile.showPercentMetrics,
        },
    };
});

export const getPublicProfileByUsername = getPublicProfileData;
