// PIP VALUES (Approximate for simple calc)
// Value in USD for 1 Pip Movement on 1 Standard Lot (100k units forex, 100oz gold)
// For Forex: 1 pip = 0.0001 (or 0.01 JPY). Standard Lot = 100,000.
// EURUSD: 0.0001 * 100,000 = $10.00
// USDJPY: 0.01 * 100,000 / 150 = $6.66 (Approx $10 for ease if USD based, but JPY is inverse)
// Let's store "Standard Lot Pip Value" directly to be safer/simpler?
// Or stick to "Per Micro" as existing code tried?
// Existing code used "Per Micro (1000)".
// EURUSD: 0.10 (Micro) * 100 = 10 (Standard). Correct.
// XAUUSD: Gold 1 pip (0.01) * 100 oz = $1.00.
// So XAUUSD value per micro(??) -> Let's just fix the values to be "Per Lot" or normalize.
// Let's stick to "Per Micro Lot" conceptual value used before, but fix XAU to 0.10 ?
// If XAU 1 pip(0.01) * 100oz = $1 per Lot.
// Then "Per Micro (1/100 lot?)" = $0.01.
// So XAUUSD should be 0.01? 
// Wait, Gold Standard Lot is 100. Micro Lot is 1. (1 oz).
// 1 oz * 0.01 = $0.01. 
// So XAUUSD "PipValuePerMicro" = 0.01. 
// If I set 0.01. And multiplier 100 (for 2 digits).
// $1 move (4900-4901) = 100 pips.
// Profit = 100 * (0.01 * 100) * 1 = 100 * 1 * 1 = $100. Correct.
// But earlier user got $10 with 0.10. 
// User wants $1 for 0.01 Lot ($1 move). $100 for 1.0 Lot.
// So my target is correct.
// Implies XAUUSD 0.01 value.

export const PIP_VALUES: Record<string, number> = {
    // Forex (Standard 100k)
    "EURUSD": 0.10, "GBPUSD": 0.10, "AUDUSD": 0.10, "NZDUSD": 0.10,
    "USDJPY": 0.09, "USDCHF": 0.11, "USDCAD": 0.08,
    "EURJPY": 0.09, "GBPJPY": 0.09, "EURGBP": 0.13, "AUDCAD": 0.08,

    // Metals (Gold 100oz, Silver 5000oz)
    "XAUUSD": 0.01, // 1 pip (0.01) on 1 oz (micro) = $0.01 
    "XAGUSD": 0.50, // 1 pip (0.01) on 50 oz (micro) = $0.50? (Std 5000oz -> Micro 50oz). 
    // Silver 1 pip(0.01) * 50 = $0.50. Standard(5000) * 0.01 = $50. Checked: Silver tick usually $50/lot. Correct.

    // Indices (Usually 1 lot = 1 Contract. Point based)
    "US30": 0.10, "US100": 0.10, "US500": 0.10,
};

function getPairConfig(pair: string) {
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
    } else if (p.includes("US30") || p.includes("DJI") || p.includes("US100") || p.includes("NAS")) {
        multiplier = 100; // Assuming 2 decimal pricing often, or 1? Safe with 100 for 0.01?
        // Often indices are 1.00 move = 1 point.
        // If 30000 -> 30001.
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

    // Logic:
    // Risk = Lots * ContractSize * Pips * PipValuePerUnit? No.
    // Standard: Risk = Lots * Pips * PipValueStandard.
    // PipValueStandard = PipValueMicro * 100 (for Forex).
    // For Gold: PipValueStandard (100oz) = PipValueMicro(1oz) * 100. matches.

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

    const positionValue = lotSize * contractSize * currentPrice;
    return {
        requiredMargin: positionValue / leverage
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
    const { multiplier } = getPairConfig(pair);

    let pips = direction === "LONG"
        ? (exitPrice - entryPrice) * multiplier
        : (entryPrice - exitPrice) * multiplier;

    // Pip Value per Standard Lot
    // Default 0.10 micro * 100 = 10.
    const pipValueMicro = PIP_VALUES[pair.toUpperCase()] || 0.10;
    const pipValueStandard = pipValueMicro * 100;

    const profitLoss = pips * pipValueStandard * lotSize;

    return {
        pips: Math.round(pips * 10) / 10,
        profitLoss: Math.round(profitLoss * 100) / 100
    };
}
