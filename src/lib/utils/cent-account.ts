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
    "USCENT",
    "USDCENT",
    "CENT",
    "EU_CENT",
    "GB_CENT",
    "US_CENT",
    "USDT_CENT",
    "EUC",
    "EURC",
    "EURCENT",
    "GBC",
    "GBPC",
    "GBPCENT",
]);

export interface CurrencyDisplayInfo {
    code: string;
    symbol: string;
    label: string;
    isCent: boolean;
    usdRate: number;
}

const CURRENCY_METADATA: Record<string, CurrencyDisplayInfo> = {
    USD: { code: "USD", symbol: "$", label: "USD ($)", isCent: false, usdRate: 1.0 },
    USC: { code: "USC", symbol: "USC", label: "USC (Cent)", isCent: true, usdRate: 0.01 },
    EUR: { code: "EUR", symbol: "€", label: "EUR (€)", isCent: false, usdRate: 1.08 },
    EUC: { code: "EUC", symbol: "EUC", label: "EUC (EUR Cent)", isCent: true, usdRate: 0.0108 },
    GBP: { code: "GBP", symbol: "£", label: "GBP (£)", isCent: false, usdRate: 1.28 },
    GBC: { code: "GBC", symbol: "GBC", label: "GBC (GBP Cent)", isCent: true, usdRate: 0.0128 },
    JPY: { code: "JPY", symbol: "¥", label: "JPY (¥)", isCent: false, usdRate: 0.0067 },
    AUD: { code: "AUD", symbol: "A$", label: "AUD (A$)", isCent: false, usdRate: 0.65 },
    CAD: { code: "CAD", symbol: "C$", label: "CAD (C$)", isCent: false, usdRate: 0.73 },
    CHF: { code: "CHF", symbol: "CHF", label: "CHF", isCent: false, usdRate: 1.13 },
    NZD: { code: "NZD", symbol: "NZ$", label: "NZD (NZ$)", isCent: false, usdRate: 0.60 },
    SGD: { code: "SGD", symbol: "S$", label: "SGD (S$)", isCent: false, usdRate: 0.76 },
};

/**
 * Normalizes raw broker currency strings (e.g. "USC", "USCent", "USDc", "EUR", "EUC", "GBP", "GBC")
 * and detects Cent currency when server name or traded symbols indicate a Cent account.
 */
export function normalizeCurrencyCode(
    rawCurrency?: string | null,
    server?: string | null,
    sampleSymbols?: Array<string | null | undefined>
): string {
    const cleaned = (rawCurrency || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

    let baseCode = "USD";
    if (
        cleaned === "USC" ||
        cleaned === "USCENT" ||
        cleaned === "USDCENT" ||
        cleaned === "US_CENT" ||
        cleaned === "USDC" && server?.toLowerCase().includes("cent") ||
        cleaned === "CENT" ||
        cleaned === "USDT_CENT"
    ) {
        return "USC";
    }
    if (
        cleaned === "EUC" ||
        cleaned === "EURC" ||
        cleaned === "EURCENT" ||
        cleaned === "EU_CENT" ||
        cleaned === "EUR_CENT"
    ) {
        return "EUC";
    }
    if (
        cleaned === "GBC" ||
        cleaned === "GBPC" ||
        cleaned === "GBPCENT" ||
        cleaned === "GB_CENT" ||
        cleaned === "GBP_CENT"
    ) {
        return "GBC";
    }

    if (cleaned.length >= 3) {
        baseCode = cleaned.slice(0, 3);
    }

    // Check if server or traded symbols indicate a Cent account while currency was reported as standard USD/EUR/GBP
    const serverIndicatesCent = Boolean(server && server.toLowerCase().includes("cent"));
    const validSymbols = (sampleSymbols || []).filter((s): s is string => Boolean(s && s.trim()));
    const symbolsIndicateCent =
        validSymbols.length > 0 && validSymbols.every((s) => isCentSymbol(s));

    if (serverIndicatesCent || symbolsIndicateCent) {
        if (baseCode === "EUR") return "EUC";
        if (baseCode === "GBP") return "GBC";
        if (baseCode === "USD" || !rawCurrency) return "USC";
    }

    return baseCode || "USD";
}

/**
 * Returns structured display metadata for an account currency.
 */
export function getCurrencyInfo(
    currency?: string | null,
    server?: string | null
): CurrencyDisplayInfo {
    const code = normalizeCurrencyCode(currency, server);
    if (CURRENCY_METADATA[code]) {
        return CURRENCY_METADATA[code];
    }
    const isCent = isCentAccount({ currency: code, server });
    return {
        code,
        symbol: code,
        label: isCent ? `${code} (Cent)` : code,
        isCent,
        usdRate: isCent ? 0.01 : 1.0,
    };
}

/**
 * Formats an account balance/equity with its native currency symbol or suffix (e.g. "$1,000.00", "€1,000.00", "£1,000.00", "10,000.00 USC").
 */
export function formatAccountBalance(
    amount: number | null | undefined,
    currency?: string | null,
    server?: string | null,
    fractionDigits = 2
): string {
    const num = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
    const info = getCurrencyInfo(currency, server);
    const digits = info.code === "JPY" ? 0 : fractionDigits;
    const formatted = num.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });

    if (info.isCent || info.symbol === info.code) {
        return `${formatted} ${info.code}`;
    }
    return `${info.symbol}${formatted}`;
}

/**
 * Returns prefix and suffix props for <NumberTicker> based on account currency.
 * Standard symbol currencies ($ / £ / €) use prefix; Cent / code currencies (USC / EUC / GBC / CHF) use suffix.
 */
export function getCurrencyTickerProps(
    currency?: string | null,
    signPrefix: "+" | "-" | "" = ""
): { prefix: string; suffix: string; symbol: string; code: string; isCent: boolean } {
    const info = getCurrencyInfo(currency);
    if (info.isCent || info.symbol === info.code) {
        return {
            prefix: signPrefix,
            suffix: ` ${info.code}`,
            symbol: info.symbol,
            code: info.code,
            isCent: info.isCent,
        };
    }
    return {
        prefix: `${signPrefix}${info.symbol}`,
        suffix: "",
        symbol: info.symbol,
        code: info.code,
        isCent: info.isCent,
    };
}

/**
 * Formats a P&L, chart axis tick, or trade amount with the account's native currency symbol or suffix.
 * Examples:
 * - USD: "+$6,201.16", "-$250.00", "$7,500"
 * - GBP: "+£6,201.16", "-£250.00", "£7,500"
 * - EUR: "+€6,201.16", "-€250.00", "€7,500"
 * - USC: "+6,201.16 USC", "-250.00 USC", "7,500 USC"
 */
export function formatDashboardCurrency(
    amount: number | null | undefined,
    currency?: string | null,
    options?: {
        signDisplay?: "auto" | "always" | "never";
        fractionDigits?: number;
        useGrouping?: boolean;
    }
): string {
    const num = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
    const info = getCurrencyInfo(currency);
    const signDisplay = options?.signDisplay ?? "auto";
    const digits = options?.fractionDigits ?? (info.code === "JPY" ? 0 : 2);
    const useGrouping = options?.useGrouping ?? true;

    let sign = "";
    if (signDisplay === "always") {
        sign = num >= 0 ? "+" : "-";
    } else if (signDisplay === "auto") {
        sign = num < 0 ? "-" : "";
    }

    const absFormatted = Math.abs(num).toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping,
    });

    if (info.isCent || info.symbol === info.code) {
        return `${sign}${absFormatted} ${info.code}`;
    }
    return `${sign}${info.symbol}${absFormatted}`;
}

/**
 * Converts an amount in any supported account currency (USC, EUR, GBP, etc.) to approximate USD equivalent.
 */
export function convertToUsdEquivalent(
    amount: number | null | undefined,
    currency?: string | null,
    server?: string | null
): number {
    const num = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
    const info = getCurrencyInfo(currency, server);
    return Number((num * info.usdRate).toFixed(2));
}

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
