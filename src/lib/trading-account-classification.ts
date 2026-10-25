export interface TradingAccountIdentity {
    accountType?: string | null;
    server?: string | null;
    broker?: string | null;
    status?: string | null;
}

export interface TradingPayloadIdentity {
    accountType?: string | null;
    accountTradeMode?: string | number | null;
    server?: string | null;
    broker?: string | null;
}

const NON_LIVE_MARKERS = ["demo", "contest", "evaluation", "trial"];

function containsNonLiveMarker(value: string | null | undefined): boolean {
    const normalized = (value || "").toLowerCase();
    return NON_LIVE_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Demo, contest, evaluation, and trial accounts are never eligible for
 * funding, VIP volume, capital, or commission metrics.
 */
export function isDemoTradingAccount(account: TradingAccountIdentity): boolean {
    return (
        containsNonLiveMarker(account.accountType) ||
        containsNonLiveMarker(account.server) ||
        containsNonLiveMarker(account.broker)
    );
}

/**
 * Classifies EA payload identity without trusting an explicit REAL marker to
 * override a Demo/Contest/Evaluation/Trial marker in another field.
 */
export function isNonLiveTradingPayload(
    payload: TradingPayloadIdentity
): boolean {
    const tradeMode = String(payload.accountTradeMode ?? "")
        .trim()
        .toLowerCase();

    if (
        tradeMode === "0" ||
        tradeMode === "1" ||
        containsNonLiveMarker(tradeMode)
    ) {
        return true;
    }

    return isDemoTradingAccount(payload);
}

export function isLiveTradingPayload(
    payload: TradingPayloadIdentity
): boolean {
    return !isNonLiveTradingPayload(payload);
}

/**
 * A live account is connected and not marked as demo/contest/evaluation/trial.
 * This keeps legacy account-type labels (for example CENT or STANDARD) eligible
 * while ensuring demo markers in any identity field always disqualify it.
 */
export function isLiveTradingAccount(account: TradingAccountIdentity): boolean {
    if (
        account.status === "PENDING" ||
        account.status === "REJECTED" ||
        account.status === "SUSPENDED" ||
        isDemoTradingAccount(account)
    ) {
        return false;
    }

    return true;
}
