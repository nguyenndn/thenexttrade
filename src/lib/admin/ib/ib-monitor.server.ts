import { prisma } from "@/lib/prisma";
import {
    IbTraderFilters,
    IbTraderPaginatedResult,
    IbTraderRow,
    ExpandedTraderAccount,
} from "./ib-monitor.types";
import {
    CANONICAL_PRODUCTS,
    DEFAULT_PAGE_SIZE,
    ALLOWED_PAGE_SIZES,
} from "./ib-monitor.constants";
import { computeCapitalBreakdown } from "./capital.server";
import { resolveUserProductSummaries } from "./product-usage.server";
import { normalizeSyncSource, getSyncSourceLabel } from "@/lib/sync/sync-source";
import { getPaginatedTraderMonitorV2 } from "./ib-monitor.server-v2";

export function parseTraderFilters(params: Record<string, string | undefined>): IbTraderFilters {
    const page = parseInt(params.page || "1", 10);
    const rawPageSize = parseInt(params.pageSize || `${DEFAULT_PAGE_SIZE}`, 10);
    const pageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(rawPageSize)
        ? rawPageSize
        : DEFAULT_PAGE_SIZE;

    return {
        q: params.q?.trim(),
        vip: (params.vip as any) || "ALL",
        product: params.product || "ALL",
        toolState: (params.toolState as any) || "ALL",
        broker: params.broker || "ALL",
        accountHealth: (params.accountHealth as any) || "ALL",
        accountType: (params.accountType as any) || "ALL",
        syncSource: ["EA_SYNC", "MANUAL", "UNKNOWN"].includes(params.syncSource || "")
            ? (params.syncSource as IbTraderFilters["syncSource"])
            : "ALL",
        capitalBand: (params.capitalBand as any) || "ALL",
        minAccounts: parseNonNegativeInt(params.minAccounts),
        maxAccounts: parseNonNegativeInt(params.maxAccounts),
        lastTrade: (params.lastTrade as any) || "ALL",
        sort: (params.sort as any) || "NEWEST",
        page: isNaN(page) || page < 1 ? 1 : page,
        pageSize,
    };
}

function parseNonNegativeInt(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

async function getPaginatedTraderMonitorLegacy(
    filters: IbTraderFilters
): Promise<IbTraderPaginatedResult> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Build Prisma query condition for Users
    const userWhere: any = {};

    if (filters.q) {
        userWhere.OR = [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            {
                tradingAccounts: {
                    some: {
                        OR: [
                            { accountNumber: { contains: filters.q, mode: "insensitive" } },
                            { broker: { contains: filters.q, mode: "insensitive" } },
                        ],
                    },
                },
            },
        ];
    }

    if (filters.vip && filters.vip !== "ALL") {
        if (filters.vip === "ACTIVE") {
            userWhere.proEntitlements = {
                some: {
                    status: "ACTIVE",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            };
        } else if (filters.vip === "GRACE") {
            userWhere.proEntitlements = {
                some: {
                    status: "GRACE",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            };
        } else if (filters.vip === "EXPIRING") {
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            userWhere.proEntitlements = {
                some: {
                    status: { in: ["ACTIVE", "GRACE"] },
                    expiresAt: { gte: now, lte: sevenDaysFromNow },
                },
            };
        } else if (filters.vip === "REVOKED") {
            userWhere.proEntitlements = {
                some: { status: "REVOKED" },
            };
        } else if (filters.vip === "FREE") {
            userWhere.proEntitlements = {
                none: {
                    status: { in: ["ACTIVE", "GRACE"] },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            };
        }
    }

    if (filters.broker && filters.broker !== "ALL") {
        userWhere.tradingAccounts = {
            some: { broker: { equals: filters.broker, mode: "insensitive" } },
        };
    }

    // Fetch total matching user count
    const totalUsers = await prisma.user.count({ where: userWhere });

    // Determine orderBy
    let orderByClause: any = { createdAt: "desc" };
    if (filters.sort === "NEWEST") {
        orderByClause = { createdAt: "desc" };
    }

    // Fetch User page with trading accounts & entitlements
    const users = await prisma.user.findMany({
        where: userWhere,
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            settings: true,
            profile: {
                select: { country: true },
            },
            tradingAccounts: {
                select: {
                    id: true,
                    broker: true,
                    server: true,
                    accountNumber: true,
                    balance: true,
                    equity: true,
                    currency: true,
                    platform: true,
                    status: true,
                    syncSource: true,
                    eaVersion: true,
                    lastSync: true,
                    lastHeartbeat: true,
                    totalTrades: true,
                    accountType: true,
                },
                orderBy: { updatedAt: "desc" },
            },
            proEntitlements: {
                select: {
                    id: true,
                    status: true,
                    expiresAt: true,
                    startsAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
        skip,
        take: pageSize,
        orderBy: orderByClause,
    });

    const userIds = users.map((u) => u.id);

    // Single batched query for 30d journal entries (0 N+1 query loops)
    const journalGrouped = await prisma.journalEntry.groupBy({
        by: ["userId"],
        where: {
            userId: { in: userIds },
            status: "CLOSED",
            exitDate: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
        _sum: { lotSize: true },
    });

    const journalStatsMap = new Map<string, { count: number; lotVolume: number }>();
    journalGrouped.forEach((g) => {
        journalStatsMap.set(g.userId, {
            count: g._count.id,
            lotVolume: g._sum.lotSize || 0,
        });
    });

    // Process user rows
    const rows: IbTraderRow[] = await Promise.all(
        users.map(async (u) => {
            // Distinct user VIP status resolution (ACTIVE > GRACE > EXPIRED > REVOKED > NONE)
            let vipStatus: "ACTIVE" | "GRACE" | "EXPIRED" | "REVOKED" | "NONE" = "NONE";
            let vipExpiresAt: string | null = null;

            for (const ent of u.proEntitlements) {
                const isNotExpired = !ent.expiresAt || ent.expiresAt > now;
                if (ent.status === "ACTIVE" && isNotExpired) {
                    vipStatus = "ACTIVE";
                    vipExpiresAt = ent.expiresAt?.toISOString() || null;
                    break;
                } else if (ent.status === "GRACE" && isNotExpired) {
                    vipStatus = "GRACE";
                    vipExpiresAt = ent.expiresAt?.toISOString() || null;
                } else if (ent.status === "EXPIRED" && vipStatus === "NONE") {
                    vipStatus = "EXPIRED";
                } else if (ent.status === "REVOKED" && vipStatus === "NONE") {
                    vipStatus = "REVOKED";
                }
            }

            const products = await resolveUserProductSummaries({
                userId: u.id,
                hasActiveProEntitlement: vipStatus === "ACTIVE" || vipStatus === "GRACE",
            });

            // Account identity duplication check (userId + broker + accountNumber)
            const seenAccountKeys = new Set<string>();
            let duplicateAccountCount = 0;

            const accounts: ExpandedTraderAccount[] = u.tradingAccounts.map((a) => {
                const normSource = normalizeSyncSource(a.syncSource);
                const sourceLabel = getSyncSourceLabel(normSource);

                const key = `${a.broker || ""}:${a.accountNumber || ""}`.toLowerCase();
                const isDup = seenAccountKeys.has(key);
                if (key && key !== ":") seenAccountKeys.add(key);
                if (isDup) duplicateAccountCount++;

                const hb = a.lastHeartbeat ? new Date(a.lastHeartbeat) : null;
                const sync = a.lastSync ? new Date(a.lastSync) : null;
                const newestSignal = hb && sync ? (hb > sync ? hb : sync) : hb || sync;
                const isFresh = newestSignal ? newestSignal >= twentyFourHoursAgo : false;

                const accTypeUpper = (a.accountType || "").toUpperCase();
                const accountType =
                    accTypeUpper.includes("REAL") || accTypeUpper === "PERSONAL" || accTypeUpper.includes("FUNDED")
                        ? "REAL"
                        : accTypeUpper.includes("DEMO") || accTypeUpper.includes("EVALUATION")
                        ? "DEMO"
                        : "UNKNOWN";

                return {
                    id: a.id,
                    accountNumber: a.accountNumber || "N/A",
                    rawAccountNumber: a.accountNumber || "",
                    broker: a.broker || "Unknown",
                    server: a.server || null,
                    platform: a.platform || "MetaTrader 5",
                    currency: (a.currency || "UNKNOWN").toUpperCase(),
                    balance: a.balance || 0,
                    equity: a.equity || 0,
                    accountType,
                    status: a.status,
                    syncSource: a.syncSource,
                    syncSourceLabel: sourceLabel,
                    eaVersion: a.eaVersion || null,
                    lastSync: a.lastSync?.toISOString() || null,
                    lastHeartbeat: a.lastHeartbeat?.toISOString() || null,
                    lastTrade: null,
                    isFresh,
                    isDuplicate: isDup,
                    totalTrades: a.totalTrades || 0,
                };
            });

            const registeredAccountCount = accounts.length;
            const eligibleAccountCount = accounts.filter(
                (a) => a.status !== "PENDING" && a.status !== "REJECTED" && a.status !== "SUSPENDED"
            ).length;
            const connectedAccountCount = accounts.filter((a) => a.isFresh).length;
            const activeTradingAccountCount = accounts.filter((a) => a.totalTrades > 0 && a.isFresh).length;

            const capBreakdown = computeCapitalBreakdown(u.tradingAccounts);

            const jStats = journalStatsMap.get(u.id) || { count: 0, lotVolume: 0 };

            // Determine dataFreshness
            let dataFreshness: "FRESH" | "STALE" | "DISCONNECTED" | "MIXED" = "DISCONNECTED";
            if (connectedAccountCount > 0 && connectedAccountCount === eligibleAccountCount) {
                dataFreshness = "FRESH";
            } else if (connectedAccountCount > 0) {
                dataFreshness = "MIXED";
            }

            return {
                userId: u.id,
                userName: u.name || "Unnamed Trader",
                userEmail: u.email || "No Email",
                country: u.profile?.country || null,
                tradingStyle:
                    (u.settings as { tradingStyle?: { archetypeTitle?: string } } | null)
                        ?.tradingStyle?.archetypeTitle ?? null,
                vipStatus,
                vipExpiresAt,
                products,
                registeredAccountCount,
                eligibleAccountCount,
                connectedAccountCount,
                activeTradingAccountCount,
                reportedCapitalByCurrency: capBreakdown.byCurrency,
                freshCapitalByCurrency: capBreakdown.freshByCurrency,
                reportedEquityByCurrency: capBreakdown.equityByCurrency,
                isMixedCurrency: capBreakdown.isMixedCurrency,
                totalTrades30d: jStats.count,
                totalLotVolume30d: jStats.lotVolume,
                lastTradeAt: null,
                lastHeartbeatAt: accounts[0]?.lastHeartbeat || null,
                dataFreshness,
                duplicateAccountCount,
                accounts,
            };
        })
    );

    // Apply Client Sort if needed (CAPITAL_DESC, ACCOUNTS_DESC)
    if (filters.sort === "CAPITAL_DESC") {
        rows.sort((a, b) => {
            const capA = a.reportedCapitalByCurrency["USD"] || 0;
            const capB = b.reportedCapitalByCurrency["USD"] || 0;
            return capB - capA;
        });
    } else if (filters.sort === "ACCOUNTS_DESC") {
        rows.sort((a, b) => b.registeredAccountCount - a.registeredAccountCount);
    }

    const totalPages = Math.ceil(totalUsers / pageSize) || 1;

    // Overall summary for current filters
    const summaryBreakdown = computeCapitalBreakdown(
        rows.flatMap((r) => r.accounts)
    );

    return {
        rows,
        total: totalUsers,
        page,
        pageSize,
        totalPages,
        summary: {
            totalTradersInFilter: totalUsers,
            activeVipTraders: rows.filter((r) => r.vipStatus === "ACTIVE" || r.vipStatus === "GRACE").length,
            totalReportedCapitalUSD: summaryBreakdown.usdBalanceTotal,
            totalFreshCapitalUSD: summaryBreakdown.usdFreshBalanceTotal,
            capitalCurrencyBreakdown: summaryBreakdown.byCurrency,
            freshCapitalCurrencyBreakdown: summaryBreakdown.freshByCurrency,
            connectedAccountsCount: rows.reduce((s, r) => s + r.connectedAccountCount, 0),
             staleAccountsCount: rows.reduce((s, r) => s + (r.eligibleAccountCount - r.connectedAccountCount), 0),
             disconnectedAccountsCount: rows.reduce(
                 (s, r) =>
                     s +
                     r.accounts.filter((account) => {
                         if (account.status === "PENDING" || account.status === "REJECTED" || account.status === "SUSPENDED") {
                             return false;
                         }
                         const signal = [account.lastHeartbeat, account.lastSync]
                             .filter((value): value is string => Boolean(value))
                             .map((value) => new Date(value).getTime())
                             .filter((value) => Number.isFinite(value))
                             .sort((a, b) => b - a)[0];
                         return !signal || Date.now() - signal > 7 * 24 * 60 * 60 * 1000;
                     }).length,
                 0
             ),
            activeToolUsersCount: rows.filter((r) => r.products.some((p) => p.usageState === "ACTIVE")).length,
            dataQualityWarningsCount: rows.reduce((s, r) => s + r.duplicateAccountCount, 0),
            asOf: new Date().toISOString(),
        },
    };
}

// The V2 implementation applies every filter before pagination and computes
// summaries from the full filtered set. Keep the legacy implementation above
// temporarily for safe rollback while all callers use the corrected path.
export async function getPaginatedTraderMonitor(filters: IbTraderFilters): Promise<IbTraderPaginatedResult> {
    return getPaginatedTraderMonitorV2(filters);
}
