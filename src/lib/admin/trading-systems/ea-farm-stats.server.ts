import {
    computeCapitalBreakdown,
    isDemoTradingAccount,
} from "@/lib/admin/ib/capital.server";
import { buildOperationalAccountCounts } from "@/lib/operational-account-counts";
import type { ProductActiveUser } from "@/components/admin/trading-systems/ProductUsersModal";

export interface ProductFarmStats {
    confirmedFarmBalanceUSD: number;
    confirmedFarmEquityUSD: number;
    confirmedFreshBalanceUSD: number;
    userPoolBalanceUSD: number;
    userPoolEquityUSD: number;
    confirmedAccountsCount: number;
    /** All pool accounts with telemetry in the last 24h (demo included). */
    onlineAccountsCount: number;
    totalAccountsCount: number;
    /** Live-only pool accounts (demo excluded). */
    liveAccountsCount: number;
    demoAccountsCount: number;
    uniqueTradersCount: number;
}

interface RawAccount {
    id: string;
    accountNumber: string | null;
    broker: string | null;
    server: string | null;
    platform: string | null;
    accountType: string | null;
    balance: number;
    equity: number | null;
    currency: string | null;
    status: string;
    lastHeartbeat: Date | string | null;
    lastSync: Date | string | null;
}

interface RawUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt?: Date | string | null;
    tradingAccounts?: RawAccount[];
}

export interface RawProductForFarm {
    id: string;
    name: string;
    slug: string;
    version: string;
    accessRecords?: Array<{
        id: string;
        userId: string;
        tradingAccountId: string | null;
        status: string;
        createdAt: Date | string;
        grantedAt?: Date | string | null;
        lastUsedAt: Date | string | null;
        lastHeartbeatAt?: Date | string | null;
        user: RawUser | null;
        tradingAccount: RawAccount | null;
    }>;
    usageEvents?: Array<{
        id: string;
        userId: string;
        tradingAccountId: string | null;
        eventType: string;
        occurredAt: Date | string;
        user?: RawUser | null;
        tradingAccount?: RawAccount | null;
    }>;
    downloads?: Array<{
        id: string;
        userId: string;
        createdAt: Date | string;
        user?: RawUser | null;
    }>;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function toIsoString(val: Date | string | null | undefined): string | null {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

function getLatestSignalIso(
    ...dates: Array<Date | string | null | undefined>
): string | null {
    let newest: Date | null = null;
    for (const val of dates) {
        if (!val) continue;
        const d = val instanceof Date ? val : new Date(val);
        if (isNaN(d.getTime())) continue;
        if (!newest || d.getTime() > newest.getTime()) {
            newest = d;
        }
    }
    return newest ? newest.toISOString() : null;
}

export function buildProductFarmData(product: RawProductForFarm): {
    activeUsers: ProductActiveUser[];
    farmStats: ProductFarmStats;
} {
    const nowMs = Date.now();

    // Map of confirmed tradingAccountIds for this product -> latest product telemetry date
    const confirmedAccountMap = new Map<
        string,
        {
            account: RawAccount;
            user: RawUser;
            grantedAt: string | null;
            lastUsedAt: string | null;
            lastHeartbeatAt: string | null;
        }
    >();

    // Map of all users associated with this product (via access, usage, or download)
    const userMap = new Map<
        string,
        {
            user: RawUser;
            grantedAt: string | null;
            lastUsedAt: string | null;
            lastHeartbeatAt: string | null;
        }
    >();

    const registerUser = (
        user: RawUser | null | undefined,
        grantedAt?: Date | string | null,
        lastUsedAt?: Date | string | null,
        lastHeartbeatAt?: Date | string | null
    ) => {
        if (!user?.id) return;
        const existing = userMap.get(user.id);
        const mergedAccounts =
            user.tradingAccounts && user.tradingAccounts.length > 0
                ? user.tradingAccounts
                : existing?.user.tradingAccounts || [];

        userMap.set(user.id, {
            user: {
                ...existing?.user,
                ...user,
                tradingAccounts: mergedAccounts,
            },
            grantedAt:
                toIsoString(grantedAt) || existing?.grantedAt || null,
            lastUsedAt: getLatestSignalIso(
                lastUsedAt,
                existing?.lastUsedAt
            ),
            lastHeartbeatAt: getLatestSignalIso(
                lastHeartbeatAt,
                existing?.lastHeartbeatAt
            ),
        });
    };

    // 1. Process EAProductAccess records
    for (const ar of product.accessRecords || []) {
        if (!ar.user) continue;
        registerUser(
            ar.user,
            ar.grantedAt || ar.createdAt,
            ar.lastUsedAt,
            ar.lastHeartbeatAt
        );

        if (ar.tradingAccountId && ar.tradingAccount) {
            const existing = confirmedAccountMap.get(ar.tradingAccountId);
            confirmedAccountMap.set(ar.tradingAccountId, {
                account: ar.tradingAccount,
                user: ar.user,
                grantedAt:
                    toIsoString(ar.grantedAt || ar.createdAt) ||
                    existing?.grantedAt ||
                    null,
                lastUsedAt: getLatestSignalIso(
                    ar.lastUsedAt,
                    existing?.lastUsedAt
                ),
                lastHeartbeatAt: getLatestSignalIso(
                    ar.lastHeartbeatAt,
                    ar.tradingAccount.lastHeartbeat,
                    existing?.lastHeartbeatAt
                ),
            });
        }
    }

    // 2. Process EAProductUsageEvent records
    for (const ev of product.usageEvents || []) {
        if (ev.user) {
            registerUser(
                ev.user,
                null,
                ev.occurredAt,
                ev.eventType === "HEARTBEAT" ? ev.occurredAt : null
            );
        }
        if (ev.tradingAccountId && ev.tradingAccount && ev.user) {
            const existing = confirmedAccountMap.get(ev.tradingAccountId);
            confirmedAccountMap.set(ev.tradingAccountId, {
                account: ev.tradingAccount,
                user: ev.user,
                grantedAt: existing?.grantedAt || toIsoString(ev.occurredAt),
                lastUsedAt: getLatestSignalIso(
                    ev.occurredAt,
                    existing?.lastUsedAt
                ),
                lastHeartbeatAt: getLatestSignalIso(
                    ev.eventType === "HEARTBEAT" ? ev.occurredAt : null,
                    ev.tradingAccount.lastHeartbeat,
                    existing?.lastHeartbeatAt
                ),
            });
        }
    }

    // 3. Process EADownload records
    for (const dl of product.downloads || []) {
        if (dl.user) {
            registerUser(dl.user, dl.createdAt, dl.createdAt, null);
        }
    }

    // Build rows & account collections for capital computation
    const confirmedAccountsList: RawAccount[] = [];
    const poolAccountsMap = new Map<string, RawAccount>();
    const activeUsersRows: ProductActiveUser[] = [];
    const usersWithRows = new Set<string>();

    // First, add all confirmed account rows
    for (const [accId, entry] of confirmedAccountMap.entries()) {
        const { account, user, grantedAt, lastUsedAt, lastHeartbeatAt } = entry;
        confirmedAccountsList.push(account);
        poolAccountsMap.set(accId, account);
        usersWithRows.add(user.id);

        const latestSignal = getLatestSignalIso(
            lastHeartbeatAt,
            lastUsedAt,
            account.lastHeartbeat,
            account.lastSync
        );
        const isOnline =
            latestSignal !== null &&
            nowMs - new Date(latestSignal).getTime() <= TWENTY_FOUR_HOURS_MS;
        const isDemo = isDemoTradingAccount(account);

        activeUsersRows.push({
            id: `${product.id}:acc:${accId}`,
            userId: user.id,
            name: user.name || user.email?.split("@")[0] || "Trader",
            email: user.email || "",
            image: user.image,
            tradingAccountId: accId,
            accountNumber: account.accountNumber || "—",
            broker: account.broker || "Custom Broker",
            server: account.server || null,
            platform: account.platform || "MT5",
            accountType: isDemo ? "DEMO" : account.accountType || "REAL",
            balance: account.balance ?? 0,
            equity: account.equity ?? account.balance ?? 0,
            currency: account.currency || "USD",
            status: "GRANTED",
            accountStatus: account.status || "CONNECTED",
            isConfirmedAccount: true,
            isOnline,
            grantedAt,
            lastUsedAt: latestSignal,
            lastHeartbeatAt: getLatestSignalIso(
                lastHeartbeatAt,
                account.lastHeartbeat
            ),
        });
    }

    // Next, for users who have access/downloads/usage, include their other tradingAccounts in the User Pool
    // and if a user has no confirmed account row yet, display their primary trading account(s) or a user-level row
    for (const [userId, userEntry] of userMap.entries()) {
        const { user, grantedAt, lastUsedAt, lastHeartbeatAt } = userEntry;
        const userAccounts = user.tradingAccounts || [];

        for (const acc of userAccounts) {
            poolAccountsMap.set(acc.id, acc);
        }

        if (!usersWithRows.has(userId)) {
            if (userAccounts.length > 0) {
                for (const acc of userAccounts) {
                    const latestSignal = getLatestSignalIso(
                        lastHeartbeatAt,
                        lastUsedAt,
                        acc.lastHeartbeat,
                        acc.lastSync
                    );
                    const isOnline =
                        latestSignal !== null &&
                        nowMs - new Date(latestSignal).getTime() <=
                            TWENTY_FOUR_HOURS_MS;
                    const isDemo = isDemoTradingAccount(acc);

                    activeUsersRows.push({
                        id: `${product.id}:pool:${userId}:${acc.id}`,
                        userId,
                        name:
                            user.name || user.email?.split("@")[0] || "Trader",
                        email: user.email || "",
                        image: user.image,
                        tradingAccountId: acc.id,
                        accountNumber: acc.accountNumber || "—",
                        broker: acc.broker || "Custom Broker",
                        server: acc.server || null,
                        platform: acc.platform || "MT5",
                        accountType: isDemo
                            ? "DEMO"
                            : acc.accountType || "REAL",
                        balance: acc.balance ?? 0,
                        equity: acc.equity ?? acc.balance ?? 0,
                        currency: acc.currency || "USD",
                        status: "GRANTED",
                        accountStatus: acc.status || "DISCONNECTED",
                        isConfirmedAccount: false,
                        isOnline,
                        grantedAt,
                        lastUsedAt: latestSignal,
                        lastHeartbeatAt: getLatestSignalIso(
                            lastHeartbeatAt,
                            acc.lastHeartbeat
                        ),
                    });
                }
            } else {
                activeUsersRows.push({
                    id: `${product.id}:user:${userId}`,
                    userId,
                    name: user.name || user.email?.split("@")[0] || "Trader",
                    email: user.email || "",
                    image: user.image,
                    tradingAccountId: null,
                    accountNumber: "—",
                    broker: "No MT4/MT5 Linked",
                    server: null,
                    platform: "MT5",
                    accountType: null,
                    balance: null,
                    equity: null,
                    currency: "USD",
                    status: "GRANTED",
                    accountStatus: "PENDING",
                    isConfirmedAccount: false,
                    isOnline: false,
                    grantedAt,
                    lastUsedAt,
                    lastHeartbeatAt,
                });
            }
        }
    }

    // Sort activeUsersRows:
    // 1. Online confirmed accounts first
    // 2. Confirmed accounts by balance desc
    // 3. Online pool accounts
    // 4. Highest balance desc
    activeUsersRows.sort((a, b) => {
        if (Boolean(a.isConfirmedAccount) !== Boolean(b.isConfirmedAccount)) {
            return a.isConfirmedAccount ? -1 : 1;
        }
        if (Boolean(a.isOnline) !== Boolean(b.isOnline)) {
            return a.isOnline ? -1 : 1;
        }
        const balA = a.accountType === "DEMO" ? 0 : a.balance || 0;
        const balB = b.accountType === "DEMO" ? 0 : b.balance || 0;
        if (balB !== balA) return balB - balA;
        return a.name.localeCompare(b.name);
    });

    const withDefaultCurrency = (acc: RawAccount): RawAccount => ({
        ...acc,
        currency: acc.currency || "USD",
    });

    const confirmedBreakdown = computeCapitalBreakdown(
        confirmedAccountsList.map(withDefaultCurrency)
    );
    const poolBreakdown = computeCapitalBreakdown(
        Array.from(poolAccountsMap.values()).map(withDefaultCurrency)
    );

    const poolAccountCounts = buildOperationalAccountCounts(
        Array.from(poolAccountsMap.values()),
        nowMs
    );

    const onlineAccountsCount = Array.from(poolAccountsMap.values()).filter(
        (acc) => {
            const confirmedEntry = confirmedAccountMap.get(acc.id);
            const sig = getLatestSignalIso(
                confirmedEntry?.lastHeartbeatAt,
                confirmedEntry?.lastUsedAt,
                acc.lastHeartbeat,
                acc.lastSync
            );
            return (
                sig !== null &&
                nowMs - new Date(sig).getTime() <= TWENTY_FOUR_HOURS_MS
            );
        }
    ).length;

    const farmStats: ProductFarmStats = {
        confirmedFarmBalanceUSD: confirmedBreakdown.usdBalanceTotal || 0,
        confirmedFarmEquityUSD: confirmedBreakdown.usdEquityTotal || 0,
        confirmedFreshBalanceUSD: confirmedBreakdown.usdFreshBalanceTotal || 0,
        userPoolBalanceUSD: poolBreakdown.usdBalanceTotal || 0,
        userPoolEquityUSD: poolBreakdown.usdEquityTotal || 0,
        confirmedAccountsCount: confirmedAccountsList.length,
        onlineAccountsCount,
        totalAccountsCount: poolAccountsMap.size,
        liveAccountsCount: poolAccountCounts.liveAccounts,
        demoAccountsCount: poolAccountCounts.demoAccounts,
        uniqueTradersCount: userMap.size,
    };

    return {
        activeUsers: activeUsersRows,
        farmStats,
    };
}
