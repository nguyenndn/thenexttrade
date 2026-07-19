import { prisma } from "@/lib/prisma";
import type { ActivityStatus } from "@prisma/client";

// ============================================================================
// IB ACTIVITY SNAPSHOT SERVICE
// ============================================================================

/**
 * Compute activity status for a user based on trading account state
 */
function computeActivityStatus(data: {
    hasProEntitlement: boolean;
    hasTradingAccount: boolean;
    hasHeartbeat: boolean;
    lastTradeAt: Date | null;
    trades30d: number;
    highValueThreshold: number;
}): ActivityStatus {
    if (!data.hasProEntitlement) return "SIGNED_UP";
    if (!data.hasTradingAccount) return "VERIFIED_INACTIVE";
    if (!data.hasHeartbeat && !data.lastTradeAt) return "CONNECTED_NO_TRADES";

    if (data.lastTradeAt) {
        const daysSince = Math.floor(
            (Date.now() - data.lastTradeAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 30) return "DORMANT";
        if (daysSince > 14) return "AT_RISK";
    }

    if (data.trades30d === 0) return "CONNECTED_NO_TRADES";
    if (data.trades30d >= data.highValueThreshold) return "HIGH_VALUE_ACTIVE";
    return "ACTIVE_TRADER";
}

/**
 * Generate activity snapshots for all Pro users.
 * Should be called by a daily cron job.
 */
export async function generateActivitySnapshots() {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);

    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 30);
    periodStart.setHours(0, 0, 0, 0);

    // Fetch all users with Pro entitlements
    const proUsers = await prisma.proEntitlement.findMany({
        where: { status: { in: ["ACTIVE", "GRACE"] } },
        select: {
            userId: true,
            broker: true,
            accountNumberMasked: true,
            tradingAccountId: true,
        },
    });

    const results: Array<{
        userId: string;
        activityStatus: ActivityStatus;
        tradeCount: number;
        closedLotVolume: number;
        estimatedIbRevenue: number;
    }> = [];

    for (const pe of proUsers) {
        // Find linked or primary trading account
        const account = pe.tradingAccountId
            ? await prisma.tradingAccount.findUnique({
                  where: { id: pe.tradingAccountId },
                  select: {
                      id: true,
                      broker: true,
                      accountNumber: true,
                      lastHeartbeat: true,
                      status: true,
                  },
              })
            : await prisma.tradingAccount.findFirst({
                  where: { userId: pe.userId },
                  orderBy: { lastHeartbeat: "desc" },
                  select: {
                      id: true,
                      broker: true,
                      accountNumber: true,
                      lastHeartbeat: true,
                      status: true,
                  },
              });

        // Compute 30d trade stats
        const [tradeStats, lastTradeEntry] = await Promise.all([
            prisma.journalEntry.aggregate({
                where: {
                    userId: pe.userId,
                    status: "CLOSED",
                    exitDate: { gte: periodStart, lte: periodEnd },
                    ...(account ? { accountId: account.id } : {}),
                },
                _count: true,
                _sum: { lotSize: true, pnl: true },
            }),
            prisma.journalEntry.findFirst({
                where: {
                    userId: pe.userId,
                    status: "CLOSED",
                    ...(account ? { accountId: account.id } : {}),
                },
                orderBy: { exitDate: "desc" },
                select: { exitDate: true },
            }),
        ]);

        const tradeCount = tradeStats._count;
        const closedLotVolume = tradeStats._sum.lotSize || 0;
        const netPnl = tradeStats._sum.pnl || 0;

        // Estimate IB revenue
        const brokerConfig = pe.broker
            ? await prisma.eABroker.findFirst({
                  where: { slug: pe.broker },
                  select: { commissionPerLot: true },
              })
            : null;

        const estimatedIbRevenue = brokerConfig?.commissionPerLot
            ? closedLotVolume * brokerConfig.commissionPerLot
            : 0;

        // Compute activity status
        const activityStatus = computeActivityStatus({
            hasProEntitlement: true,
            hasTradingAccount: !!account,
            hasHeartbeat: !!account?.lastHeartbeat,
            lastTradeAt: lastTradeEntry?.exitDate || null,
            trades30d: tradeCount,
            highValueThreshold: 30,
        });

        // Upsert snapshot
        await prisma.ibActivitySnapshot.upsert({
            where: {
                userId_periodStart_periodEnd: {
                    userId: pe.userId,
                    periodStart,
                    periodEnd,
                },
            },
            create: {
                userId: pe.userId,
                tradingAccountId: account?.id || null,
                broker: pe.broker || account?.broker || null,
                accountNumberMasked: pe.accountNumberMasked || null,
                periodStart,
                periodEnd,
                tradeCount,
                closedLotVolume,
                netPnl,
                lastTradeAt: lastTradeEntry?.exitDate || null,
                lastHeartbeatAt: account?.lastHeartbeat || null,
                estimatedIbRevenue,
                activityStatus,
            },
            update: {
                tradeCount,
                closedLotVolume,
                netPnl,
                lastTradeAt: lastTradeEntry?.exitDate || null,
                lastHeartbeatAt: account?.lastHeartbeat || null,
                estimatedIbRevenue,
                activityStatus,
            },
        });

        results.push({
            userId: pe.userId,
            activityStatus,
            tradeCount,
            closedLotVolume,
            estimatedIbRevenue,
        });
    }

    return {
        totalProcessed: results.length,
        active: results.filter((r) =>
            ["ACTIVE_TRADER", "HIGH_VALUE_ACTIVE"].includes(r.activityStatus)
        ).length,
        atRisk: results.filter((r) => r.activityStatus === "AT_RISK").length,
        dormant: results.filter((r) => r.activityStatus === "DORMANT").length,
        totalLots: results.reduce((s, r) => s + r.closedLotVolume, 0),
        totalEstimatedRevenue: results.reduce(
            (s, r) => s + r.estimatedIbRevenue,
            0
        ),
    };
}
