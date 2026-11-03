export const STRATEGY_FILTERS = [
    "MA (EMA/SMA)",
    "SuperTrend",
    "Ichimoku",
    "ADX + RSI",
    "Bollinger Bands",
    "MACD Trend",
] as const;

export const STRATEGY_TELEMETRY: Record<
    string,
    {
        row1Label: string;
        row1Val: string;
        row2Label: string;
        row2Val: string;
        row3Label: string;
        row3Val: string;
    }
> = {
    "MACD Trend": {
        row1Label: "MACD (12/26/9-M5) :",
        row1Val: "[ON]",
        row2Label: "Main / Signal :",
        row2Val: "-3.36 / -2.48",
        row3Label: "MACD State :",
        row3Val: "BEARISH (SELL)",
    },
    "MA (EMA/SMA)": {
        row1Label: "EMA (34-M5) :",
        row1Val: "[ON]",
        row2Label: "Close / EMA :",
        row2Val: "2648.10 / 2651.40",
        row3Label: "MA State :",
        row3Val: "BEARISH (SELL)",
    },
    SuperTrend: {
        row1Label: "SuperTrend (10,3.0) :",
        row1Val: "[ON]",
        row2Label: "ST Band (M5) :",
        row2Val: "2653.85",
        row3Label: "ST Regime :",
        row3Val: "BEARISH (SELL)",
    },
    Ichimoku: {
        row1Label: "Ichimoku (9/26/52) :",
        row1Val: "[ON]",
        row2Label: "Tenkan / Kijun :",
        row2Val: "2649.20 / 2652.10",
        row3Label: "Kumo State :",
        row3Val: "BELOW CLOUD (SELL)",
    },
    "ADX + RSI": {
        row1Label: "ADX(14) / RSI(14) :",
        row1Val: "28.4 / 62.5",
        row2Label: "+DI / -DI (M5) :",
        row2Val: "16.2 / 29.8",
        row3Label: "Sniper Signal :",
        row3Val: "PULLBACK SELL",
    },
    "Bollinger Bands": {
        row1Label: "Bollinger (20, 2.0) :",
        row1Val: "[ON]",
        row2Label: "Upper / Lower :",
        row2Val: "2655.40 / 2644.10",
        row3Label: "Band State :",
        row3Val: "RE-ENTRY SELL",
    },
};

