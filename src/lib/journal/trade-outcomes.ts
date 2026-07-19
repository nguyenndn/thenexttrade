import { TradeResult } from "@prisma/client";

/**
 * Trade with optional fields needed for classification
 */
export interface ClassifiableTrade {
    result?: TradeResult | null;
    pnl?: number | null;
    exitReason?: string | null;
}

export type TradeOutcome = "WIN" | "LOSS" | "BREAK_EVEN" | "UNKNOWN";

const BREAK_EVEN_EPSILON = 0.5; // Allow $0.50 leeway for break-even PnL when result is missing

/**
 * Robustly classifies a trade outcome as WIN, LOSS, BREAK_EVEN, or UNKNOWN.
 *
 * Priority:
 * 1. Uses explicit `result` field (LOSS -> LOSS, WIN -> WIN, BREAK_EVEN/BE_PLUS -> BREAK_EVEN).
 * 2. Fallbacks to evaluating `pnl` if `result` is null or missing.
 *    - pnl < -EPSILON => LOSS
 *    - abs(pnl) <= EPSILON => BREAK_EVEN
 *    - pnl > EPSILON => WIN
 */
export function classifyTradeOutcome(trade: ClassifiableTrade): TradeOutcome {
    if (trade.result) {
        if (trade.result === "LOSS") return "LOSS";
        if (trade.result === "WIN") return "WIN";
        if (trade.result === "BREAK_EVEN" || trade.result === "BE_PLUS")
            return "BREAK_EVEN";
    }

    // Fallback to PnL analysis
    if (typeof trade.pnl === "number") {
        if (trade.pnl < -BREAK_EVEN_EPSILON) {
            return "LOSS";
        }
        if (Math.abs(trade.pnl) <= BREAK_EVEN_EPSILON) {
            return "BREAK_EVEN";
        }
        if (trade.pnl > BREAK_EVEN_EPSILON) {
            return "WIN";
        }
    }

    return "UNKNOWN";
}

/**
 * Confirms if a trade was exited strictly due to hitting a Stop Loss.
 *
 * Rules:
 * - Requires explicit exit reason matching known SL reasons (STOP_LOSS, SL, STOP_OUT).
 * - Does NOT use result = LOSS or negative PnL as evidence of SL.
 * - Having a stopLoss set is not enough, it must be the actual exit reason.
 */
export function isConfirmedStopLossExit(trade: ClassifiableTrade): boolean {
    if (!trade.exitReason) return false;

    const normalizedReason = trade.exitReason.trim().toUpperCase();

    const slReasons = [
        "STOP_LOSS",
        "SL",
        "STOP_OUT",
        "SL_HIT",
        "STOP LOSS HIT",
        "STOP LOSS",
    ];

    return slReasons.includes(normalizedReason);
}
