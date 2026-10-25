/**
 * A trading account login is only unique within a broker. `123456` on
 * Exness and `123456` on Vantage are different accounts, so every lookup
 * and write must carry both the normalized broker key and account number.
 */
export function normalizeAccountNumber(
    value: string | null | undefined
): string {
    return String(value ?? "").trim();
}

/**
 * Broker display names are stored inconsistently (`IC Markets`, `ICMarkets`,
 * `icmarkets`). Strip case, whitespace and separators so the same broker
 * compares equal everywhere, then fold the known aliases.
 */
export function normalizeBrokerKey(
    value: string | null | undefined
): string {
    if (!value) return "";
    const cleaned = String(value)
        .toUpperCase()
        .replace(/[\s\-_]/g, "");
    if (cleaned.startsWith("VANTAGE")) return "VANTAGE";
    if (cleaned.startsWith("EXNESS")) return "EXNESS";
    if (
        cleaned.startsWith("VTMARKET") ||
        cleaned === "VT" ||
        cleaned.startsWith("VTGLOBAL")
    ) {
        return "VTMARKETS";
    }
    if (cleaned.startsWith("ULTIMA")) return "ULTIMAMARKETS";
    return cleaned;
}

/**
 * True when both broker names refer to the same broker once normalized.
 */
export function isSameBroker(
    a: string | null | undefined,
    b: string | null | undefined
): boolean {
    const left = normalizeBrokerKey(a);
    return !!left && left === normalizeBrokerKey(b);
}

export function buildTradingAccountIdentity(params: {
    userId: string;
    broker: string | null | undefined;
    accountNumber: string | null | undefined;
}) {
    return {
        userId: params.userId,
        broker: normalizeBrokerKey(params.broker),
        accountNumber: normalizeAccountNumber(params.accountNumber),
    };
}

/**
 * Narrows rows that share an account number to the requested broker.
 * A legacy row with no broker is adopted only when it is the sole candidate,
 * so an ambiguous login never mutates the wrong broker's account.
 */
export function filterAccountsByBroker<T extends { broker: string | null }>(
    candidates: T[],
    broker: string | null | undefined
): T[] {
    const brokerKey = normalizeBrokerKey(broker);
    if (!brokerKey) return candidates;

    const matches = candidates.filter(
        (candidate) => normalizeBrokerKey(candidate.broker) === brokerKey
    );
    if (matches.length > 0) return matches;

    const unknownBroker = candidates.filter(
        (candidate) => !normalizeBrokerKey(candidate.broker)
    );
    return candidates.length === 1 && unknownBroker.length === 1
        ? unknownBroker
        : [];
}

export function buildCsvRowKey(
    accountNumber: string | null | undefined,
    broker?: string | null
): string {
    const account = normalizeAccountNumber(accountNumber);
    const brokerKey = normalizeBrokerKey(broker);
    return brokerKey ? `${brokerKey}::${account}` : `acct::${account}`;
}
