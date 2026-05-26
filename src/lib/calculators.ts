// PIP VALUES (Approximate for simple calculators when current price is not dynamic)
// Value in USD for 1 Pip Movement on 1 Micro Lot (1,000 units of forex, 1oz gold)
// For Forex: 1 pip = 0.0001 (or 0.01 for JPY).
// Standard Lot (100,000) Pip Value = Micro Lot Pip Value * 100.
// Gold (XAUUSD): 1 pip (0.01) on 1 oz = $0.01. Per Standard Lot (100 oz) = $1.00.
// Silver (XAGUSD): 1 pip (0.01) on 50 oz = $0.50. Per Standard Lot (5,000 oz) = $50.00.

export const PIP_VALUES: Record<string, number> = {
    // Forex (Standard 100k units - Value per Micro lot of 1,000 units)
    // Refined based on 2026 average baseline prices (USDJPY ~155, EURUSD ~1.08, USDCAD ~1.36, etc.)
    "EURUSD": 0.10, "GBPUSD": 0.10, "AUDUSD": 0.10, "NZDUSD": 0.10,
    "USDJPY": 0.065, "USDCHF": 0.11, "USDCAD": 0.073,
    "EURJPY": 0.065, "GBPJPY": 0.065, "EURGBP": 0.126, "AUDCAD": 0.073,

    // Metals (Gold 100oz, Silver 5000oz)
    "XAUUSD": 0.01,
    "XAGUSD": 0.50,

    // Indices (1 lot = 1 Contract. Point based)
    "US30": 0.10, "US100": 0.10, "US500": 0.10,
};

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
    } else if (p.includes("US30") || p.includes("DJI") || p.includes("US100") || p.includes("NAS") || p.includes("US500") || p.includes("SPX")) {
        multiplier = 100;
        contractSize = 1;
    }

    return { multiplier, contractSize };
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
    const { accountBalance, riskPercent, stopLossPips, pair } = input;
    const { contractSize } = getPairConfig(pair);
    const pipValueMicro = PIP_VALUES[pair.toUpperCase()] || 0.10; // Value per Micro (1000 units forex)

    const riskAmount = accountBalance * (riskPercent / 100);
    const pipValueStandard = pipValueMicro * 100;

    if (pipValueStandard === 0 || stopLossPips === 0) return {
        lotSize: 0, miniLots: 0, microLots: 0, units: 0, riskAmount: 0, pipValue: 0
    };

    const lots = riskAmount / (stopLossPips * pipValueStandard);

    return {
        lotSize: Math.floor(lots * 100) / 100,
        miniLots: Math.floor(lots * 10 * 10) / 10,
        microLots: Math.floor(lots * 100),
        units: Math.floor(lots * contractSize),
        riskAmount,
        pipValue: pipValueStandard, // Return per Standard Lot for clarity
    };
}

// --- 2. Risk Reward ---
export interface RiskRewardInput {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    direction: "LONG" | "SHORT";
    pair: string; // Added pair for accurate multiplier
}

export function calculateRiskReward(input: RiskRewardInput) {
    const { entryPrice, stopLoss, takeProfit, direction, pair } = input;
    const { multiplier } = getPairConfig(pair || "EURUSD");

    const riskPips = direction === "LONG"
        ? (entryPrice - stopLoss) * multiplier
        : (stopLoss - entryPrice) * multiplier;

    const rewardPips = direction === "LONG"
        ? (takeProfit - entryPrice) * multiplier
        : (entryPrice - takeProfit) * multiplier;

    const rrRatio = riskPips <= 0 ? 0 : rewardPips / riskPips;
    const winRateToBreakeven = rrRatio > 0 ? (1 / (1 + rrRatio)) * 100 : 0;

    return {
        riskPips: Math.abs(Math.round(riskPips * 10) / 10),
        rewardPips: Math.abs(Math.round(rewardPips * 10) / 10),
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
}

export function calculateMargin(input: MarginInput) {
    const { lotSize, leverage, currentPrice, pair } = input;
    const { contractSize } = getPairConfig(pair);
    const p = pair.toUpperCase();

    let requiredMargin = 0;
    let positionValue = 0;

    if (p.startsWith("USD")) {
        // USD is the base currency (e.g., USDJPY, USDCAD, USDCHF)
        // Position value is in USD. So 1 lot = $100,000.
        positionValue = lotSize * contractSize;
        requiredMargin = positionValue / leverage;
    } else if (p.endsWith("USD") || p === "US30" || p === "US100" || p === "US500") {
        // USD is the quote currency (e.g., EURUSD, GBPUSD, XAUUSD)
        // Position value in USD = Lot Size * Contract Size * currentPrice
        positionValue = lotSize * contractSize * currentPrice;
        requiredMargin = positionValue / leverage;
    } else {
        // For cross pairs (e.g., EURJPY, GBPJPY, EURGBP)
        // Position Value in Base Currency = Lot Size * Contract Size.
        // We approximate the USD exchange rate of the base currency to determine USD value.
        const positionValueInBase = lotSize * contractSize;
        
        if (p.includes("JPY")) {
            // Convert JPY quote to USD by dividing by USDJPY rate (~155.0)
            positionValue = positionValueInBase * (currentPrice / 155.0);
        } else if (p.includes("GBP")) {
            // Convert GBP quote to USD by multiplying by GBPUSD rate (~1.26)
            positionValue = positionValueInBase * (currentPrice * 1.26);
        } else if (p.includes("CAD")) {
            // Convert CAD quote to USD by dividing by USDCAD rate (~1.36)
            positionValue = positionValueInBase * (currentPrice / 1.36);
        } else {
            // General Fallback
            positionValue = positionValueInBase * (currentPrice / 1.5);
        }
        
        requiredMargin = positionValue / leverage;
    }

    return {
        requiredMargin,
        positionValue
    };
}

// --- 4. Profit Loss ---
export interface ProfitLossInput {
    entryPrice: number;
    exitPrice: number;
    lotSize: number;
    direction: "LONG" | "SHORT";
    pair: string;
}

export function calculateProfitLoss(input: ProfitLossInput) {
    const { entryPrice, exitPrice, lotSize, direction, pair } = input;
    const { multiplier, contractSize } = getPairConfig(pair);
    const p = pair.toUpperCase();

    const directionMultiplier = direction === "LONG" ? 1 : -1;
    
    // Profit/Loss in Quote Currency (YYY)
    const profitLossInQuote = directionMultiplier * (exitPrice - entryPrice) * lotSize * contractSize;
    
    let profitLoss = 0;
    
    if (p.endsWith("USD") || p === "US30" || p === "US100" || p === "US500") {
        // YYY is USD, no conversion needed
        profitLoss = profitLossInQuote;
    } else if (p.startsWith("USD")) {
        // XXX is USD, we convert by dividing the quote profit by the exitPrice (the exchange rate of XXX/YYY)
        profitLoss = profitLossInQuote / exitPrice;
    } else {
        // Crosses
        if (p.includes("JPY")) {
            // Convert JPY quote profit to USD by dividing by USDJPY rate (~155.0)
            profitLoss = profitLossInQuote / 155.0;
        } else if (p.includes("GBP")) {
            // Convert GBP quote profit to USD by multiplying by GBPUSD rate (~1.26)
            profitLoss = profitLossInQuote * 1.26;
        } else if (p.includes("CAD")) {
            // Convert CAD quote profit to USD by dividing by USDCAD rate (~1.36)
            profitLoss = profitLossInQuote / 1.36;
        } else {
            // General Fallback
            profitLoss = profitLossInQuote / 1.5;
        }
    }

    const pips = directionMultiplier * (exitPrice - entryPrice) * multiplier;

    return {
        pips: Math.round(pips * 10) / 10,
        profitLoss: Math.round(profitLoss * 100) / 100
    };
}
