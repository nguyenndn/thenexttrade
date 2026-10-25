import {
    isDemoTradingAccount,
    isLiveTradingAccount,
    type TradingAccountIdentity,
} from "@/lib/trading-account-classification";

export const OPERATIONAL_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Shared operational counts for dashboards.
 *
 * Operational counts answer "how many accounts do we see?" and may include
 * demo accounts, so they are always reported separately from business-value
 * metrics (capital, funding, VIP volume, commission), which must use
 * `isLiveTradingAccount` / `computeCapitalBreakdown` instead.
 */
export interface OperationalAccountCounts {
    /** Every account in the input set, demo included. */
    allAccounts: number;
    /** Accounts that pass `isLiveTradingAccount` (not demo and not pending/rejected/suspended). */
    liveAccounts: number;
    /** Accounts carrying a demo/contest/evaluation/trial marker in any identity field. */
    demoAccounts: number;
    /** Live accounts with a heartbeat or sync within the 24h window. */
    connectedLiveAccounts24h: number;
}

export interface OperationalAccountSignal {
    lastHeartbeat?: Date | string | null;
    lastSync?: Date | string | null;
}

export function getLatestAccountSignalMs(
    account: OperationalAccountSignal
): number | null {
    let newest: number | null = null;
    for (const value of [account.lastHeartbeat, account.lastSync]) {
        if (!value) continue;
        const time = new Date(value).getTime();
        if (Number.isNaN(time)) continue;
        if (newest === null || time > newest) newest = time;
    }
    return newest;
}

export function buildOperationalAccountCounts<
    T extends TradingAccountIdentity & OperationalAccountSignal,
>(
    accounts: readonly T[],
    nowMs: number = Date.now(),
    windowMs: number = OPERATIONAL_ACTIVE_WINDOW_MS
): OperationalAccountCounts {
    let liveAccounts = 0;
    let demoAccounts = 0;
    let connectedLiveAccounts24h = 0;

    for (const account of accounts) {
        if (isDemoTradingAccount(account)) demoAccounts += 1;
        if (!isLiveTradingAccount(account)) continue;
        liveAccounts += 1;
        const signal = getLatestAccountSignalMs(account);
        if (signal !== null && nowMs - signal <= windowMs) {
            connectedLiveAccounts24h += 1;
        }
    }

    return {
        allAccounts: accounts.length,
        liveAccounts,
        demoAccounts,
        connectedLiveAccounts24h,
    };
}
