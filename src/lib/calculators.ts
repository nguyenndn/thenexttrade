// PIP VALUES (Approximate for simple calculators when current price is not dynamic)
// Value in USD for 1 Pip Movement on 1 Micro Lot (1,000 units of forex, 1oz gold)
// For Forex: 1 pip = 0.0001 (or 0.01 for JPY).
// Standard Lot (100,000) Pip Value = Micro Lot Pip Value * 100.
// Gold (XAUUSD): 1 pip (0.01) on 1 oz = $0.01. Per Standard Lot (100 oz) = $1.00.
// Silver (XAGUSD): 1 pip (0.01) on 50 oz = $0.50. Per Standard Lot (5,000 oz) = $50.00.

export const PIP_VALUES: Record<string, number> = {
    // Forex (Standard 100k units - Value in USD per Micro lot of 1,000 units)
    EURUSD: 0.1,
    GBPUSD: 0.1,
    AUDUSD: 0.1,
    NZDUSD: 0.1,
    USDJPY: 0.0645,
    USDCHF: 0.113,
    USDCAD: 0.0735,
    EURJPY: 0.0645,
    GBPJPY: 0.0645,
    EURGBP: 0.128,
    AUDCAD: 0.0735,

    // Metals (Gold 100oz, Silver 5000oz)
    XAUUSD: 0.01,
    XAGUSD: 0.5,

    // Indices (1 lot = 1 Contract. Point based)
    US30: 0.1,
    US100: 0.1,
    US500: 0.1,
};

/**
 * Baseline USD value of 1 unit of each supported account/quote currency.
 * Example: 1 EUR = 1.085 USD, 1 JPY = 1 / 155 USD.
 */
export const ACCOUNT_CURRENCY_USD_RATES: Record<string, number> = {
    USD: 1,
    EUR: 1.085,
    GBP: 1.28,
    JPY: 1 / 155.0,
    AUD: 0.655,
    CAD: 1 / 1.36,
    CHF: 1 / 0.885,
    NZD: 0.605,
};

export const DEFAULT_PAIR_PRICES: Record<
    string,
    { price: number; exitLong: number; step: string }
> = {
    EURUSD: { price: 1.085, exitLong: 1.09, step: "0.0001" },
    GBPUSD: { price: 1.28, exitLong: 1.285, step: "0.0001" },
    AUDUSD: { price: 0.655, exitLong: 0.66, step: "0.0001" },
    NZDUSD: { price: 0.605, exitLong: 0.61, step: "0.0001" },
    USDJPY: { price: 155.0, exitLong: 155.5, step: "0.01" },
    USDCHF: { price: 0.885, exitLong: 0.89, step: "0.0001" },
    USDCAD: { price: 1.36, exitLong: 1.365, step: "0.0001" },
    EURJPY: { price: 168.18, exitLong: 168.68, step: "0.01" },
    GBPJPY: { price: 198.4, exitLong: 198.9, step: "0.01" },
    EURGBP: { price: 0.8477, exitLong: 0.8527, step: "0.0001" },
    AUDCAD: { price: 0.8908, exitLong: 0.8958, step: "0.0001" },
    XAUUSD: { price: 2900.0, exitLong: 2910.0, step: "0.01" },
    XAGUSD: { price: 32.5, exitLong: 33.0, step: "0.01" },
    US30: { price: 43500, exitLong: 43600, step: "1" },
    US100: { price: 21000, exitLong: 21100, step: "1" },
    US500: { price: 5950, exitLong: 5975, step: "1" },
};

export function convertUsdToAccountCurrency(
    usdAmount: number,
    accountCurrency = "USD"
): number {
    if (!Number.isFinite(usdAmount)) return 0;
    const code = (accountCurrency || "USD").trim().toUpperCase();
    const usdPerUnit = ACCOUNT_CURRENCY_USD_RATES[code] ?? 1;
    return usdPerUnit > 0 ? usdAmount / usdPerUnit : usdAmount;
}

export function getPairBaseAndQuote(pair: string): {
    base: string;
    quote: string;
    isIndex: boolean;
} {
    const clean = pair.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (
        clean === "US30" ||
        clean === "US100" ||
        clean === "US500" ||
        clean.includes("DJI") ||
        clean.includes("NAS") ||
        clean.includes("SPX")
    ) {
        return { base: clean, quote: "USD", isIndex: true };
    }
    if (clean.length >= 6) {
        return {
            base: clean.slice(0, 3),
            quote: clean.slice(3, 6),
            isIndex: false,
        };
    }
    return { base: clean, quote: "USD", isIndex: false };
}

export function getPairConfig(pair: string) {
    const p = pair.toUpperCase();

    // Default Forex
    let multiplier = 10000;
    let contractSize = 100000;

    if (p.includes("JPY")) {
        multiplier = 100;
    } else if (p.includes("XAU") || p.includes("GOLD")) {
        multiplier = 100; // 0.01 pip
        contractSize = 100; // 100 oz
    } else if (p.includes("XAG") || p.includes("SILVER")) {
        multiplier = 100; // 0.01 pip
        contractSize = 5000;
    } else if (p.includes("BTC")) {
        multiplier = 100; // 0.01
        contractSize = 1;
    } else if (
        p.includes("US30") ||
        p.includes("DJI") ||
        p.includes("US100") ||
        p.includes("NAS") ||
        p.includes("US500") ||
        p.includes("SPX")
    ) {
        multiplier = 100;
        contractSize = 1;
    }

    return { multiplier, contractSize };
}

// --- 0. Pip Value ---
export interface PipValueInput {
    pair: string;
    lotSize: number;
    accountCurrency?: string;
}

export function calculatePipValue(
    inputOrPair: PipValueInput | string,
    lotSizeParam?: number,
    accountCurrencyParam?: string
) {
    let pair = "EURUSD";
    let lotSize = 1;
    let accountCurrency = "USD";

    if (typeof inputOrPair === "string") {
        pair = inputOrPair;
        lotSize = lotSizeParam ?? 1;
        accountCurrency = accountCurrencyParam || "USD";
    } else if (typeof inputOrPair === "object" && inputOrPair !== null) {
        pair = inputOrPair.pair || "EURUSD";
        lotSize = inputOrPair.lotSize ?? 1;
        accountCurrency = inputOrPair.accountCurrency || "USD";
    }

    const pipValuePerMicroUsd = PIP_VALUES[pair.toUpperCase()] || 0.1;
    const pipValuePerStandardUsd = pipValuePerMicroUsd * 100;
    const safeLotSize = Math.max(
        0,
        isNaN(lotSize) ? 0 : Number(lotSize.toFixed(4))
    );
    const totalValueUsd = pipValuePerStandardUsd * safeLotSize;
    const convertedValue = convertUsdToAccountCurrency(
        totalValueUsd,
        accountCurrency
    );

    return Number(convertedValue.toFixed(4));
}

// --- 1. Position Size ---
export interface PositionSizeInput {
    accountBalance: number;
    riskPercent: number;
    stopLossPips: number;
    pair: string;
    accountCurrency: string;
}

export function calculatePositionSize(input: PositionSizeInput) {
    const {
        accountBalance,
        riskPercent,
        stopLossPips,
        pair,
        accountCurrency = "USD",
    } = input;
    const { contractSize } = getPairConfig(pair);
    const pipValueMicroUsd = PIP_VALUES[pair.toUpperCase()] || 0.1;
    const pipValueStandardUsd = pipValueMicroUsd * 100;
    const pipValueStandard = convertUsdToAccountCurrency(
        pipValueStandardUsd,
        accountCurrency
    );

    if (
        accountBalance <= 0 ||
        riskPercent <= 0 ||
        stopLossPips <= 0 ||
        pipValueStandard <= 0
    ) {
        return {
            lotSize: 0,
            miniLots: 0,
            microLots: 0,
            units: 0,
            riskAmount: 0,
            pipValue: Number(pipValueStandard.toFixed(4)),
        };
    }

    const riskAmount = accountBalance * (riskPercent / 100);
    const lots = riskAmount / (stopLossPips * pipValueStandard);

    return {
        lotSize: Math.floor(lots * 100) / 100,
        miniLots: Math.floor(lots * 10 * 10) / 10,
        microLots: Math.floor(lots * 100),
        units: Math.floor(lots * contractSize),
        riskAmount: Number(riskAmount.toFixed(2)),
        pipValue: Number(pipValueStandard.toFixed(4)),
    };
}

// --- 2. Risk Reward ---
export interface RiskRewardInput {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    direction: "LONG" | "SHORT";
    pair: string;
}

export function calculateRiskReward(input: RiskRewardInput) {
    const { entryPrice, stopLoss, takeProfit, direction, pair } = input;
    const { multiplier } = getPairConfig(pair || "EURUSD");

    const rawRiskPips =
        direction === "LONG"
            ? (entryPrice - stopLoss) * multiplier
            : (stopLoss - entryPrice) * multiplier;

    const rawRewardPips =
        direction === "LONG"
            ? (takeProfit - entryPrice) * multiplier
            : (entryPrice - takeProfit) * multiplier;

    const isValid =
        entryPrice > 0 &&
        stopLoss > 0 &&
        takeProfit > 0 &&
        rawRiskPips > 0 &&
        rawRewardPips > 0;

    if (!isValid) {
        return {
            isValid: false,
            riskPips: Math.max(0, Math.round(rawRiskPips * 10) / 10),
            rewardPips: Math.max(0, Math.round(rawRewardPips * 10) / 10),
            rrRatio: 0,
            rrString: "—",
            winRateToBreakeven: 0,
        };
    }

    const rrRatio = rawRewardPips / rawRiskPips;
    const winRateToBreakeven = (1 / (1 + rrRatio)) * 100;

    return {
        isValid: true,
        riskPips: Math.round(rawRiskPips * 10) / 10,
        rewardPips: Math.round(rawRewardPips * 10) / 10,
        rrRatio: Math.round(rrRatio * 100) / 100,
        rrString: `1:${rrRatio.toFixed(2)}`,
        winRateToBreakeven: Math.round(winRateToBreakeven * 10) / 10,
    };
}

// --- 3. Margin ---
export interface MarginInput {
    lotSize: number;
    pair: string;
    leverage: number;
    currentPrice: number;
    accountCurrency?: string;
}

export function calculateMargin(input: MarginInput) {
    const { leverage, pair, accountCurrency = "USD" } = input;
    const lotSize = Math.max(
        0,
        isNaN(input.lotSize) ? 0 : Number(Number(input.lotSize).toFixed(4))
    );
    const currentPrice = Math.max(
        0,
        isNaN(input.currentPrice)
            ? 0
            : Number(Number(input.currentPrice).toFixed(5))
    );
    const { contractSize } = getPairConfig(pair);
    const { base, quote, isIndex } = getPairBaseAndQuote(pair);

    let positionValueUsd = 0;

    if (isIndex || quote === "USD") {
        // USD is the quote currency (EURUSD, GBPUSD, XAUUSD, US30, BTCUSD)
        positionValueUsd = lotSize * contractSize * currentPrice;
    } else if (base === "USD") {
        // USD is the base currency (USDJPY, USDCAD, USDCHF): 1 standard lot = $100,000 USD notional
        positionValueUsd = lotSize * contractSize;
    } else {
        // Cross pairs (EURJPY, GBPJPY, EURGBP, AUDCAD): convert quote notional to USD via quote currency rate
        const notionalInQuote = lotSize * contractSize * currentPrice;
        const quoteUsdRate = ACCOUNT_CURRENCY_USD_RATES[quote] ?? 1;
        positionValueUsd = notionalInQuote * quoteUsdRate;
    }

    const positionValue = convertUsdToAccountCurrency(
        positionValueUsd,
        accountCurrency
    );
    const requiredMargin = leverage > 0 ? positionValue / leverage : 0;

    return {
        requiredMargin: Number(requiredMargin.toFixed(4)),
        positionValue: Number(positionValue.toFixed(4)),
    };
}

// --- 4. Profit Loss ---
export interface ProfitLossInput {
    entryPrice: number;
    exitPrice: number;
    lotSize: number;
    direction: "LONG" | "SHORT";
    pair: string;
    accountCurrency?: string;
}

export function calculateProfitLoss(input: ProfitLossInput) {
    const {
        entryPrice,
        exitPrice,
        lotSize,
        direction,
        pair,
        accountCurrency = "USD",
    } = input;
    const { multiplier, contractSize } = getPairConfig(pair);
    const { base, quote, isIndex } = getPairBaseAndQuote(pair);

    const directionMultiplier = direction === "LONG" ? 1 : -1;

    // Profit/Loss in Quote Currency (YYY)
    const profitLossInQuote =
        directionMultiplier * (exitPrice - entryPrice) * lotSize * contractSize;

    let profitLossUsd = 0;

    if (isIndex || quote === "USD") {
        profitLossUsd = profitLossInQuote;
    } else if (base === "USD") {
        profitLossUsd = exitPrice > 0 ? profitLossInQuote / exitPrice : 0;
    } else {
        const quoteUsdRate = ACCOUNT_CURRENCY_USD_RATES[quote] ?? 1;
        profitLossUsd = profitLossInQuote * quoteUsdRate;
    }

    const profitLoss = convertUsdToAccountCurrency(
        profitLossUsd,
        accountCurrency
    );
    const pips = directionMultiplier * (exitPrice - entryPrice) * multiplier;

    return {
        pips: Math.round(pips * 10) / 10,
        profitLoss: Math.round(profitLoss * 100) / 100,
    };
}
