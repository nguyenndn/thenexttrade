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

    const FX_RATES_TO_USD: Record<string, number> = {
        USD: 1.0,
        USC: 0.01,
        CENT: 0.01,
        USCENT: 0.01,
        EUR: 1.08,
        EUC: 0.0108,
        GBP: 1.28,
        GBC: 0.0128,
        AUD: 0.65,
        CAD: 0.73,
        CHF: 1.13,
        JPY: 0.0067,
        SGD: 0.76,
    };

    const currencyKeys = Object.keys(byCurrency);
    const isMixedCurrency = currencyKeys.length > 1;

    let balSum = 0;
    let freshSum = 0;
    let eqSum = 0;

    for (const [curr, bal] of Object.entries(byCurrency)) {
        const eq = equityByCurrency[curr] || 0;
        const freshBal = freshByCurrency[curr] || 0;
        const rate = FX_RATES_TO_USD[curr] ?? (curr === "UNKNOWN" ? 0 : 1.0);

        balSum += bal * rate;
        freshSum += freshBal * rate;
        eqSum += eq * rate;
    }

    const usdBalanceTotal = Math.round(balSum * 100) / 100;
    const usdFreshBalanceTotal = Math.round(freshSum * 100) / 100;
    const usdEquityTotal = Math.round(eqSum * 100) / 100;

    return {
        byCurrency,
        freshByCurrency,
        equityByCurrency,
        isMixedCurrency,
        usdBalanceTotal,
        usdFreshBalanceTotal,
        usdEquityTotal,
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
