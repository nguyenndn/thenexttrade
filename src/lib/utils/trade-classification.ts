import { TradeResult } from "@prisma/client";

/**
 * Trade Classification Logic
 *
 * Classifies a trade's result based on PnL and optional context (risk/balance).
 *
 * BE (Break-Even): Gross Profit == 0 (or very close to 0 due to spread/commission)
 * BE+ (Break-Even Plus): Gross Profit > 0 but less than a defined small threshold.
 * WIN: Gross Profit >= threshold.
 * LOSS: Gross Profit < 0 (below BE threshold).
 */

interface ClassificationParams {
    pnl: number;
    riskAmount?: number | null;
    plannedTakeProfit?: number | null;
    entryPrice?: number;
    exitPrice?: number | null;
    lotSize?: number;
    comment?: string;
}

export function classifyTradeResult({
    pnl,
    riskAmount,
    comment,
}: ClassificationParams): TradeResult {
    // If pnl is extremely close to 0 (e.g. between -0.01 and 0.01), it's a pure BE.
    if (pnl >= -0.01 && pnl <= 0.01) {
        return "BREAK_EVEN";
    }

    if (pnl < -0.01) {
        return "LOSS";
    }

    // PnL is > 0.01. We need to distinguish between WIN and BE+

    // MT5 specific logic: if trade was closed by SL and it's in profit, it's a trailing SL / BE+
    if (comment && comment.toLowerCase().includes("sl")) {
        return "BE_PLUS";
    }

    // If we have a riskAmount, BE+ could be defined as < 0.2R (less than 20% of risk amount)
    if (riskAmount && riskAmount > 0) {
        const rMultiple = pnl / riskAmount;
        if (rMultiple < 0.2) {
            return "BE_PLUS";
        }
    } else {
        // Fallback: If no risk amount is defined, what is a BE+?
        // A flat dollar amount threshold is dangerous because of different account sizes.
        // For now, if pnl is positive but very small (e.g., < $2 on unknown risk), we might guess BE+?
        // It's safer to just default to WIN if we can't be sure, OR use a small nominal value like $1.00.
        // Given users can manually override, we'll set a nominal $1.00 threshold for BE+ when risk is unknown.
        if (pnl < 1.0) {
            return "BE_PLUS";
        }
    }

    return "WIN";
}
