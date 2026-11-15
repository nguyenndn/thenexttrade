export const INITIAL_PRICE_ROWS = [
    {
        label: "SL:",
        value: "3911.00",
        bar: "bg-[#ff4d6d]",
        text: "text-[#ff4d6d]",
        box: "border-[#3a2029] bg-[#221219]",
    },
    {
        label: "ENTRY:",
        value: "4020.99",
        bar: "bg-[#00e699]",
        text: "text-[#00e699]",
        box: "border-[#1e3a34] bg-[#10231f]",
    },
    {
        label: "TP1:",
        value: "3894.00",
        bar: "bg-[#00d4ff]",
        text: "text-[#00d4ff]",
        box: "border-[#223247] bg-[#121c29]",
    },
    {
        label: "TP2:",
        value: "3889.00",
        bar: "bg-[#4da3ff]",
        text: "text-[#4da3ff]",
        box: "border-[#24324d] bg-[#131b2b]",
    },
    {
        label: "TP3:",
        value: "3879.00",
        bar: "bg-[#7c8cff]",
        text: "text-[#7c8cff]",
        box: "border-[#2b2847] bg-[#161529]",
    },
] as const;

export const EXEC_BUTTONS = [
    { label: "GET BUY", cls: "border border-[#343d4b] bg-[#232933] hover:bg-[#2c3440] text-white", span: "" },
    { label: "GET SELL", cls: "border border-[#343d4b] bg-[#232933] hover:bg-[#2c3440] text-white", span: "" },
    { label: "BUY NOW ↑", cls: "bg-[#148eff] hover:bg-[#0f7ae5] text-white", span: "col-span-2 py-1.5 text-[10.5px]" },
    { label: "SELL NOW ↓", cls: "bg-[#eb3b5a] hover:bg-[#d6304c] text-white", span: "col-span-2 py-1.5 text-[10.5px]" },
    { label: "SET PENDING", cls: "bg-[#05821a] hover:bg-[#046c15] text-white", span: "" },
    { label: "CLOSE PENDING", cls: "bg-[#05821a] hover:bg-[#046c15] text-white", span: "" },
    { label: "SYNC LEVELS", cls: "bg-[#f58a07] hover:bg-[#d97804] text-white", span: "" },
    { label: "CLEAR INPUTS", cls: "bg-[#f58a07] hover:bg-[#d97804] text-white", span: "" },
] as const;

export const HISTOGRAM_BARS = [
    4, 6, 12, 22, 42, 62, 76, 88, 92, 85, 86, 80, 70, 68, 74, 72, 62, 68, 86,
    98, 94, 86, 84, 78, 56, 36, 26, 20, 18, 28, 56, 72, 76, 72, 62, 54, 42, 24,
    22, 8, 4, 4,
] as const;

export interface DcaParamConfig {
    key: string;
    label: string;
    step: number;
    decimals: number;
    min: number;
}

export const DCA_CONFIGS: readonly DcaParamConfig[] = [
    { key: "startLot", label: "Starting Lot", step: 0.01, decimals: 2, min: 0.01 },
    { key: "mult", label: "Multiplier", step: 0.05, decimals: 2, min: 1.0 },
    { key: "dcaStep", label: "DCA Step (Pips)", step: 5, decimals: 0, min: 5 },
    { key: "zoneRange", label: "Zone Range (Pips)", step: 10, decimals: 0, min: 10 },
    { key: "targetTp", label: "Target TP (0=Off)", step: 5, decimals: 0, min: 0 },
    { key: "targetSl", label: "Target SL (0=Off)", step: 10, decimals: 0, min: 0 },
    { key: "maxSingle", label: "Max Single Lot", step: 0.05, decimals: 2, min: 0.01 },
    { key: "maxBasket", label: "Max Basket Lot", step: 0.1, decimals: 2, min: 0.05 },
];
