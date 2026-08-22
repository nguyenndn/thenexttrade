import { prisma } from "@/lib/prisma";
import { computeCapitalBreakdown } from "./capital.server";
import { DEFAULT_PAGE_SIZE } from "./ib-monitor.constants";
import { resolveProductSummariesForUsers } from "./product-usage.server";
import { normalizeSyncSource, getSyncSourceLabel } from "@/lib/sync/sync-source";
import {
    ExpandedTraderAccount,
    IbTraderFilters,
    IbTraderPaginatedResult,
    IbTraderRow,
    ProductUsageSummary,
} from "./ib-monitor.types";

const DAY_MS = 24 * 60 * 60 * 1000;
type Freshness = "FRESH" | "STALE" | "DISCONNECTED";

function accountType(value: string | null | undefined): "REAL" | "DEMO" | "UNKNOWN" {
    const normalized = (value || "").toUpperCase();
    if (normalized.includes("REAL") || normalized === "PERSONAL" || normalized.includes("FUNDED")) return "REAL";
    if (normalized.includes("DEMO") || normalized.includes("EVALUATION")) return "DEMO";
    return "UNKNOWN";
}

function eligible(account: any) {
    return !["PENDING", "REJECTED", "SUSPENDED"].includes(account.status);
}

function signalAt(account: any): Date | null {
    const heartbeat = account.lastHeartbeat ? new Date(account.lastHeartbeat) : null;
    const sync = account.lastSync ? new Date(account.lastSync) : null;
    return [heartbeat, sync]
        .filter((value): value is Date => value !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;
}

function freshness(signal: Date | null, now: Date): Freshness {
    if (!signal) return "DISCONNECTED";
    const age = now.getTime() - signal.getTime();
    if (age <= DAY_MS) return "FRESH";
    if (age <= 7 * DAY_MS) return "STALE";
    return "DISCONNECTED";
}

function vipStatus(entitlements: any[], now: Date) {
    let status: IbTraderRow["vipStatus"] = "NONE";
    let expiresAt: string | null = null;
    for (const entitlement of entitlements) {
        const active = !entitlement.expiresAt || entitlement.expiresAt > now;
        if (entitlement.status === "ACTIVE" && active) {
            return { status: "ACTIVE" as const, expiresAt: entitlement.expiresAt?.toISOString() || null };
        }
        if (entitlement.status === "GRACE" && active) {
            status = "GRACE";
            expiresAt = entitlement.expiresAt?.toISOString() || null;
        } else if (entitlement.status === "EXPIRED" && status === "NONE") {
            status = "EXPIRED";
        } else if (entitlement.status === "REVOKED" && status === "NONE") {
            status = "REVOKED";
        }
    }
    return { status, expiresAt };
}

type AccountView = {
    raw: any;
    type: "REAL" | "DEMO" | "UNKNOWN";
    signal: Date | null;
    freshness: Freshness;
    duplicate: boolean;
};

type TraderView = {
    user: any;
    vip: ReturnType<typeof vipStatus>;
    products: ProductUsageSummary[];
    accounts: AccountView[];
    capital: ReturnType<typeof computeCapitalBreakdown>;
    trades30d: number;
    lots30d: number;
    lastTradeAt: string | null;
};

function selectedProducts(view: TraderView, slug?: string) {
    return !slug || slug === "ALL" ? view.products : view.products.filter((item) => item.productSlug === slug);
}

function matchesVipStatus(view: TraderView, filter?: string) {
    if (!filter || filter === "ALL") return true;
    if (filter === "EXPIRING") {
        if (!["ACTIVE", "GRACE"].includes(view.vip.status) || !view.vip.expiresAt) return false;
        const expiresAt = new Date(view.vip.expiresAt).getTime();
        return expiresAt >= Date.now() && expiresAt <= Date.now() + 7 * DAY_MS;
    }
    if (filter === "FREE") return ["NONE", "EXPIRED", "REVOKED"].includes(view.vip.status);
    return view.vip.status === filter;
}

function matchesToolState(products: ProductUsageSummary[], state?: string) {
    if (!state || state === "ALL") return true;
    if (state === "NO_ACCESS") return products.every((item) => item.accessState === "NO_ACCESS");
    if (state === "GRANTED") return products.some((item) => ["GRANTED", "LEGACY_PRO_FALLBACK"].includes(item.accessState));
    if (state === "DOWNLOADED") return products.some((item) => item.usageState === "DOWNLOADED");
    if (state === "RECENTLY_USED") return products.some((item) => item.usageState === "RECENTLY_USED");
    if (state === "ACTIVE") return products.some((item) => item.usageState === "ACTIVE");
    if (state === "UNKNOWN_LEGACY") return products.some((item) => item.usageState === "UNKNOWN_LEGACY");
    if (state === "STALE") return products.some((item) => item.lastUsedAt && Date.now() - new Date(item.lastUsedAt).getTime() > 7 * DAY_MS);
    return true;
}

function matchesLastTrade(value: string | null, filter: string | undefined, now: Date) {
    if (!filter || filter === "ALL") return true;
    if (filter === "NEVER") return !value;
    if (!value) return false;
    const time = new Date(value).getTime();
    if (filter === "TODAY") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return time >= start.getTime();
    }
    if (filter === "7D") return time >= now.getTime() - 7 * DAY_MS;
    if (filter === "30D") return time >= now.getTime() - 30 * DAY_MS;
    return true;
}

function matchesCapital(value: number, filter?: string) {
    if (!filter || filter === "ALL") return true;
    if (filter === "0_1K") return value >= 0 && value < 1000;
    if (filter === "1K_10K") return value >= 1000 && value < 10000;
    if (filter === "10K_50K") return value >= 10000 && value < 50000;
    if (filter === "50K_PLUS") return value >= 50000;
    return true;
}

function matches(view: TraderView, filters: IbTraderFilters, now: Date) {
    if (!matchesVipStatus(view, filters.vip)) return false;
    const products = selectedProducts(view, filters.product);
    if (filters.product && filters.product !== "ALL" && products.length === 0) return false;
    if (!matchesToolState(products, filters.toolState)) return false;
    if (filters.accountType && filters.accountType !== "ALL" && !view.accounts.some((item) => item.type === filters.accountType)) return false;
    if (filters.syncSource && filters.syncSource !== "ALL" && !view.accounts.some((item) => normalizeSyncSource(item.raw.syncSource) === filters.syncSource)) return false;
    if (filters.accountHealth && filters.accountHealth !== "ALL") {
        const ok = view.accounts.some((item) => {
            if (!eligible(item.raw)) return false;
            if (filters.accountHealth === "NO_TRADES") return item.raw.totalTrades === 0;
            if (filters.accountHealth === "NEVER_SYNCED") return !item.signal;
            if (filters.accountHealth === "CONNECTED") return item.freshness === "FRESH";
            return item.freshness === filters.accountHealth;
        });
        if (!ok) return false;
    }
    if (filters.minAccounts !== undefined && view.accounts.length < filters.minAccounts) return false;
    if (filters.maxAccounts !== undefined && view.accounts.length > filters.maxAccounts) return false;
    if (!matchesCapital(view.capital.byCurrency.USD || 0, filters.capitalBand)) return false;
    return matchesLastTrade(view.lastTradeAt, filters.lastTrade, now);
}

function buildRow(view: TraderView, lastTradeByAccount: Map<string, string>): IbTraderRow {
    const seen = new Set<string>();
    const duplicateKeys = new Set<string>();
    const accountViews = view.accounts;
    const accounts: ExpandedTraderAccount[] = accountViews.map((item) => {
        const raw = item.raw;
        const key = `${raw.broker || ""}:${raw.accountNumber || ""}`.toLowerCase();
        const duplicate = Boolean(key !== ":" && seen.has(key));
        if (key !== ":") seen.add(key);
        if (duplicate) duplicateKeys.add(key);
        return {
            id: raw.id,
            accountNumber: raw.accountNumber || "N/A",
            rawAccountNumber: raw.accountNumber || "",
            broker: raw.broker || "Unknown",
            server: raw.server || null,
            platform: raw.platform || "MetaTrader 5",
            currency: (raw.currency || "UNKNOWN").toUpperCase(),
            balance: raw.balance || 0,
            equity: raw.equity || 0,
            accountType: item.type,
            status: raw.status,
            syncSource: raw.syncSource,
            syncSourceLabel: getSyncSourceLabel(normalizeSyncSource(raw.syncSource)),
            eaVersion: raw.eaVersion || null,
            lastSync: raw.lastSync?.toISOString() || null,
            lastHeartbeat: raw.lastHeartbeat?.toISOString() || null,
            lastTrade: lastTradeByAccount.get(raw.id) || null,
            isFresh: item.freshness === "FRESH",
            isDuplicate: duplicate,
            totalTrades: raw.totalTrades || 0,
        };
    });
    const activeAccounts = accountViews.filter((item) => eligible(item.raw));
    const states = new Set(accountViews.filter((item) => eligible(item.raw)).map((item) => item.freshness));
    const dataFreshness: IbTraderRow["dataFreshness"] =
        states.size === 0 ? "DISCONNECTED" : states.size === 1 ? [...states][0] : "MIXED";
    const heartbeat = accountViews
        .map((item) => item.signal?.getTime())
        .filter((value): value is number => typeof value === "number");
    return {
        userId: view.user.id,
        userName: view.user.name || "Unnamed Trader",
        userEmail: view.user.email || "No Email",
        country: view.user.profile?.country || null,
        tradingStyle:
            (view.user.settings as { tradingStyle?: { archetypeTitle?: string } } | null)
                ?.tradingStyle?.archetypeTitle ?? null,
        vipStatus: view.vip.status,
        vipExpiresAt: view.vip.expiresAt,
        products: view.products,
        registeredAccountCount: accounts.length,
        eligibleAccountCount: activeAccounts.length,
        connectedAccountCount: activeAccounts.filter((item) => item.freshness === "FRESH").length,
        activeTradingAccountCount: activeAccounts.filter(
            (item) => item.raw.totalTrades > 0 && item.freshness === "FRESH"
        ).length,
        reportedCapitalByCurrency: view.capital.byCurrency,
        freshCapitalByCurrency: view.capital.freshByCurrency,
        reportedEquityByCurrency: view.capital.equityByCurrency,
        isMixedCurrency: view.capital.isMixedCurrency,
        totalTrades30d: view.trades30d,
        totalLotVolume30d: view.lots30d,
        lastTradeAt: view.lastTradeAt,
        lastHeartbeatAt: heartbeat.length ? new Date(Math.max(...heartbeat)).toISOString() : null,
        dataFreshness,
        duplicateAccountCount: duplicateKeys.size,
        accounts,
    };
}

export async function getPaginatedTraderMonitorV2(filters: IbTraderFilters): Promise<IbTraderPaginatedResult> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
    const page = filters.page || 1;
    const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE;
    const where: any = {};
    if (filters.q) {
        where.OR = [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { tradingAccounts: { some: { OR: [{ accountNumber: { contains: filters.q, mode: "insensitive" } }, { broker: { contains: filters.q, mode: "insensitive" } }] } } },
        ];
    }
    if (filters.broker && filters.broker !== "ALL") where.tradingAccounts = { some: { broker: { equals: filters.broker, mode: "insensitive" } } };
    if (filters.vip && filters.vip !== "ALL") {
        if (filters.vip === "ACTIVE") where.proEntitlements = { some: { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } };
        if (filters.vip === "GRACE") where.proEntitlements = { some: { status: "GRACE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } };
        if (filters.vip === "REVOKED") where.proEntitlements = { some: { status: "REVOKED" } };
        if (filters.vip === "FREE") where.proEntitlements = { none: { status: { in: ["ACTIVE", "GRACE"] }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } };
        if (filters.vip === "EXPIRING") where.proEntitlements = { some: { status: { in: ["ACTIVE", "GRACE"] }, expiresAt: { gte: now, lte: new Date(now.getTime() + 7 * DAY_MS) } } };
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            settings: true,
            profile: { select: { country: true } },
            tradingAccounts: {
                select: {
                    id: true, broker: true, server: true, accountNumber: true, balance: true, equity: true,
                    currency: true, platform: true, status: true, syncSource: true, eaVersion: true,
                    lastSync: true, lastHeartbeat: true, totalTrades: true, accountType: true,
                },
                orderBy: { updatedAt: "desc" },
            },
            proEntitlements: {
                select: { id: true, status: true, expiresAt: true, startsAt: true },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    if (!users.length) {
        return {
            rows: [], total: 0, page, pageSize, totalPages: 1,
            summary: { totalTradersInFilter: 0, activeVipTraders: 0, totalReportedCapitalUSD: 0, totalFreshCapitalUSD: 0, capitalCurrencyBreakdown: {}, freshCapitalCurrencyBreakdown: {}, connectedAccountsCount: 0, staleAccountsCount: 0, disconnectedAccountsCount: 0, activeToolUsersCount: 0, dataQualityWarningsCount: 0, asOf: now.toISOString() },
        };
    }
    const userIds = users.map((user) => user.id);
    const accountIds = users.flatMap((user) => user.tradingAccounts.map((account) => account.id));
    const [groupedTrades, accountTrades, productMap] = await Promise.all([
        prisma.journalEntry.groupBy({ by: ["userId"], where: { userId: { in: userIds }, status: "CLOSED", exitDate: { gte: thirtyDaysAgo } }, _count: { id: true }, _sum: { lotSize: true }, _max: { exitDate: true } }),
        accountIds.length ? prisma.journalEntry.findMany({ where: { accountId: { in: accountIds }, status: "CLOSED", exitDate: { not: null } }, select: { accountId: true, exitDate: true }, orderBy: { exitDate: "desc" } }) : Promise.resolve([]),
        resolveProductSummariesForUsers(users.map((user) => ({ userId: user.id, hasActiveProEntitlement: user.proEntitlements.some((item) => ["ACTIVE", "GRACE"].includes(item.status) && (!item.expiresAt || item.expiresAt > now)) }))),
    ]);
    const tradeStats = new Map(groupedTrades.map((item) => [item.userId, { count: item._count.id, lots: item._sum.lotSize || 0, last: item._max.exitDate?.toISOString() || null }]));
    const lastTradeByAccount = new Map<string, string>();
    for (const trade of accountTrades) if (trade.accountId && trade.exitDate && !lastTradeByAccount.has(trade.accountId)) lastTradeByAccount.set(trade.accountId, trade.exitDate.toISOString());

    const views: TraderView[] = users.map((user) => {
        // Flag duplicate accounts (same broker+accountNumber for this user)
        // at view-build time so they can be excluded from the capital
        // breakdown — a duplicated account must not double-count funds.
        const seenKeys = new Set<string>();
        const accounts = user.tradingAccounts.map((raw) => {
            const signal = signalAt(raw);
            const key = `${raw.broker || ""}:${raw.accountNumber || ""}`.toLowerCase();
            const duplicate = Boolean(key !== ":" && seenKeys.has(key));
            if (key !== ":") seenKeys.add(key);
            return {
                raw,
                type: accountType(raw.accountType),
                signal,
                freshness: freshness(signal, now),
                duplicate,
            };
        });
        const stats = tradeStats.get(user.id) || { count: 0, lots: 0, last: null };
        const uniqueAccounts = accounts
            .filter((item) => !item.duplicate)
            .map((item) => item.raw);
        // lastTradeAt must reflect the FULL history (like the per-account
        // card's lastTrade), not just the trailing 30-day window — otherwise
        // a trader with a 40-day-old trade reads as "never traded".
        const accountLastTrades = accounts
            .map((item) => lastTradeByAccount.get(item.raw.id))
            .filter((value): value is string => Boolean(value));
        const fullLastTradeAt = accountLastTrades.length
            ? accountLastTrades.sort((a, b) => (b > a ? 1 : -1))[0]
            : null;
        return {
            user,
            vip: vipStatus(user.proEntitlements, now),
            products: productMap.get(user.id) || [],
            accounts,
            capital: computeCapitalBreakdown(uniqueAccounts),
            trades30d: stats.count,
            lots30d: stats.lots,
            lastTradeAt: fullLastTradeAt,
        };
    }).filter((view) => matches(view, filters, now));

    views.sort((a, b) => {
        const created = b.user.createdAt.getTime() - a.user.createdAt.getTime();
        if (filters.sort === "CAPITAL_DESC") return (b.capital.byCurrency.USD || 0) - (a.capital.byCurrency.USD || 0) || created;
        if (filters.sort === "EQUITY_DESC") return (b.capital.equityByCurrency.USD || 0) - (a.capital.equityByCurrency.USD || 0) || created;
        if (filters.sort === "ACCOUNTS_DESC") return b.accounts.length - a.accounts.length || created;
        if (filters.sort === "LAST_ACTIVITY_DESC") return (b.lastTradeAt ? new Date(b.lastTradeAt).getTime() : 0) - (a.lastTradeAt ? new Date(a.lastTradeAt).getTime() : 0) || created;
        return created;
    });
    const total = views.length;
    const rows = views.slice((page - 1) * pageSize, page * pageSize).map((view) => buildRow(view, lastTradeByAccount));
    const allRows = views.map((view) => buildRow(view, lastTradeByAccount));
    // Exclude duplicated accounts from the aggregate capital too — they are
    // already flagged per-row, but summing them here would double-count funds
    // in the summary cards.
    const capital = computeCapitalBreakdown(
        views.flatMap((view) =>
            view.accounts
                .filter((account) => !account.duplicate)
                .map((account) => account.raw)
        )
    );
    return {
        rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1,
        summary: {
            totalTradersInFilter: total,
            activeVipTraders: views.filter((view) => ["ACTIVE", "GRACE"].includes(view.vip.status)).length,
            totalReportedCapitalUSD: capital.usdBalanceTotal,
            totalFreshCapitalUSD: capital.usdFreshBalanceTotal,
            capitalCurrencyBreakdown: capital.byCurrency,
            freshCapitalCurrencyBreakdown: capital.freshByCurrency,
            connectedAccountsCount: allRows.reduce((sum, row) => sum + row.connectedAccountCount, 0),
            staleAccountsCount: allRows.reduce((sum, row) => sum + row.accounts.filter((account) => {
                if (!eligible(account)) return false;
                const signal = [account.lastHeartbeat, account.lastSync]
                    .filter(Boolean)
                    .map((value) => new Date(value as string).getTime())
                    .sort((a, b) => b - a)[0];
                return signal !== undefined && now.getTime() - signal > DAY_MS && now.getTime() - signal <= 7 * DAY_MS;
            }).length, 0),
            disconnectedAccountsCount: allRows.reduce((sum, row) => sum + row.accounts.filter((account) => {
                if (!eligible(account)) return false;
                const signal = [account.lastHeartbeat, account.lastSync]
                    .filter(Boolean)
                    .map((value) => new Date(value as string).getTime())
                    .sort((a, b) => b - a)[0];
                return signal === undefined || now.getTime() - signal > 7 * DAY_MS;
            }).length, 0),
            activeToolUsersCount: views.filter((view) => view.products.some((product) => product.usageState === "ACTIVE")).length,
            dataQualityWarningsCount: allRows.reduce((sum, row) => sum + row.duplicateAccountCount, 0),
            asOf: now.toISOString(),
        },
    };
}
