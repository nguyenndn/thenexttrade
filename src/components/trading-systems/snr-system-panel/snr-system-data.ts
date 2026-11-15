export type SnrTimeframe = "M15" | "H1" | "H4";
export type SnrStoryState = "RANGING" | "BULLISH" | "BEARISH";
export type MsnrExecMode = "SINGLE (1R -> BE)" | "SINGLE (FIXED TP)";
export type DcaModuleExecMode = "SINGLE" | "DCA";
export type DcaLotProgression = "ADD (+)" | "MULT (x)";

export interface MsnrModuleState {
    enabled: boolean;
    mode: MsnrExecMode;
    baseLot: string;
    slDist: string;
    rrRatio: string;
    minSpace: string;
    maxPending: string;
    pendBuy: number;
    pendSell: number;
    openBuy: number;
    openSell: number;
    moduleFloat: number;
}

export interface DcaModuleState {
    enabled: boolean;
    mode: DcaModuleExecMode;
    lotMode: DcaLotProgression;
    dcaStep: string;
    addLot: string;
    lotMult: string;
    maxDcaOrd: string;
    trail: string;
    pendBuy: number;
    pendSell: number;
    openBuy: number;
    openSell: number;
    moduleFloat: number;
}

export const INITIAL_EQUITY = 146410.3;

export const INITIAL_MSNR_STATE: MsnrModuleState = {
    enabled: true,
    mode: "SINGLE (1R -> BE)",
    baseLot: "0.02",
    slDist: "10.00",
    rrRatio: "2.00",
    minSpace: "10.00",
    maxPending: "6",
    pendBuy: 0,
    pendSell: 0,
    openBuy: 0,
    openSell: 0,
    moduleFloat: 0,
};

export const INITIAL_OTE_STATE: DcaModuleState = {
    enabled: true,
    mode: "SINGLE",
    lotMode: "ADD (+)",
    dcaStep: "3.00",
    addLot: "0.10",
    lotMult: "1.50",
    maxDcaOrd: "5",
    trail: "6,10,14,18,22",
    pendBuy: 0,
    pendSell: 0,
    openBuy: 0,
    openSell: 0,
    moduleFloat: 0,
};

export const INITIAL_DYNAMIC_SNR_STATE: DcaModuleState = {
    ...INITIAL_OTE_STATE,
    enabled: false,
};

export const SNR_TIMEFRAMES: readonly SnrTimeframe[] = ["M15", "H1", "H4"];
export const SNR_STORIES: readonly SnrStoryState[] = [
    "RANGING",
    "BULLISH",
    "BEARISH",
];

export function computeTargetTpDist(slDist: string, rrRatio: string): string {
    const sl = Number.parseFloat(slDist);
    const rr = Number.parseFloat(rrRatio);
    if (!Number.isFinite(sl) || !Number.isFinite(rr) || sl < 0 || rr < 0) {
        return "0.00";
    }
    return (sl * rr).toFixed(2);
}

export function formatSignedUsd(value: number): string {
    if (!Number.isFinite(value) || Object.is(value, -0) || value === 0) {
        return "+0.00";
    }
    return value > 0
        ? `+${value.toFixed(2)}`
        : `-${Math.abs(value).toFixed(2)}`;
}
