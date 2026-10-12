export interface PlaybookPreset {
    id: string;
    name: string;
    description: string;
    rules: string;
    color: string;
    setupType: string;
    timeframes: string[];
    pairs: string[];
    idealEntry: string;
    idealStopLoss: string;
    idealTakeProfit: string;
    riskRewardMin: number;
    referenceImages: string[];
}

export const PLAYBOOK_PRESETS: PlaybookPreset[] = [
    {
        id: "smc-london-sweep",
        name: "SMC London Liquidity Sweep",
        description: "Sweep of Asian session high/low during London open followed by reversal on Market Structure Shift (MSS).",
        rules: "1. Mark Asian session range (Asian High / Asian Low)\n2. Wait for London open liquidity sweep above/below Asian range\n3. Confirm M15 Market Structure Shift (MSS) reversal\n4. Enter limit order at 50% FVG or decisive Order Block",
        color: "hsl(var(--primary))",
        setupType: "Reversal",
        timeframes: ["H4", "M15", "M5"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD"],
        idealEntry: "50% Fair Value Gap (FVG) following M15 MSS confirmation",
        idealStopLoss: "Above/below liquidity sweep wick + 3 pips buffer",
        idealTakeProfit: "Opposite Asian range extreme (Liquidity Target)",
        riskRewardMin: 3.0,
        referenceImages: [],
    },
    {
        id: "break-and-retest",
        name: "Break & Retest Trend Continuation",
        description: "Catch pullback retests of key structural levels after a clean break, riding the dominant trend.",
        rules: "1. Clear H4 trend structure (Higher Highs / Lower Lows)\n2. Decisive break through major Key Level / Structural Pivot\n3. Wait for price retest of breakout zone\n4. M15 rejection confirmation (Pinbar / Bullish Engulfing)",
        color: "#3B82F6",
        setupType: "Continuation",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["NAS100", "US30", "XAUUSD", "EURUSD"],
        idealEntry: "Retest of Support/Resistance Flip Zone",
        idealStopLoss: "Beyond retested structure level + volatility buffer",
        idealTakeProfit: "Next structural high/low on H4 timeframe",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "asian-range-squeeze",
        name: "Asian Range Squeeze & Expansion",
        description: "Capitalize on volatility compression during Asian hours to catch high-volume expansions at London/NY open.",
        rules: "1. Tight Asian session consolidation (< 30 pips Forex / < 100 pips Gold)\n2. Set price alerts at range boundaries\n3. Wait for M15 candle body close outside range with surging volume\n4. Execute in breakout direction",
        color: "#F59E0B",
        setupType: "Breakout",
        timeframes: ["M15", "M5"],
        pairs: ["GBPUSD", "EURUSD", "BTCUSD"],
        idealEntry: "On M15 close outside boundary or first retest of range edge",
        idealStopLoss: "Asian range midpoint (50% equilibrium)",
        idealTakeProfit: "2x Asian range width (Measured Move target)",
        riskRewardMin: 2.0,
        referenceImages: [],
    },
    {
        id: "supply-demand-flip",
        name: "Supply / Demand Zone Flip",
        description: "Trade structural polarity when strong demand fails and transforms into new supply (or vice-versa).",
        rules: "1. Identify high-timeframe H1/H4 Supply/Demand zone\n2. Clean displacement through zone with Marubozu momentum\n3. Mark structural flip zone (Demand to Supply)\n4. Wait for pullback test and M15 confirmation",
        color: "#8B5CF6",
        setupType: "Reversal",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["XAUUSD", "USDJPY", "EURJPY"],
        idealEntry: "Touch of newly formed Flip Zone boundary",
        idealStopLoss: "Just beyond invalidation edge of Flip Zone",
        idealTakeProfit: "Next opposing H1 Supply/Demand objective",
        riskRewardMin: 3.0,
        referenceImages: [],
    },
    {
        id: "ict-silver-bullet",
        name: "ICT Silver Bullet Scalp",
        description: "Precision execution during ICT Silver Bullet macro windows (10:00 - 11:00 AM NY / 03:00 - 04:00 AM London) targeting 1m/5m FVGs.",
        rules: "1. Trade exclusively inside designated Silver Bullet window\n2. Sweep of nearest session liquidity pool (BSL / SSL)\n3. Displacement creating clean Fair Value Gap (FVG)\n4. Set limit entry inside FVG",
        color: "#06B6D4",
        setupType: "Scalp",
        timeframes: ["M5", "M1"],
        pairs: ["NAS100", "US30", "XAUUSD"],
        idealEntry: "Fair Value Gap (FVG) discount/premium midpoint",
        idealStopLoss: "Beyond displacement candle swing extreme",
        idealTakeProfit: "Target 10-15 pips or nearest opposing liquidity pool",
        riskRewardMin: 2.0,
        referenceImages: [],
    },
];
