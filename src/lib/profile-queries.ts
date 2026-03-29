import { prisma } from "@/lib/prisma";
import { getKeyStats, getSymbolPerformance, getCurrentStreak } from "@/lib/analytics-queries";

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
    };
}

// ============================================================================
// QUERIES
// ============================================================================

async function getSessionPreference(userId: string): Promise<{ name: string; percentage: number } | null> {
    const result = await prisma.$queryRaw`
        SELECT
            "trading_session" as "session",
            COUNT(*) as "cnt"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "trading_session" IS NOT NULL
        AND "exitDate" >= NOW() - INTERVAL '90 days'
        GROUP BY "trading_session"
        ORDER BY "cnt" DESC
        LIMIT 1
    `;

    const row = (result as any[])[0];
    if (!row) return null;

    const totalResult = await prisma.$queryRaw`
        SELECT COUNT(*) as "total"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "trading_session" IS NOT NULL
        AND "exitDate" >= NOW() - INTERVAL '90 days'
    `;

    const totalRow = (totalResult as any[])[0];
    const total = Number(totalRow?.total || 1);

    return {
        name: row.session,
        percentage: Math.round((Number(row.cnt) / total) * 100),
    };
}

// ============================================================================
// MAIN
// ============================================================================

export async function getPublicProfileData(username: string): Promise<PublicProfileData | null> {
    const profile = await prisma.profile.findUnique({
        where: { username },
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

    // Fetch stats in parallel (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [stats, symbols, _streak, sessionPref] = await Promise.all([
        getKeyStats(userId, undefined, ninetyDaysAgo, new Date()),
        profile.showPairStats
            ? getSymbolPerformance(userId, undefined, ninetyDaysAgo, new Date())
            : Promise.resolve([]),
        getCurrentStreak(userId),
        profile.showSessionStats
            ? getSessionPreference(userId)
            : Promise.resolve(null),
    ]);

    // Trade Score (only if toggled on AND enough data)
    let tradeScore: number | null = null;
    if (profile.showTradeScore && stats.totalTrades >= 30) {
        try {
            const { getIntelligenceData } = await import("@/lib/smart-analytics");
            const intelligence = await getIntelligenceData(userId, undefined, ninetyDaysAgo, new Date());
            tradeScore = intelligence.tradeScore.score;
        } catch {
            // Silent fail
        }
    }

    const avgRR = stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : 0;

    return {
        name: profile.user.name || "Trader",
        username: profile.username || "",
        image: profile.user.image,
        headline: profile.profileHeadline,
        bio: profile.bio,
        joinedDate: profile.user.createdAt,
        level: profile.user.level,
        xp: profile.user.xp,
        streak: profile.user.streak,

        stats: {
            totalTrades: stats.totalTrades,
            winRate: stats.winRate,
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
            ? symbols.slice(0, 5).map((s) => ({
                  symbol: s.symbol,
                  winRate: s.winRate,
                  trades: s.trades,
              }))
            : null,

        preferredSession: sessionPref,

        visibility: {
            showTradeScore: profile.showTradeScore,
            showBadges: profile.showBadges,
            showPairStats: profile.showPairStats,
            showSessionStats: profile.showSessionStats,
        },
    };
}
