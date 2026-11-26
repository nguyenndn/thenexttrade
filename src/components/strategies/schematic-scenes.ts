import type { PlaybookSchematicType } from "@/lib/strategies/playbook-presets";
import { buildContinuousCandles, type CandleBar } from "./schematic-candle-builder";

export type SchematicTone = "gold" | "emerald" | "red" | "cyan" | "blue" | "slate";

export interface ChartZone {
    startIdx: number;
    endIdx: number;
    topPrice: number;
    bottomPrice: number;
    tone: SchematicTone;
    label?: string;
    dashed?: boolean;
}

export interface ChartLevel {
    startIdx: number;
    endIdx: number;
    price: number;
    tone: SchematicTone;
    dashed?: boolean;
    badge?: string;
    badgeIdx?: number;
    badgePos?: "above" | "below";
}

export interface ChartCallout {
    idx: number;
    price: number;
    label: string;
    tone: SchematicTone;
    pos: "above" | "below";
}

export interface ChartTimeBand {
    startIdx: number;
    endIdx: number;
    label: string;
}

export interface ChartFibRuler {
    startIdx: number;
    endIdx: number;
    levels: Array<{ label: string; price: number }>;
}

export interface PositionToolSpec {
    startIdx: number;
    endIdx: number;
    triggerIdx: number;
    direction: "LONG" | "SHORT";
    entryPrice: number;
    slPrice: number;
    tpPrice: number;
    rrLabel: string;
}

export interface SchematicScene {
    symbol: string;
    timeframe: string;
    direction: "LONG" | "SHORT";
    rrLabel: string;
    candles: CandleBar[];
    zones?: ChartZone[];
    levels?: ChartLevel[];
    callouts?: ChartCallout[];
    timeBand?: ChartTimeBand;
    showLineOverlay?: boolean;
    fibRuler?: ChartFibRuler;
    position: PositionToolSpec;
}

export const SCHEMATIC_SCENES: Record<PlaybookSchematicType, SchematicScene> = {
    "choch-retest": {
        symbol: "XAUUSD",
        timeframe: "15m",
        direction: "SHORT",
        rrLabel: "2.5R",
        candles: buildContinuousCandles(
            20,
            [
                25, 31, 28, 36, 43, 39, 47, 56, 52, 64,
                76, 86, 79, 71, 74, 62, 53, 58, 63, 59,
                68, 75, 69, 61, 44, 36, 39, 30, 35, 42,
                39, 48, 56, 63, 57, 49, 52, 41, 32, 35,
                24, 16,
            ],
            {
                11: { h: 92 }, // HH peak
                16: { l: 50 }, // Last structural HL
                21: { h: 80 }, // LH swing high (Open of bar 21 is 68!)
                24: { h: 62, l: 42 }, // Impulsive CHoCH body close below 50
                34: { h: 68.2, l: 55 }, // Sniper retest wick tapping exact LH Open (68)
                41: { l: 14 },
            }
        ),
        levels: [
            {
                startIdx: 16,
                endIdx: 25,
                price: 50,
                tone: "red",
                dashed: true,
                badge: "CHoCH",
                badgeIdx: 20,
                badgePos: "below",
            },
            {
                startIdx: 21,
                endIdx: 35,
                price: 68,
                tone: "gold",
                dashed: true,
                badge: "LH Open",
                badgeIdx: 27.5,
                badgePos: "above",
            },
        ],
        callouts: [
            { idx: 11, price: 92, label: "HH", tone: "slate", pos: "above" },
            { idx: 21, price: 80, label: "LH", tone: "gold", pos: "above" },
        ],
        position: {
            startIdx: 34,
            endIdx: 41.4,
            triggerIdx: 34,
            direction: "SHORT",
            entryPrice: 68,
            slPrice: 83,
            tpPrice: 16,
            rrLabel: "2.5R",
        },
    },

    "ict-ote": {
        symbol: "XAUUSD",
        timeframe: "15m",
        direction: "LONG",
        rrLabel: "2.5R",
        candles: buildContinuousCandles(
            68,
            [
                63, 58, 61, 53, 47, 51, 43, 38, 42, 35,
                31, 36, 28, 23, 29, 34, 31, 41, 56, 68,
                75, 71, 78, 72, 65, 68, 59, 52, 46, 41,
                48, 55, 52, 62, 70, 67, 76, 83, 80, 88,
                91, 89,
            ],
            {
                13: { l: 13 }, // SSL Raid deep into HTF POI
                17: { h: 42 }, // Bar before FVG
                18: { h: 58, l: 40 }, // Displacement MSS candle
                19: { l: 50 }, // Leaves clean 42..50 FVG
                29: { l: 39.5, h: 48 }, // Retest into FVG ∩ OTE
            }
        ),
        zones: [
            {
                startIdx: 0,
                endIdx: 16,
                topPrice: 27,
                bottomPrice: 12,
                tone: "emerald",
                label: "HTF DEMAND POI",
            },
            {
                startIdx: 17,
                endIdx: 31,
                topPrice: 50,
                bottomPrice: 38,
                tone: "gold",
                label: "FVG ∩ OTE 0.62–0.79",
            },
        ],
        levels: [
            {
                startIdx: 8,
                endIdx: 19,
                price: 52,
                tone: "cyan",
                dashed: true,
                badge: "MSS",
                badgeIdx: 13,
                badgePos: "above",
            },
        ],
        callouts: [
            { idx: 13, price: 12, label: "SSL Raid", tone: "red", pos: "below" },
        ],
        position: {
            startIdx: 29,
            endIdx: 41.4,
            triggerIdx: 29,
            direction: "LONG",
            entryPrice: 42,
            slPrice: 22,
            tpPrice: 90,
            rrLabel: "2.5R",
        },
    },

    "three-tier": {
        symbol: "XAUUSD",
        timeframe: "5m",
        direction: "LONG",
        rrLabel: "2.5R",
        candles: buildContinuousCandles(
            24,
            [
                30, 38, 35, 45, 54, 50, 61, 70, 75, 68,
                61, 64, 55, 49, 58, 51, 43, 36, 29, 37,
                49, 64, 73, 69, 77, 71, 63, 66, 57, 48,
                42, 39, 47, 56, 53, 64, 73, 70, 81, 88,
                91, 90,
            ],
            {
                14: { h: 61 }, // $$$ internal M5 pullback high
                18: { l: 23 }, // Tier 3 origin wick
                19: { l: 26, h: 39 }, // Initiation candle (Tier 1 = 37/38)
                21: { h: 66 }, // Body-close above $$$ (61)
                31: { l: 36.8 }, // Sniper tap at Tier 1 (37)
            }
        ),
        levels: [
            {
                startIdx: 14,
                endIdx: 21.5,
                price: 61,
                tone: "gold",
                dashed: true,
                badge: "$$$ CHoCH",
                badgeIdx: 17.5,
                badgePos: "above",
            },
            { startIdx: 18, endIdx: 33, price: 37, tone: "emerald" },
            { startIdx: 18, endIdx: 33, price: 30, tone: "cyan", dashed: true },
            {
                startIdx: 18,
                endIdx: 33,
                price: 23,
                tone: "red",
                badge: "Tier 1 · 2 · 3",
                badgeIdx: 25,
                badgePos: "below",
            },
        ],
        position: {
            startIdx: 31,
            endIdx: 41.4,
            triggerIdx: 31,
            direction: "LONG",
            entryPrice: 37,
            slPrice: 19,
            tpPrice: 90,
            rrLabel: "2.5R",
        },
    },

    "pending-snr": {
        symbol: "EURUSD",
        timeframe: "1h",
        direction: "LONG",
        rrLabel: "2.0R",
        candles: buildContinuousCandles(
            42,
            [
                39, 35, 38, 33, 36, 31, 35, 28, 48, 66,
                76, 72, 80, 77, 83, 78, 71, 74, 66, 59,
                62, 54, 47, 50, 42, 37, 44, 52, 49, 58,
                66, 63, 72, 79, 76, 84, 88, 86, 90, 88,
            ],
            {
                7: { h: 36, l: 25 }, // Engulfed bearish candle (Open = 35!)
                8: { l: 24, h: 50 }, // Dominant bullish impulse launch
                9: { h: 68 },
                25: { l: 34.8 }, // Exact 1st-touch fill on Pending SNR (35)
            }
        ),
        levels: [
            {
                startIdx: 7,
                endIdx: 28,
                price: 35,
                tone: "gold",
                badge: "Fresh Pending SNR (1st Touch)",
                badgeIdx: 16.5,
                badgePos: "below",
            },
        ],
        callouts: [
            { idx: 10, price: 80, label: "Impulse", tone: "emerald", pos: "above" },
        ],
        position: {
            startIdx: 25,
            endIdx: 39.4,
            triggerIdx: 25,
            direction: "LONG",
            entryPrice: 35,
            slPrice: 19,
            tpPrice: 88,
            rrLabel: "2.0R",
        },
    },

    "msnr-qml": {
        symbol: "XAUUSD",
        timeframe: "1h",
        direction: "SHORT",
        rrLabel: "2.5R",
        showLineOverlay: true,
        candles: buildContinuousCandles(
            26,
            [
                32, 40, 37, 48, 58, 68, 61, 53, 56, 47,
                44, 54, 65, 62, 76, 87, 79, 68, 52, 38,
                31, 35, 26, 32, 40, 37, 46, 55, 52, 61,
                68, 60, 51, 54, 43, 34, 37, 27, 20, 16,
            ],
            {
                5: { h: 71 }, // Left Shoulder (Body = 68)
                15: { h: 92 }, // Quasimodo Head
                30: { h: 70 }, // Retest of QML Body = 68
            }
        ),
        levels: [
            {
                startIdx: 5,
                endIdx: 32,
                price: 68,
                tone: "cyan",
                dashed: true,
                badge: "QML Body Level",
                badgeIdx: 22.5,
                badgePos: "above",
            },
        ],
        callouts: [
            { idx: 5, price: 72, label: "LS", tone: "cyan", pos: "above" },
            { idx: 15, price: 92, label: "Head", tone: "red", pos: "above" },
        ],
        position: {
            startIdx: 30,
            endIdx: 39.4,
            triggerIdx: 30,
            direction: "SHORT",
            entryPrice: 68,
            slPrice: 89,
            tpPrice: 16,
            rrLabel: "2.5R",
        },
    },

    "fib-ote": {
        symbol: "XAUUSD",
        timeframe: "1h",
        direction: "SHORT",
        rrLabel: "3.0R",
        candles: buildContinuousCandles(
            40,
            [
                46, 54, 50, 61, 70, 65, 58, 63, 74, 84,
                88, 79, 68, 71, 54, 41, 33, 36, 26, 21,
                27, 34, 31, 41, 49, 46, 56, 64, 70, 63,
                54, 57, 46, 37, 40, 29, 22, 25, 18, 15,
            ],
            {
                6: { l: 56 }, // Last HL before CHoCH
                10: { h: 90 }, // Fib 1.0 Swing High
                19: { l: 20 }, // Fib 0.0 Swing Low
                28: { h: 73 }, // OTE 0.618-0.79 tap
            }
        ),
        zones: [
            {
                startIdx: 19,
                endIdx: 31,
                topPrice: 75,
                bottomPrice: 63,
                tone: "gold",
                label: "OTE 0.618–0.79",
            },
        ],
        fibRuler: {
            startIdx: 19,
            endIdx: 31,
            levels: [
                { label: "1.00", price: 90 },
                { label: "0.79", price: 75 },
                { label: "0.62", price: 63 },
                { label: "0.50", price: 55 },
                { label: "0.00", price: 20 },
            ],
        },
        levels: [
            {
                startIdx: 6,
                endIdx: 15,
                price: 56,
                tone: "red",
                dashed: true,
                badge: "CHoCH",
                badgeIdx: 10,
                badgePos: "below",
            },
        ],
        position: {
            startIdx: 28,
            endIdx: 39.4,
            triggerIdx: 28,
            direction: "SHORT",
            entryPrice: 70,
            slPrice: 86,
            tpPrice: 18,
            rrLabel: "3.0R",
        },
    },

    "liquidity-sweep": {
        symbol: "GBPUSD",
        timeframe: "1h",
        direction: "SHORT",
        rrLabel: "2.5R",
        candles: buildContinuousCandles(
            86,
            [
                79, 71, 64, 56, 46, 53, 61, 65, 57, 49,
                44, 52, 60, 64, 56, 48, 45, 54, 62, 57,
                51, 59, 65, 61, 66, 58, 52, 55, 44, 37,
                40, 31, 25, 28, 20, 15, 18, 14,
            ],
            {
                7: { h: 67 },
                13: { h: 67 },
                22: { h: 67 },
                24: { h: 91, l: 57 }, // Counter-trend Liquidity Raid wick above 67 + close inside!
            }
        ),
        levels: [
            {
                startIdx: 5,
                endIdx: 25,
                price: 67,
                tone: "gold",
                dashed: true,
                badge: "Swing High BSL ($$$)",
                badgeIdx: 14,
                badgePos: "above",
            },
            {
                startIdx: 5,
                endIdx: 28,
                price: 43,
                tone: "slate",
                dashed: true,
            },
        ],
        callouts: [
            { idx: 24, price: 91, label: "Sweep", tone: "red", pos: "above" },
        ],
        position: {
            startIdx: 25,
            endIdx: 37.4,
            triggerIdx: 25,
            direction: "SHORT",
            entryPrice: 60,
            slPrice: 89,
            tpPrice: 15,
            rrLabel: "2.5R",
        },
    },

    "engulfing-411": {
        symbol: "XAUUSD",
        timeframe: "4h",
        direction: "LONG",
        rrLabel: "3.0R",
        candles: buildContinuousCandles(
            42,
            [
                38, 34, 37, 30, 25, 22, 36, 47, 43, 52,
                59, 54, 64, 73, 79, 74, 82, 76, 69, 72,
                63, 55, 58, 49, 41, 35, 31, 39, 48, 45,
                56, 65, 62, 73, 81, 78, 86, 91, 89, 92,
            ],
            {
                5: { l: 19, h: 31 }, // Engulfed base candle
                6: { l: 18, h: 39 }, // Fresh Bullish Engulfing (ISL + HSL)
                26: { l: 28 }, // Pullback tap into Fresh Engulfing zone
            }
        ),
        zones: [
            {
                startIdx: 4,
                endIdx: 28,
                topPrice: 32,
                bottomPrice: 18,
                tone: "blue",
                label: "FRESH ENGULFING (ISL / HSL)",
            },
        ],
        levels: [
            {
                startIdx: 0,
                endIdx: 9.5,
                price: 46,
                tone: "cyan",
                dashed: true,
                badge: "BOS #1",
                badgeIdx: 4,
                badgePos: "above",
            },
            {
                startIdx: 8,
                endIdx: 13.5,
                price: 62,
                tone: "emerald",
                dashed: true,
                badge: "BOS #2",
                badgeIdx: 10.5,
                badgePos: "above",
            },
        ],
        position: {
            startIdx: 26,
            endIdx: 39.4,
            triggerIdx: 26,
            direction: "LONG",
            entryPrice: 30,
            slPrice: 15,
            tpPrice: 91,
            rrLabel: "3.0R",
        },
    },

    "london-sweep": {
        symbol: "EURUSD",
        timeframe: "15m",
        direction: "LONG",
        rrLabel: "3.0R",
        candles: buildContinuousCandles(
            52,
            [
                56, 61, 55, 48, 53, 60, 57, 49, 46, 54,
                61, 56, 48, 52, 46, 39, 26, 35, 47, 61,
                69, 65, 72, 66, 59, 62, 53, 46, 41, 49,
                57, 54, 65, 74, 71, 81, 87, 85, 90, 89,
            ],
            {
                16: { l: 15 }, // London Open Stop Raid below Asian Low (44)
                17: { h: 36 },
                18: { l: 34, h: 49 }, // M15 Displacement
                19: { l: 46 }, // Leaves 36..46 FVG
                28: { l: 39.5 }, // 50% FVG retest
            }
        ),
        zones: [
            {
                startIdx: 0,
                endIdx: 14,
                topPrice: 63,
                bottomPrice: 44,
                tone: "slate",
                label: "ASIAN RANGE",
                dashed: true,
            },
            {
                startIdx: 17,
                endIdx: 30,
                topPrice: 46,
                bottomPrice: 36,
                tone: "emerald",
                label: "50% FVG",
            },
        ],
        levels: [
            {
                startIdx: 12,
                endIdx: 19.5,
                price: 56,
                tone: "cyan",
                dashed: true,
                badge: "M15 MSS",
                badgeIdx: 15.8,
                badgePos: "above",
            },
        ],
        callouts: [
            { idx: 16, price: 14, label: "LDN Raid", tone: "red", pos: "below" },
        ],
        position: {
            startIdx: 28,
            endIdx: 39.4,
            triggerIdx: 28,
            direction: "LONG",
            entryPrice: 41,
            slPrice: 16,
            tpPrice: 89,
            rrLabel: "3.0R",
        },
    },

    "break-retest": {
        symbol: "GBPUSD",
        timeframe: "1h",
        direction: "LONG",
        rrLabel: "2.5R",
        candles: buildContinuousCandles(
            18,
            [
                23, 29, 26, 35, 44, 50, 44, 38, 42, 49,
                51, 45, 41, 48, 61, 71, 68, 76, 79, 73,
                67, 70, 62, 56, 53, 59, 66, 63, 72, 79,
                76, 84, 89, 87, 91, 90,
            ],
            {
                5: { h: 53 }, // Resistance test #1
                10: { h: 53 }, // Resistance test #2
                14: { h: 63, l: 47 }, // Clean breakout candle
                24: { l: 47.5, h: 57 }, // Pinbar rejection on flipped support!
            }
        ),
        zones: [
            {
                startIdx: 2,
                endIdx: 27,
                topPrice: 54,
                bottomPrice: 48,
                tone: "blue",
                label: "S/R FLIP PIVOT",
            },
        ],
        callouts: [
            { idx: 15, price: 75, label: "Breakout", tone: "emerald", pos: "above" },
            { idx: 24, price: 46, label: "Pinbar", tone: "gold", pos: "below" },
        ],
        position: {
            startIdx: 24,
            endIdx: 35.4,
            triggerIdx: 24,
            direction: "LONG",
            entryPrice: 53,
            slPrice: 36,
            tpPrice: 90,
            rrLabel: "2.5R",
        },
    },

    "range-squeeze": {
        symbol: "GBPUSD",
        timeframe: "15m",
        direction: "LONG",
        rrLabel: "2.0R",
        candles: buildContinuousCandles(
            38,
            [
                42, 37, 43, 39, 35, 41, 45, 40, 36, 42,
                38, 44, 39, 35, 41, 45, 41, 46, 61, 70,
                66, 72, 65, 58, 53, 49, 57, 65, 62, 71,
                78, 75, 83, 88, 86, 91, 90,
            ],
            {
                18: { h: 63, l: 45 }, // High-volume expansion candle closing outside box
                25: { l: 47.5 }, // First retest of Asian box top (48)
            }
        ),
        zones: [
            {
                startIdx: 0,
                endIdx: 17,
                topPrice: 48,
                bottomPrice: 32,
                tone: "gold",
                label: "ASIAN SQUEEZE (<30P)",
                dashed: true,
            },
        ],
        levels: [
            {
                startIdx: 17,
                endIdx: 27,
                price: 40,
                tone: "red",
                dashed: true,
                badge: "50% Mid SL",
                badgeIdx: 21.5,
                badgePos: "below",
            },
        ],
        position: {
            startIdx: 25,
            endIdx: 36.4,
            triggerIdx: 25,
            direction: "LONG",
            entryPrice: 49,
            slPrice: 40,
            tpPrice: 90,
            rrLabel: "2.0R",
        },
    },

    "supply-demand-flip": {
        symbol: "XAUUSD",
        timeframe: "1h",
        direction: "SHORT",
        rrLabel: "3.0R",
        candles: buildContinuousCandles(
            82,
            [
                76, 69, 63, 59, 66, 74, 71, 79, 85, 81,
                75, 78, 69, 51, 36, 28, 32, 24, 30, 37,
                34, 43, 50, 47, 55, 58, 50, 42, 45, 35,
                27, 30, 21, 16, 19, 14,
            ],
            {
                3: { l: 56 }, // Initial bounce off Demand (56..63)
                13: { h: 70, l: 49 }, // Violent Marubozu slicing straight through Demand!
                14: { h: 52, l: 34 },
                25: { h: 61.5 }, // Pullback test into Flipped Supply (SBR)
            }
        ),
        zones: [
            {
                startIdx: 0,
                endIdx: 12.5,
                topPrice: 63,
                bottomPrice: 56,
                tone: "emerald",
                label: "DEMAND",
            },
            {
                startIdx: 13.5,
                endIdx: 28,
                topPrice: 63,
                bottomPrice: 56,
                tone: "red",
                label: "SBR SUPPLY FLIP",
            },
        ],
        callouts: [
            { idx: 14, price: 32, label: "Marubozu", tone: "red", pos: "below" },
        ],
        position: {
            startIdx: 25,
            endIdx: 35.4,
            triggerIdx: 25,
            direction: "SHORT",
            entryPrice: 57,
            slPrice: 71,
            tpPrice: 15,
            rrLabel: "3.0R",
        },
    },

    "silver-bullet": {
        symbol: "XAUUSD",
        timeframe: "5m",
        direction: "LONG",
        rrLabel: "2.0R",
        candles: buildContinuousCandles(
            60,
            [
                55, 50, 53, 46, 40, 45, 51, 48, 43, 46,
                41, 36, 25, 34, 48, 62, 70, 66, 73, 67,
                60, 63, 54, 47, 43, 51, 59, 56, 66, 74,
                71, 80, 87, 85, 90, 89,
            ],
            {
                4: { l: 38 }, // Pre-10am session SSL
                12: { l: 17 }, // 10:05 AM NY Sweep of SSL
                13: { h: 36 },
                14: { l: 33, h: 50 }, // Displacement candle
                15: { l: 47 }, // Clean 36..47 Silver Bullet FVG
                24: { l: 41.5 }, // Limit fill inside FVG
            }
        ),
        timeBand: {
            startIdx: 10,
            endIdx: 32,
            label: "10:00–11:00 NY SILVER BULLET",
        },
        zones: [
            {
                startIdx: 13,
                endIdx: 26,
                topPrice: 47,
                bottomPrice: 36,
                tone: "cyan",
                label: "M5 FVG",
            },
        ],
        levels: [
            {
                startIdx: 3,
                endIdx: 13,
                price: 38,
                tone: "red",
                dashed: true,
                badge: "Session SSL",
                badgeIdx: 7.5,
                badgePos: "below",
            },
        ],
        position: {
            startIdx: 24,
            endIdx: 35.4,
            triggerIdx: 24,
            direction: "LONG",
            entryPrice: 43,
            slPrice: 21,
            tpPrice: 89,
            rrLabel: "2.0R",
        },
    },
};
