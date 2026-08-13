import { prisma } from "@/lib/prisma";

export interface CapitalBreakdown {
    byCurrency: Record<string, number>;
    freshByCurrency: Record<string, number>;
    equityByCurrency: Record<string, number>;
    isMixedCurrency: boolean;
    usdBalanceTotal: number | null;
    usdFreshBalanceTotal: number | null;
    usdEquityTotal: number | null;
}

interface CapitalAccountIdentity {
    accountType?: string | null;
    server?: string | null;
    status?: string | null;
}

export function isDemoTradingAccount(account: CapitalAccountIdentity): boolean {
    return (
        account.accountType?.toUpperCase().includes("DEMO") === true ||
        account.server?.toLowerCase().includes("demo") === true
    );
}

export function isLiveCapitalAccount(account: CapitalAccountIdentity): boolean {
    if (
        account.status === "PENDING" ||
        account.status === "REJECTED" ||
        account.status === "SUSPENDED" ||
        isDemoTradingAccount(account)
    ) {
        return false;
    }

    if (!account.accountType) return true;

    const normalizedType = account.accountType.toUpperCase();
    return (
        normalizedType.includes("REAL") ||
        normalizedType === "PERSONAL" ||
        normalizedType.includes("FUNDED")
    );
}

export function computeCapitalBreakdown(
    accounts: Array<{
        balance: number;
        equity: number | null;
        currency?: string | null;
        accountType?: string | null;
        server?: string | null;
        lastHeartbeat: Date | string | null;
        lastSync: Date | string | null;
        status: string;
    }>
): CapitalBreakdown {
    const byCurrency: Record<string, number> = {};
    const freshByCurrency: Record<string, number> = {};
    const equityByCurrency: Record<string, number> = {};

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const acc of accounts) {
        if (!isLiveCapitalAccount(acc)) continue;

        // Never silently convert an unknown currency to USD. Keep it visible in
        // the breakdown while preventing a false USD aggregate.
        const curr = (acc.currency || "UNKNOWN").toUpperCase();
        const bal = acc.balance || 0;
        const eq = acc.equity || 0;

        byCurrency[curr] = (byCurrency[curr] || 0) + bal;
        equityByCurrency[curr] = (equityByCurrency[curr] || 0) + eq;

        // Fresh check (sync or heartbeat within 24 hours)
        const hbDate = acc.lastHeartbeat ? new Date(acc.lastHeartbeat) : null;
        const syncDate = acc.lastSync ? new Date(acc.lastSync) : null;
        const newestSignal = [hbDate, syncDate]
            .filter((value): value is Date => value !== null)
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;

        if (newestSignal && newestSignal >= twentyFourHoursAgo) {
            freshByCurrency[curr] = (freshByCurrency[curr] || 0) + bal;
        }
    }

    const currencyKeys = Object.keys(byCurrency);
    const isMixedCurrency = currencyKeys.length > 1;

    const isAllUsd =
        currencyKeys.length === 0 ||
        (currencyKeys.length === 1 && currencyKeys[0] === "USD");

    return {
        byCurrency,
        freshByCurrency,
        equityByCurrency,
        isMixedCurrency,
        usdBalanceTotal: isAllUsd ? byCurrency["USD"] || 0 : null,
        usdFreshBalanceTotal: isAllUsd ? freshByCurrency["USD"] || 0 : null,
        usdEquityTotal: isAllUsd ? equityByCurrency["USD"] || 0 : null,
    };
}

export async function captureCapitalSnapshot(params: {
    tradingAccountId: string;
    balance: number;
    equity?: number | null;
    currency?: string;
    source: string;
}): Promise<void> {
    try {
        await prisma.tradingAccountCapitalSnapshot.create({
            data: {
                tradingAccountId: params.tradingAccountId,
                balance: params.balance,
                equity: params.equity ?? null,
                currency: (params.currency || "UNKNOWN").toUpperCase(),
                source: params.source,
            },
        });
    } catch (err) {
        console.error("Failed to capture capital snapshot:", err);
    }
}
