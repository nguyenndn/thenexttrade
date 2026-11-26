export const RULE_CATEGORIES = [
    "ENTRY",
    "EXIT",
    "RISK",
    "SESSION",
    "MANAGEMENT",
    "PSYCHOLOGY",
] as const;

export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const RULE_SEVERITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export type PlaybookStyle = "Scalp" | "Intraday" | "Swing";

export type PlaybookSchematicType =
    | "liquidity-sweep"
    | "london-sweep"
    | "choch-retest"
    | "three-tier"
    | "pending-snr"
    | "supply-demand-flip"
    | "msnr-qml"
    | "engulfing-411"
    | "fib-ote"
    | "ict-ote"
    | "silver-bullet"
    | "break-retest"
    | "range-squeeze";

export interface StrategyRuleInput {
    id?: string;
    title: string;
    description?: string | null;
    category: RuleCategory;
    severity: RuleSeverity;
    isActive?: boolean;
}

export interface PlaybookPreset {
    id: string;
    name: string;
    description: string;
    formula: string;
    commonTrap: string;
    style: PlaybookStyle;
    market: string;
    schematicType: PlaybookSchematicType;
    rules: string;
    ruleItems: StrategyRuleInput[];
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

export function parseLegacyStrategyRules(
    rawRules: string | null | undefined
): StrategyRuleInput[] {
    if (!rawRules || !rawRules.trim()) return [];
    return rawRules
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•\d.)]+\s*/, "").trim())
        .filter((line) => line.length >= 3)
        .map((line) => ({
            title: line.slice(0, 140),
            category: "ENTRY" as const,
            severity: "HIGH" as const,
            isActive: true,
        }));
}

export function filterApplicableRules<
    T extends {
        accountId?: string | null;
        strategyId?: string | null;
        strategy?: { name: string } | null;
    },
>(
    rules: T[],
    selectedAccountId?: string | null,
    selectedStrategyName?: string | null
): T[] {
    const normalizedAccount =
        selectedAccountId && selectedAccountId !== "none" && selectedAccountId !== "all"
            ? selectedAccountId
            : null;
    const normalizedStrategy =
        selectedStrategyName && selectedStrategyName.trim().length > 0
            ? selectedStrategyName.trim()
            : null;

    return rules.filter((rule) => {
        if (rule.accountId) {
            if (!normalizedAccount || rule.accountId !== normalizedAccount) {
                return false;
            }
        }
        if (rule.strategyId || rule.strategy?.name) {
            if (!normalizedStrategy || rule.strategy?.name !== normalizedStrategy) {
                return false;
            }
        }
        return true;
    });
}

/**
 * Returns ONLY rules explicitly attached to the selected Strategy (Playbook).
 * Returns [] when no strategy is selected so trade modals never dump Global rules
 * as setup conditions or dilute Playbook Execution Grades.
 */
export function filterStrategyRules<
    T extends {
        accountId?: string | null;
        strategyId?: string | null;
        strategy?: { name: string } | null;
    },
>(
    rules: T[],
    selectedAccountId?: string | null,
    selectedStrategyName?: string | null
): T[] {
    const normalizedStrategy =
        selectedStrategyName && selectedStrategyName.trim().length > 0
            ? selectedStrategyName.trim()
            : null;
    if (!normalizedStrategy) return [];

    const normalizedAccount =
        selectedAccountId &&
        selectedAccountId !== "none" &&
        selectedAccountId !== "all"
            ? selectedAccountId
            : null;

    return rules.filter((rule) => {
        if (rule.accountId) {
            if (!normalizedAccount || rule.accountId !== normalizedAccount) {
                return false;
            }
        }
        return rule.strategy?.name === normalizedStrategy;
    });
}

/**
 * Returns ONLY independent Global / Account-scoped guardrails (no strategyId).
 */
export function filterGlobalRules<
    T extends {
        accountId?: string | null;
        strategyId?: string | null;
        strategy?: { name: string } | null;
    },
>(rules: T[], selectedAccountId?: string | null): T[] {
    const normalizedAccount =
        selectedAccountId &&
        selectedAccountId !== "none" &&
        selectedAccountId !== "all"
            ? selectedAccountId
            : null;

    return rules.filter((rule) => {
        if (rule.strategyId || rule.strategy?.name) {
            return false;
        }
        if (rule.accountId) {
            if (!normalizedAccount || rule.accountId !== normalizedAccount) {
                return false;
            }
        }
        return true;
    });
}

export function computeSuggestedPlaybookGrade(
    totalRules: number,
    followedCount: number
): { score: number; grade: "A+" | "A" | "B" | "C" } {
    const score =
        totalRules > 0
            ? Math.round((Math.max(0, followedCount) / totalRules) * 100)
            : 100;

    let grade: "A+" | "A" | "B" | "C" = "C";
    if (score === 100) grade = "A+";
    else if (score >= 75) grade = "A";
    else if (score >= 50) grade = "B";

    return { score, grade };
}

export const PLAYBOOK_PRESETS: PlaybookPreset[] = [
    {
        id: "choch-open-retest",
        name: "CHoCH Open-Price Retest",
        description:
            "Wait for an exhausted trend to print a Lower High and body-close CHoCH before entering at the exact open of the last opposing candle.",
        formula: "HH/HL Trend → Lower High (LH) → Body-Close CHoCH → LH Open Retest",
        commonTrap:
            "Selling breakdowns at the bottom before CHoCH confirms, or chasing the break candle instead of waiting for the LH body-open retest.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "choch-retest",
        rules: "1. Clear prior HH/HL trend losing momentum via a Lower High (LH)\n2. Candle body closes past last HL/HH to confirm valid CHoCH\n3. Mark Key Level on exact Open of last opposing candle at LH\n4. Place Limit on first retest only; SL beyond LH + spread\n5. Cancel limit if TP1 hits before fill or 30m before CPI/NFP/FOMC",
        ruleItems: [
            {
                title: "Confirm prior HH/HL structure printed a clear Lower High (LH)",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Candle body closes past last structural swing to confirm CHoCH (wick pierce invalid)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Anchor Key Level on exact Open price of last opposing candle at LH",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Enter on first retest only with hard SL beyond LH + spread (risk <= 1%)",
                category: "RISK",
                severity: "HIGH",
            },
            {
                title: "Cancel pending limit if TP1 is hit before fill or candle closes past LH",
                category: "MANAGEMENT",
                severity: "HIGH",
            },
            {
                title: "Stand aside 30 minutes before high-impact news (CPI, NFP, FOMC)",
                category: "SESSION",
                severity: "MEDIUM",
            },
        ],
        color: "#F59E0B",
        setupType: "Reversal",
        timeframes: ["H4", "H1", "M30"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD"],
        idealEntry: "Exact Open price of last bullish/bearish candle at LH/HL",
        idealStopLoss: "Above LH / below HL swing extreme + spread buffer",
        idealTakeProfit: "Partial at 1R / post-CHoCH extreme; runner to HTF liquidity",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "ict-htf-poi-ote",
        name: "ICT HTF POI + MSS + FVG OTE",
        description:
            "Align Higher-Timeframe Point of Interest with an LTF liquidity raid, displacement Market Structure Shift, and FVG overlapping 0.62-0.79 OTE.",
        formula: "HTF POI Tap → LTF Sweep + Displacement MSS → FVG ∩ 0.62–0.79 OTE",
        commonTrap:
            "Placing blind limits at HTF POI before an LTF liquidity sweep + MSS, or forcing entries when the FVG does not overlap OTE.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "ict-ote",
        rules: "1. Price taps pre-marked HTF POI near resting liquidity\n2. LTF sweeps liquidity and prints displacement body-close MSS\n3. Displacement leg leaves a clean Fair Value Gap overlapping 0.62-0.79 OTE\n4. Enter inside FVG ∩ OTE with hard SL beyond structural invalidation\n5. Require >= 2R to external HTF liquidity pool",
        ruleItems: [
            {
                title: "HTF Point of Interest (OB / FVG / S&D) pre-marked before LTF trigger",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "LTF sweeps internal liquidity and closes past swing with displacement MSS",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Valid Fair Value Gap (FVG) directly overlaps 0.62-0.79 OTE zone",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Hard stop-loss beyond displacement origin with >= 2R room to target",
                category: "RISK",
                severity: "HIGH",
            },
            {
                title: "Scale partial at 1R/internal pool and hold runner to external HTF liquidity",
                category: "EXIT",
                severity: "MEDIUM",
            },
            {
                title: "Grade rule execution objectively regardless of win or loss outcome",
                category: "PSYCHOLOGY",
                severity: "MEDIUM",
            },
        ],
        color: "#00C888",
        setupType: "Reversal",
        timeframes: ["H4", "M15", "M5"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD", "US30"],
        idealEntry: "Intersection of LTF Fair Value Gap and 0.62-0.79 OTE retracement",
        idealStopLoss: "Beyond sweep / displacement origin swing + spread",
        idealTakeProfit: "Opposing HTF external liquidity pool (>= 2.5R)",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "choch-three-tier-entry",
        name: "CHoCH + 3-Tier Initiation Scalp",
        description:
            "Trade M5 pullbacks in an H1 trend by waiting for internal $$$ liquidity break, then bidding the 3 precision tiers of the initiation candle pair.",
        formula: "H1 Trend → M5 Pullback $$$ Body Break → Initiation Pair (Tier 1–3)",
        commonTrap:
            "Chasing the candle that breaks $$$ at premium prices, or catching falling knives on M5 before a body closes above $$$.",
        style: "Scalp",
        market: "Forex & Gold",
        schematicType: "three-tier",
        rules: "1. Trade strictly in H1 primary trend direction\n2. Mark $$$ liquidity above/below last M5 pullback swing\n3. Wait for impulsive M5 candle body close past $$$\n4. Map Initiation Candle Pair Tiers 1 (body open), 2 (left wick), 3 (origin low)\n5. Limit at Tier 1, tight hard SL beyond Tier 3",
        ruleItems: [
            {
                title: "H1 primary trend is clean; execute exclusively in HTF trend direction",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Mark $$$ stop pool on final M5 pullback swing and wait for body-close break",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Map Tiers 1, 2, and 3 on the initiation candle pair at origin of break",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Set Limit at Tier 1 with tight hard stop-loss beyond Tier 3 (risk <= 1%)",
                category: "RISK",
                severity: "HIGH",
            },
            {
                title: "Cancel order if price hits TP target or closes past Tier 3 before fill",
                category: "MANAGEMENT",
                severity: "HIGH",
            },
        ],
        color: "#06B6D4",
        setupType: "Scalp",
        timeframes: ["H1", "M5"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD"],
        idealEntry: "Tier 1 (bullish/bearish initiation candle Open) or split Tier 1 + Tier 2",
        idealStopLoss: "Tightly beyond Tier 3 origin wick + spread buffer",
        idealTakeProfit: "Post-CHoCH high/low and H1 continuation swing",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "pending-fresh-snr",
        name: "Single-Touch Pending Fresh SNR",
        description:
            "Draw razor-thin horizontal levels at the exact open of an engulfed candle launching a strong impulse, and trade strictly on first touch.",
        formula: "Strong Impulse Origin → Dominant Candle Pair → Engulfed Open (1st Touch)",
        commonTrap:
            "Drawing wide subjective S/R zones by feel and re-trading a level on its 3rd or 4th touch after resting institutional orders are depleted.",
        style: "Scalp",
        market: "Forex & Gold",
        schematicType: "pending-snr",
        rules: "1. Locate origin of a sharp, clean impulsive expansion\n2. Identify overwhelming candle pair at impulse launchpad\n3. Draw horizontal line on exact Open of the engulfed small candle\n4. Place Pending Limit for 1st touch only (retire after 2nd touch)\n5. Hard SL behind candle pair extreme",
        ruleItems: [
            {
                title: "Level originates at launchpad of a strong momentum expansion (no chop)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Anchor single horizontal price on exact Open of engulfed small candle",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Verify level is Fresh (1st touch; retire level permanently after 2 touches)",
                category: "MANAGEMENT",
                severity: "HIGH",
            },
            {
                title: "Hard stop-loss behind dominant candle pair extreme with >= 2R target",
                category: "RISK",
                severity: "HIGH",
            },
            {
                title: "Cancel pending order immediately if candle body closes through the pair",
                category: "MANAGEMENT",
                severity: "HIGH",
            },
        ],
        color: "#10B981",
        setupType: "Reversal",
        timeframes: ["H1", "M15"],
        pairs: ["XAUUSD", "EURUSD", "USDJPY"],
        idealEntry: "Exact Open price of the engulfed candle at impulse origin",
        idealStopLoss: "Beyond high/low extreme of the engulfing candle pair",
        idealTakeProfit: "Opposing fresh Pending SNR level or swing extreme",
        riskRewardMin: 2.0,
        referenceImages: [],
    },
    {
        id: "msnr-line-body-levels",
        name: "MSNR Line-Chart Body & QML",
        description:
            "Malaysian SnR precision methodology: anchor levels strictly on Line-Chart candle bodies (V/A peaks, RBS/SBR flips, Quasimodo Left Shoulder, 50% Wick).",
        formula: "Line-Chart V/A Body Level + Body-Close RBS/SBR or QML → Fresh Limit",
        commonTrap:
            "Anchoring levels on noisy wicks instead of Open/Close bodies, or trading mid-chain OCL pauses that get sliced on the way to the origin.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "msnr-qml",
        rules: "1. Switch to Line Chart to mark exact Open/Close V, A, or QML Left Shoulder\n2. Confirm level is 100% Fresh (untouched even by a wick)\n3. For RBS/SBR/QML, require full candle body close through structure\n4. Set Limit at body level, hard SL outside pattern wick extreme\n5. Cancel limit if opposing target hits before fill",
        ruleItems: [
            {
                title: "Name exact MSNR formation (V, A, QML, RBS, SBR, Origin OCL, or 50% Wick)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Anchor horizontal level strictly on candle Open/Close body (Line Chart verified)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Confirm level is 100% Fresh (never previously tapped by body or wick)",
                category: "MANAGEMENT",
                severity: "HIGH",
            },
            {
                title: "Require full candle-body close for RBS, SBR, or Quasimodo structure break",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Hard stop-loss behind Head/wick extreme with risk <= 1% and R:R >= 2.5",
                category: "RISK",
                severity: "HIGH",
            },
        ],
        color: "#0EA5E9",
        setupType: "Reversal",
        timeframes: ["H4", "H1"],
        pairs: ["XAUUSD", "GBPUSD", "GBPJPY", "EURUSD"],
        idealEntry: "Fresh V/A body junction or QML Left Shoulder body level",
        idealStopLoss: "Beyond Quasimodo Head or pattern wick extreme + spread",
        idealTakeProfit: "Nearest opposing fresh H1/H4 MSNR roadblock",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "choch-fib-ote",
        name: "CHoCH + Fibonacci OTE (0.618–0.79)",
        description:
            "Eliminate wide stop-losses on trend reversals by anchoring Fibonacci across the completed CHoCH leg and bidding the deep 0.618–0.79 OTE zone.",
        formula: "Body-Close CHoCH → Fib Anchor (1 → 0) → 0.618–0.79 OTE Limit (SL > 0.886)",
        commonTrap:
            "Market-entering right as CHoCH breaks with terrible R:R, or pulling Fib prematurely before swing 0 finishes forming.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "fib-ote",
        rules: "1. Wait for full candle-body close CHoCH reversing prior trend\n2. Wait for break leg to form clear swing 0, then pull Fib 1 to 0\n3. Set Limit inside 0.618-0.79 OTE discount/premium band\n4. Place tight hard SL beyond 0.886 Fib invalidation\n5. Target Fib 0 swing extreme; cancel if Fib 0 hits before fill",
        ruleItems: [
            {
                title: "Prior trend broken by a decisive candle-body close CHoCH",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Anchor Fibonacci from old trend extreme (1.0) to completed CHoCH swing (0.0)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Place Limit inside 0.618-0.79 OTE zone (no mid-air chasing above 0.5)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Set tight hard stop-loss beyond 0.886 Fib level (risk <= 1%)",
                category: "RISK",
                severity: "HIGH",
            },
            {
                title: "Take profit at Fib 0.0; cancel order if Fib 0.0 or 1.0 breaks before fill",
                category: "EXIT",
                severity: "MEDIUM",
            },
        ],
        color: "#F97316",
        setupType: "Reversal",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["XAUUSD", "EURUSD", "BTCUSD"],
        idealEntry: "0.618 to 0.79 Fibonacci Optimal Trade Entry band",
        idealStopLoss: "Beyond 0.886 Fibonacci retracement level",
        idealTakeProfit: "0.0 Fibonacci swing extreme (>= 3.0R)",
        riskRewardMin: 3.0,
        referenceImages: [],
    },
    {
        id: "swing-liquidity-sweep",
        name: "Swing Liquidity Raid & Trend Run",
        description:
            "Wait for a counter-trend wick to raid resting stops past a consolidation Swing High/Low, close back inside, and ride the primary trend.",
        formula: "Primary Trend → Range Swing High/Low → Wick Sweep & Reclaim → Trend Entry",
        commonTrap:
            "Buying false breakout wicks against the dominant trend, or entering early inside the range before swing stops are hunted.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "liquidity-sweep",
        rules: "1. Identify clear dominant trend pausing in a range\n2. Mark visible Swing High and Swing Low stop pools\n3. Wait for candle wick to sweep counter-trend swing and close back inside\n4. Enter with primary trend; SL beyond sweep wick\n5. Exit early if a subsequent candle body closes past the swept swing",
        ruleItems: [
            {
                title: "Dominant H1/H4 trend is established prior to range consolidation",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Counter-trend wick raids Swing High/Low stops and closes back inside range",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Execute strictly in primary trend direction upon range reclaim",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Hard stop-loss above/below liquidity sweep wick tip (risk <= 1%)",
                category: "RISK",
                severity: "HIGH",
            },
            {
                title: "Exit early if candle body closes back outside swept swing (higher pool active)",
                category: "EXIT",
                severity: "HIGH",
            },
        ],
        color: "#14B8A6",
        setupType: "Continuation",
        timeframes: ["H1", "M15"],
        pairs: ["XAUUSD", "GBPUSD", "US30"],
        idealEntry: "Close of liquidity-sweep reclaim candle back inside range",
        idealStopLoss: "Beyond the liquidity-sweep candle wick extreme",
        idealTakeProfit: "External liquidity resting beyond opposing Swing Low/High",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "snr-engulfing-411",
        name: "Dual-Break SnR & Engulfing (411)",
        description:
            "Top-down institutional pullback model requiring two structural markers broken and a fresh Engulfing zone containing both ISL and HSL.",
        formula: "HTF Alignment → Dual Marker Break → Fresh Engulfing (ISL + HSL) Pullback",
        commonTrap:
            "Entering after a single minor break, trading non-fresh tapped zones, or ignoring opposing roadblocks one timeframe below entry.",
        style: "Swing",
        market: "Forex & Gold",
        schematicType: "engulfing-411",
        rules: "1. Align W1/D1/H4 direction and pair pullback profile (Accurate/Deep)\n2. Require price to break two structural markers before pullback\n3. Verify Engulfing zone is Fresh and contains both ISL and HSL\n4. Enter on pullback (never chase breakout); SL outside zone\n5. Set TP ahead of opposing Roadblock on Entry TF - 1",
        ruleItems: [
            {
                title: "Top-down W1/D1/H4 trend bias aligned before stalking entry zone",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Price broke two consecutive structural markers prior to pullback",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Engulfing zone is Fresh and encapsulates both ISL and HSL levels",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Set TP before opposing Roadblock on Entry TF - 1 with R:R >= 3.0",
                category: "EXIT",
                severity: "MEDIUM",
            },
            {
                title: "Relabel zone as Non-Fresh after first tap; log post-trade chart review",
                category: "PSYCHOLOGY",
                severity: "LOW",
            },
        ],
        color: "#3B82F6",
        setupType: "Swing",
        timeframes: ["D1", "H4", "H1"],
        pairs: ["XAUUSD", "EURUSD", "AUDUSD", "USDCAD"],
        idealEntry: "Pullback into Fresh Engulfing zone (body + wick calibrated to pair)",
        idealStopLoss: "Outside Entry TF or Entry TF - 1 structural zone",
        idealTakeProfit: "Ahead of nearest opposing Roadblock on lower timeframe",
        riskRewardMin: 3.0,
        referenceImages: [],
    },
    {
        id: "smc-london-sweep",
        name: "SMC London Liquidity Sweep",
        description:
            "Sweep of Asian session high/low during London open followed by reversal on Market Structure Shift (MSS).",
        formula: "Asian Range High/Low → London Open Stop Raid → M15 MSS → 50% FVG Limit",
        commonTrap:
            "Fading the London spike immediately before M15 confirms a Market Structure Shift, getting run over by genuine trend expansion.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "london-sweep",
        rules: "1. Mark Asian session range (Asian High / Asian Low)\n2. Wait for London open liquidity sweep above/below Asian range\n3. Confirm M15 Market Structure Shift (MSS) reversal\n4. Enter limit order at 50% FVG or decisive Order Block",
        ruleItems: [
            {
                title: "Mark Asian session range (Asian High / Asian Low)",
                category: "SESSION",
                severity: "MEDIUM",
            },
            {
                title: "Wait for London open liquidity sweep above/below Asian range",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Confirm M15 Market Structure Shift (MSS) reversal",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Enter limit order at 50% FVG or decisive Order Block",
                category: "ENTRY",
                severity: "HIGH",
            },
        ],
        color: "#00C888",
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
        description:
            "Catch pullback retests of key structural levels after a clean break, riding the dominant trend.",
        formula: "H4 Trend → Key Pivot Body Break → First Flip-Zone Retest → M15 Rejection",
        commonTrap:
            "Buying extended breakout candles far from structure instead of letting price come back to retest the broken pivot.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "break-retest",
        rules: "1. Clear H4 trend structure (Higher Highs / Lower Lows)\n2. Decisive break through major Key Level / Structural Pivot\n3. Wait for price retest of breakout zone\n4. M15 rejection confirmation (Pinbar / Bullish Engulfing)",
        ruleItems: [
            {
                title: "Clear H4 trend structure (Higher Highs / Lower Lows)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Decisive break through major Key Level / Structural Pivot",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Wait for price retest of breakout zone",
                category: "ENTRY",
                severity: "MEDIUM",
            },
            {
                title: "M15 rejection confirmation (Pinbar / Bullish Engulfing)",
                category: "ENTRY",
                severity: "HIGH",
            },
        ],
        color: "#3B82F6",
        setupType: "Continuation",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD", "US30"],
        idealEntry: "Retest of Support/Resistance Flip Zone",
        idealStopLoss: "Beyond retested structure level + volatility buffer",
        idealTakeProfit: "Next structural high/low on H4 timeframe",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "asian-range-squeeze",
        name: "Asian Range Squeeze & Expansion",
        description:
            "Capitalize on volatility compression during Asian hours to catch high-volume expansions at London/NY open.",
        formula: "Tight Asian Box (<30p FX / <100p Gold) → M15 Body Expansion → Midpoint SL",
        commonTrap:
            "Trading breakouts out of an already wide, exhausted Asian session that has consumed the pair's daily ADR.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "range-squeeze",
        rules: "1. Tight Asian session consolidation (< 30 pips Forex / < 100 pips Gold)\n2. Set price alerts at range boundaries\n3. Wait for M15 candle body close outside range with surging volume\n4. Execute in breakout direction",
        ruleItems: [
            {
                title: "Tight Asian session consolidation (< 30 pips Forex / < 100 pips Gold)",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Set price alerts at range boundaries",
                category: "MANAGEMENT",
                severity: "LOW",
            },
            {
                title: "Wait for M15 candle body close outside range with surging volume",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Execute in breakout direction with hard stop-loss at midpoint",
                category: "RISK",
                severity: "HIGH",
            },
        ],
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
        name: "Supply / Demand Zone Flip (SBR / RBS)",
        description:
            "Trade structural polarity when strong demand fails via Marubozu displacement and flips into fresh supply (or vice-versa).",
        formula: "HTF S&D Zone → Marubozu Displacement Break → Refined Flipzone Limit",
        commonTrap:
            "Knife-catching a broken support zone after a violent dump instead of waiting for the pullback to short the newly flipped resistance.",
        style: "Intraday",
        market: "Forex & Gold",
        schematicType: "supply-demand-flip",
        rules: "1. Identify high-timeframe H1/H4 Supply/Demand zone\n2. Clean displacement through zone with Marubozu momentum\n3. Mark structural flip zone (Demand to Supply)\n4. Wait for pullback test and M15 confirmation",
        ruleItems: [
            {
                title: "Identify high-timeframe H1/H4 Supply/Demand zone",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Clean displacement through zone with Marubozu momentum",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Mark structural flip zone (Demand to Supply)",
                category: "MANAGEMENT",
                severity: "MEDIUM",
            },
            {
                title: "Wait for pullback test and M15 confirmation",
                category: "ENTRY",
                severity: "HIGH",
            },
        ],
        color: "#14B8A6",
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
        name: "ICT Silver Bullet Macro Scalp",
        description:
            "Precision execution during ICT Silver Bullet 60-minute windows (10:00–11:00 AM NY / 03:00–04:00 AM London) targeting 1m/5m FVGs.",
        formula: "Macro Killzone (10–11 NY) → Session BSL/SSL Raid → M1/M5 FVG Limit",
        commonTrap:
            "Taking Silver Bullet FVG setups outside the strict 60-minute macro window when institutional algorithmic delivery is inactive.",
        style: "Scalp",
        market: "Forex & Gold",
        schematicType: "silver-bullet",
        rules: "1. Trade exclusively inside designated Silver Bullet window\n2. Sweep of nearest session liquidity pool (BSL / SSL)\n3. Displacement creating clean Fair Value Gap (FVG)\n4. Set limit entry inside FVG",
        ruleItems: [
            {
                title: "Trade exclusively inside designated Silver Bullet window",
                category: "SESSION",
                severity: "HIGH",
            },
            {
                title: "Sweep of nearest session liquidity pool (BSL / SSL)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Displacement creating clean Fair Value Gap (FVG)",
                category: "ENTRY",
                severity: "HIGH",
            },
            {
                title: "Set limit entry inside FVG with hard invalidation stop",
                category: "ENTRY",
                severity: "HIGH",
            },
        ],
        color: "#06B6D4",
        setupType: "Scalp",
        timeframes: ["M5", "M1"],
        pairs: ["XAUUSD", "EURUSD", "US30"],
        idealEntry: "Fair Value Gap (FVG) discount/premium midpoint",
        idealStopLoss: "Beyond displacement candle swing extreme",
        idealTakeProfit: "Target 10-15 pips or nearest opposing liquidity pool",
        riskRewardMin: 2.0,
        referenceImages: [],
    },
];
