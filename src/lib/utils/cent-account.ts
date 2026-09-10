/**
 * Cent Account Utility Functions
 *
 * Normalizes trading volume (lots) and balance between Cent accounts and Standard ($) accounts.
 * Rule: 1 Cent Lot = 1,000 base currency units = 0.01 Standard Lot (100,000 base currency units).
 * Therefore: 100 Cent Lots = 1 Standard Lot ($ account).
 */

export const CENT_LOT_DIVISOR = 100;

const CENT_CURRENCIES = new Set([
    "USC",
    "CENT",
    "EU_CENT",
    "GB_CENT",
    "US_CENT",
    "USDT_CENT",
    "EURC",
    "GBPC",
]);

/**
 * Checks whether an account is a Cent account based on currency, server, or accountType.
 * Supports both object parameter and overloaded arguments (currency, server, accountType).
 */
export function isCentAccount(
    accountOrCurrency?:
        | {
              currency?: string | null;
              server?: string | null;
              accountType?: string | null;
              broker?: string | null;
          }
        | string
        | null,
    serverParam?: string | null,
    accountTypeParam?: string | null
): boolean {
    if (!accountOrCurrency) return false;

    let currency: string | null = null;
    let server: string | null = null;
    let accountType: string | null = null;

    if (typeof accountOrCurrency === "string") {
        currency = accountOrCurrency;
        server = serverParam ?? null;
        accountType = accountTypeParam ?? null;
    } else {
        currency = accountOrCurrency.currency ?? null;
        server = accountOrCurrency.server ?? null;
        accountType = accountOrCurrency.accountType ?? null;
    }

    if (currency) {
        const cur = currency.trim().toUpperCase();
        if (CENT_CURRENCIES.has(cur) || cur.includes("CENT") || cur.endsWith("C")) {
            return true;
        }
    }

    if (server) {
        const srv = server.toLowerCase();
        if (srv.includes("cent")) {
            return true;
        }
    }

    if (accountType) {
        const act = accountType.toLowerCase();
        if (act.includes("cent")) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if a trading symbol represents a Cent micro lot contract (e.g. XAUUSDc, EURUSDc, GBPUSDc).
 * Excludes crypto symbols that naturally contain 'c' like USDC, BTC, etc.
 */
export function isCentSymbol(symbol?: string | null): boolean {
    if (!symbol) return false;
    const sym = symbol.trim().toUpperCase();

    // Specific known crypto/fiats that end in C
    if (sym === "USDC" || sym.startsWith("USDC") || sym === "BUSD") {
        return false;
    }

    // Forex / Commodity cent suffix patterns: XAUUSDc, EURUSDc, etc. or .c / _c
    if (sym.endsWith("C") && (sym.length === 7 || sym.length === 8)) {
        // e.g. EURUSDc (7), XAUUSDc (7), EURUSD_c, etc.
        return true;
    }

    if (sym.endsWith(".C") || sym.endsWith("_C")) {
        return true;
    }

    return false;
}

/**
 * Normalizes lot size to Standard ($ account) lots.
 * If the trade is from a Cent account or has a Cent symbol: 100 Cent Lots = 1 Standard Lot.
 * Supports both boolean flag `isCent` and options object.
 */
export function normalizeLotSize(
    lotSize: number,
    options?:
        | boolean
        | {
              isCent?: boolean;
              symbol?: string | null;
              currency?: string | null;
              server?: string | null;
              accountType?: string | null;
          }
): number {
    if (!lotSize || isNaN(lotSize)) return 0;

    let isCent = false;
    if (typeof options === "boolean") {
        isCent = options;
    } else if (options) {
        isCent =
            Boolean(options.isCent) ||
            isCentSymbol(options.symbol) ||
            isCentAccount({
                currency: options.currency,
                server: options.server,
                accountType: options.accountType,
            });
    }

    if (isCent) {
        return Number((lotSize / CENT_LOT_DIVISOR).toFixed(4));
    }

    return lotSize;
}

/**
 * Normalizes balance from Cent account (cents) to standard USD.
 * E.g. 100,000 USC -> $1,000.00 USD
 * Supports boolean flag, options object, or (currency, server, accountType) arguments.
 */
export function normalizeUsdBalance(
    balance: number,
    optionsOrCurrency?:
        | boolean
        | string
        | null
        | {
              isCent?: boolean;
              currency?: string | null;
              server?: string | null;
              accountType?: string | null;
          },
    serverParam?: string | null,
    accountTypeParam?: string | null
): number {
    if (!balance || isNaN(balance)) return 0;

    let isCent = false;
    if (typeof optionsOrCurrency === "boolean") {
        isCent = optionsOrCurrency;
    } else if (typeof optionsOrCurrency === "string") {
        isCent = isCentAccount(optionsOrCurrency, serverParam, accountTypeParam);
    } else if (optionsOrCurrency) {
        isCent =
            Boolean(optionsOrCurrency.isCent) ||
            isCentAccount({
                currency: optionsOrCurrency.currency,
                server: optionsOrCurrency.server,
                accountType: optionsOrCurrency.accountType,
            });
    }

    if (isCent) {
        return Number((balance / 100).toFixed(2));
    }

    return balance;
}
