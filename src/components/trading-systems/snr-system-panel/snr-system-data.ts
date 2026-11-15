export type SnrH1Trend = "BEARISH (SELL)" | "BULLISH (BUY)" | "RANGING (BOTH)";

export type SnrEngineKey = "msnr" | "ote" | "dynSnr";

export interface SnrEngineUnitState {
    enabled: boolean;
    pendBuy: number;
    pendSell: number;
    openBuy: number;
    openSell: number;
    moduleFloat: number;
}

export interface SnrEntryConfigState {
    baseLot: string;
    slDist: string;
    rrRatio: string;
    minSpace: string;
    maxPending: string;
}

export const INITIAL_BALANCE = 142480.93;
export const INITIAL_EQUITY_BASE = 146410.3;

export const INITIAL_ENGINE_UNIT: SnrEngineUnitState = {
    enabled: false,
    pendBuy: 0,
    pendSell: 0,
    openBuy: 0,
    openSell: 0,
    moduleFloat: 0,
};

export const INITIAL_ENTRY_CONFIG: SnrEntryConfigState = {
    baseLot: "0.02",
    slDist: "5.00",
    rrRatio: "2.00",
    minSpace: "3.50",
    maxPending: "12",
};

export const SNR_TREND_STATES: readonly SnrH1Trend[] = [
    "BEARISH (SELL)",
    "BULLISH (BUY)",
    "RANGING (BOTH)",
];

export function formatUsdAmount(value: number): string {
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatSignedDollar(value: number): string {
    if (!Number.isFinite(value) || Object.is(value, -0) || value === 0) {
        return "+$0.00";
    }
    return value > 0
        ? `+$${value.toFixed(2)}`
        : `-$${Math.abs(value).toFixed(2)}`;
}

export function computeTpTargetSummary(
    slDist: string,
    rrRatio: string
): { tpDollar: string; rrFormatted: string } {
    const sl = Number.parseFloat(slDist);
    const rr = Number.parseFloat(rrRatio);
    const validSl = Number.isFinite(sl) && sl >= 0 ? sl : 0;
    const validRr = Number.isFinite(rr) && rr >= 0 ? rr : 0;
    return {
        tpDollar: (validSl * validRr).toFixed(2),
        rrFormatted: validRr.toFixed(2),
    };
}
