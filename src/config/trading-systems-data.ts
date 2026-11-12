import { Bot, SlidersHorizontal, Layers, LucideIcon } from "lucide-react";

export interface SystemParameter {
    name: string;
    defaultValue: string;
    description: string;
    group?: string;
    range?: string;
}

export interface SystemFaq {
    question: string;
    answer: string;
}

export interface SystemMetrics {
    winRate: string;
    profitFactor: string;
    maxDrawdown: string;
    monthlyAvg: string;
    verifiedLink: string;
}

export interface SystemFunction {
    title: string;
    desc: string;
}

export interface SystemSetupStep {
    step: string;
    title: string;
    desc: string;
}

export interface SystemRiskControl {
    title: string;
    desc: string;
}

export interface SystemSpecHighlight {
    label: string;
    value: string;
}

export interface SystemData {
    slug: string;
    title: string;
    description: string;
    longDescription: string;
    type: "AUTO_TRADE" | "SEMI_AUTO" | "MANUAL_ASSIST" | "INDICATOR";
    platform: "MT5" | "BOTH";
    icon: LucideIcon;
    targetAsset: string;
    strategyStyle: string;
    recommendedLeverage: string;
    setupDifficulty: string;
    specHighlights: SystemSpecHighlight[];
    accentRing: string;
    version?: string;
    bullets: string[];
    parameters: SystemParameter[];
    logic: string[];
    faqs: SystemFaq[];
    metrics?: SystemMetrics;
    functions: SystemFunction[];
    setupSteps: SystemSetupStep[];
    riskControls: SystemRiskControl[];
    colorTheme: "gold" | "blue" | "emerald";
}

export const TRADING_SYSTEMS_DATA: SystemData[] = [
    {
        slug: "goldscalperninja",
        title: "GoldScalperNinja EA",
        version: "v3.1",
        description:
            "Automated MT5 gold architecture with price-chasing stop entries, D1 Trend Master compass, and Lot–Price distance filtering.",
        longDescription:
            '<div class="flex-1 flex flex-col justify-between gap-2.5"><p><strong class="text-gold">Version 3.1 — The Five Weapons Architecture</strong></p><p class="text-xs text-gray-500 dark:text-gray-400">GoldScalperNinja v3.1 is an automated, high-probability gold execution engine designed to eliminate the three classic grid failure modes on XAUUSD: catching falling knives, carrying trapped counter-trend chains, and exhausting margin during sustained one-way surges.</p><div class="flex-1 flex flex-col justify-between gap-2 py-1"><p>— <strong class="text-gold">Weapon 01: Stop Orders That Chase Price</strong> — Uses trailing Buy Stop and Sell Stop orders that follow price movements and only trigger when price confirms a micro-reversal rebound by at least the minimum distance, eliminating falling-knife entries.</p><p>— <strong class="text-gold">Weapon 02: Two-Phase Pruning Engine</strong> — Rolling recovery algorithm executed in two strict sequential phases: Phase 1 banks scalp profits and verifies execution; Phase 2 uses those gains to prune the oldest negative orders one-by-one with net positive capital protection.</p><p>— <strong class="text-gold">Weapon 03: Trend Master D1 Daily Compass</strong> — Reads daily price action at the D1 candle open to project TM Upper, TM Open D1, and TM Lower dynamic bands scaled to ADR, enforcing directional gates and activating trend-locking debt cleanup.</p><p>— <strong class="text-gold">Weapon 04: Lot–Price Distance Filter (v3.1)</strong> — Mathematical ladder guard enforcing that larger volume orders always sit at more favorable prices than smaller orders, while automatically blocking duplicate fills and order clustering during high-volatility spikes.</p><p>— <strong class="text-gold">Weapon 05: Neon Control Panel &amp; Mobile Remote</strong> — Live visual telemetry interface with 7 color-coded status zones, one-click manual overrides, and remote MT5 mobile control via pending orders at price 999.00.</p></div><p class="font-bold text-gold">Engineered for cold risk math, strict stop-loss discipline, and drawdown preservation.</p></div>',
        type: "AUTO_TRADE",
        platform: "MT5",
        icon: Bot,
        targetAsset: "XAUUSD (Gold)",
        strategyStyle:
            "Price Action & Momentum Scalping with Trend Master D1 & Lot-Price Distance Filter",
        recommendedLeverage: "1:100 or higher",
        setupDifficulty: "Easy (5 min)",
        specHighlights: [
            { label: "Primary Asset", value: "XAUUSD (100-oz Gold)" },
            { label: "Primary Timeframe", value: "Any chart TF (D1 Trend Master bias)" },
            { label: "Entry Modes", value: "Stop, StopLimit, or Virtual Stop (VPO)" },
            {
                label: "Distance Filter",
                value: "Lot-Price ladder & duplicate guard (v3.1)",
            },
            {
                label: "Remote Control",
                value: "MT5 mobile pending order at 999.00",
            },
            {
                label: "Safety Stack",
                value: "5-layer brakes: Caps, Global SL, Daily limits, News, Safe close",
            },
        ],
        accentRing: "ring-gold/20",
        bullets: [
            "Stop orders that chase price on turn (no falling knife)",
            "Two-phase pruning: profit banked before cutting debt",
            "Lot–Price distance filter & duplicate guard (v3.1)",
            "D1 Trend Master daily compass & trend locking",
            "Neon interactive HUD & mobile remote switch",
        ],
        parameters: [
            // Identity
            {
                group: "Identity",
                name: "Magic",
                defaultValue: "888",
                description:
                    "Unique EA order identification tag on the symbol.",
            },
            // Group 1A: Direction & Permission
            {
                group: "1A: Order Direction",
                name: "Trade direction mode",
                defaultValue: "Auto Trend Master",
                description:
                    "Master direction mode: Auto Trend Master, Only BUY, Only SELL, or BUY & SELL.",
            },
            {
                group: "1A: Order Direction",
                name: "Allow entries in trend direction",
                defaultValue: "false",
                description:
                    "When true, permits adding grid orders with the trend beyond best open price.",
            },
            {
                group: "1A: Order Direction",
                name: "Global permission to open BUY",
                defaultValue: "true",
                description:
                    "Hard switch lock. If false, EA never opens BUY orders regardless of panel buttons.",
            },
            {
                group: "1A: Order Direction",
                name: "Global permission to open SELL",
                defaultValue: "true",
                description:
                    "Hard switch lock. If false, EA never opens SELL orders regardless of panel buttons.",
            },
            // Group 1B: Entry & Grid Spacing
            {
                group: "1B: Entry & Grid Spacing",
                name: "Entry mode",
                defaultValue: "Stop orders",
                description:
                    "Execution style: Stop orders (server stop), StopLimit orders, or Virtual stop (VPO stealth).",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "First grid step (points)",
                defaultValue: "40",
                description:
                    "Distance in points from market price for placing the initial pending stop order.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Minimum distance between orders (points)",
                defaultValue: "50",
                description:
                    "Required rebound distance from market price before an averaging order fills.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Grid step (points)",
                defaultValue: "50",
                description:
                    "Standard price spacing interval from worst open position for averaging orders.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Min distance after MaxTrade (points)",
                defaultValue: "50",
                description:
                    "Widened rebound distance enforced once open order count exceeds threshold.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Grid step after MaxTrade (points)",
                defaultValue: "50",
                description:
                    "Widened grid spacing for deeper chain recovery levels after threshold.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Threshold before switching to Step1",
                defaultValue: "5",
                description:
                    "Open order count threshold before transitioning to widened two-speed grid spacing.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Trail pending orders by price (points)",
                defaultValue: "40",
                description:
                    "Price tracking distance for trailing pending stop orders down on drops or up on rallies.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Enable aggressive mode",
                defaultValue: "false",
                description:
                    "Keeps secondary stop orders and re-centers lagging orders in fast trends.",
            },
            {
                group: "1B: Entry & Grid Spacing",
                name: "Deviation for virtual stop DEAL",
                defaultValue: "5",
                description:
                    "Maximum slippage in points accepted when virtual stop executes a market deal.",
            },
            // Group 1C: Lot Sizing & Lot Caps
            {
                group: "1C: Lot Sizing & Caps",
                name: "Initial lot size",
                defaultValue: "0.01",
                description:
                    "Base trade volume of the first scout order in every chain.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Additive lot multiplier",
                defaultValue: "0.0",
                description:
                    "Fixed additive lot increment added per tier level.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Exponential lot multiplier",
                defaultValue: "1.5",
                description:
                    "Exponential multiplier applied per tier (Styles A-D). Primary risk lever.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Orders per tier (lot step levels)",
                defaultValue: "2",
                description:
                    "Number of orders sharing identical volume before advancing to next tier.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Enable per-order lot cap",
                defaultValue: "false",
                description:
                    "Enforces a maximum volume ceiling on any single order.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Max lot per single order",
                defaultValue: "1.0",
                description:
                    "Maximum permitted volume for any single order when cap is enabled.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Enable total lot cap",
                defaultValue: "false",
                description:
                    "Rejects orders that would cause combined BUY + SELL volume to exceed cap.",
            },
            {
                group: "1C: Lot Sizing & Caps",
                name: "Max total lot (both sides)",
                defaultValue: "10.0",
                description:
                    "Hard ceiling on combined open volume across both BUY and SELL chains.",
            },
            // Group 2: Distance Filter (NEW v3.1)
            {
                group: "2: Distance Filter (v3.1)",
                name: "Distance filter mode",
                defaultValue: "Block the order",
                description:
                    "Ladder guard mode: Block the order (default), Reduce lot to fit the ladder, or Off.",
            },
            {
                group: "2: Distance Filter (v3.1)",
                name: "Filter distance in points (0 = use side Step)",
                defaultValue: "0",
                description:
                    "Minimum separation enforcing ladder rule and duplicate rejection. 0 auto-syncs with grid step.",
            },
            // Group 3: Target Loss & Trailing Management
            {
                group: "3: Exits & Trailing",
                name: "Chain take profit ($)",
                defaultValue: "10.0",
                description:
                    "Combined BUY + SELL basket profit target in USD closing all open positions and pending orders.",
            },
            {
                group: "3: Exits & Trailing",
                name: "Global stop loss BUY+SELL ($, 0 = off)",
                defaultValue: "0.0",
                description:
                    "Emergency circuit breaker cutting all positions at dollar drawdown threshold. 0 = off.",
            },
            {
                group: "3: Exits & Trailing",
                name: "Trailing mode",
                defaultValue: "0",
                description:
                    "Trailing SL mode: 0=off, 1=candle low/high, 2=fractal, >2=fixed points behind average.",
            },
            {
                group: "3: Exits & Trailing",
                name: "Trailing step (points)",
                defaultValue: "0",
                description:
                    "Minimum price movement required before adjusting trailing stop-loss.",
            },
            {
                group: "3: Exits & Trailing",
                name: "Min profit to start trailing (points)",
                defaultValue: "0",
                description:
                    "Minimum locked profit in points before trailing stop-loss engages.",
            },
            // Group 4: Pruning
            {
                group: "4: Advanced Pruning",
                name: "Enable sequence pruning",
                defaultValue: "true",
                description:
                    "Master switch for same-side rolling recovery and trend clean-up debt trimming.",
            },
            {
                group: "4: Advanced Pruning",
                name: "Enable cross-side pruning",
                defaultValue: "true",
                description:
                    "Permits with-trend winners to prune counter-trend losers near D1 volatility bands.",
            },
            // Group 5: Daily Limits
            {
                group: "5: Daily Limits",
                name: "Daily profit target $ (0=off)",
                defaultValue: "0.0",
                description:
                    "Daily closed + open profit target in USD. Closes basket and halts trading until next server day.",
            },
            {
                group: "5: Daily Limits",
                name: "Daily max loss $ (0=off)",
                defaultValue: "0.0",
                description:
                    "Daily max drawdown limit in USD. Closes basket and halts trading until next server day.",
            },
            // Group 6: News Filter
            {
                group: "6: News Filter",
                name: "Enable news filter",
                defaultValue: "true",
                description:
                    "Reads MT5 economic calendar 24h ahead for high-impact USD events to pause new cycle initialization.",
            },
            // Group 7: Safe Close
            {
                group: "7: Safe Close",
                name: "Enable safe close mode",
                defaultValue: "false",
                description:
                    "Automatically liquidates small drawdowns and halts EA during unsafe states (news, out-of-session, cycle off).",
            },
            {
                group: "7: Safe Close",
                name: "Max allowed floating loss to cut ($, negative)",
                defaultValue: "-200.0",
                description:
                    "Deepest loss safe close will cut (e.g. -$150 is cut; -$300 is held to prevent selling the bottom).",
            },
            // Group 8: Schedule
            {
                group: "8: Trading Schedule",
                name: "Session 1",
                defaultValue: "00:00-23:59",
                description:
                    "Primary daily operating window in broker server time (HH:MM-HH:MM).",
            },
            // Group 9: Remote Control
            {
                group: "9: Remote Control",
                name: "Remote_1 (Turn OFF bot)",
                defaultValue: "Sell Stop at 999.00",
                description:
                    "Place a Sell Stop pending order at price 999.00 from MT5 mobile app to halt the EA remotely.",
            },
            {
                group: "9: Remote Control",
                name: "Remote_2 (Turn ON bot)",
                defaultValue: "Buy Limit at 999.00",
                description:
                    "Place a Buy Limit pending order at price 999.00 from MT5 mobile app to resume the EA remotely.",
            },
            // Group 10: Panel
            {
                group: "10: Panel Settings",
                name: "Panel X position",
                defaultValue: "1090",
                description:
                    "Chart X coordinate in pixels. Set -1 to auto-dock to right edge, or 10 to dock left.",
            },
            {
                group: "10: Panel Settings",
                name: "Panel Y position",
                defaultValue: "25",
                description:
                    "Chart Y coordinate in pixels from top edge.",
            },
        ],
        logic: [
            "Step 1 (Gate Check): Evaluates Schedule, News Filter, Daily Limits, Cycle State (RUNNING), and License before opening a new cycle.",
            "Step 2 (Scout Order): Places a Buy Stop at First grid step above price or Sell Stop below price with Initial lot size.",
            "Step 3 (Price Chasing): Pending stops trail price as it runs (Trail pending orders), only executing when price rebounds by Minimum distance.",
            "Step 4 (Controlled Ladder): Adds averaging orders at intervals of at least Grid step, strictly enforced by the Lot–Price distance filter.",
            "Step 5 (Two-Phase Pruning): Banks profit from fresh scalp positions first, then cuts oldest negative orders one-by-one with positive net cushion.",
            "Step 6 (Basket Close): When combined BUY + SELL floating profit reaches Chain take profit ($), all open positions close simultaneously.",
            "Trend Master D1: Projects daily TM Upper, TM Open D1, and TM Lower bands from yesterday's range and ADR, locking counter-trend sides ([LOCK BUY] / [LOCK SELL]).",
            "Lot Sizing Styles: Supports 5 progression styles (A: Default 1.5/2, B: Firm 1.3/2, C: Balanced 1.3/3, D: Gentle 1.2/3, E: Straight Line additive).",
        ],
        faqs: [
            {
                question: "How does the Trend Master D1 daily compass work?",
                answer: "At the open of every D1 candle, Trend Master reads daily price action and calculates TM Upper, TM Open D1, and TM Lower bands scaled to the Average Daily Range (ADR). Above TM Upper (UP 100%), only BUY orders are permitted. Below TM Lower (DOWN 0%), only SELL orders are permitted. In the middle zone (~50%), both directions operate simultaneously. If price trends persistently, it engages [LOCK BUY] or [LOCK SELL] and activates trend clean-up pruning.",
            },
            {
                question: "What is Two-Phase Pruning and how does it prevent trapped chains?",
                answer: "Classic grid systems fail because they wait for complete market reversals. Two-Phase Pruning executes in two strict stages: Phase 1 banks profit from fresh scalp positions and waits for broker execution confirmation. Phase 2 uses that locked-in profit to close the oldest, deepest losing orders one-by-one, ensuring every pruning cycle closes at a net positive profit and brings the basket breakeven closer to market price.",
            },
            {
                question: "What is the Lot–Price distance filter introduced in v3.1?",
                answer: "The Lot–Price distance filter enforces a mathematical ladder rule: a larger lot size must always sit at least 'Filter distance' points at a more favorable price than every smaller order on its side (lower for BUY, higher for SELL). It also blocks duplicate orders within the filter distance, eliminating accidental cluster fills during high-volatility spikes.",
            },
            {
                question: "How do I control or shut down the EA from my phone?",
                answer: "You can control the EA remotely without accessing your VPS desktop by placing a pending order on XAUUSD with volume 0.01 at price 999.00: Place a Sell Stop at 999.00 to turn the EA OFF (halts new orders and pruning). Place a Buy Limit at 999.00 to turn the EA ON (resumes normal cycles). The EA automatically deletes the trigger order after executing the command.",
            },
            {
                question: "Why does v3.1 use WebRequest instead of DLL imports for licensing?",
                answer: "Version 3.1 eliminates DLL imports entirely for maximum security and compatibility. MT5 connects directly to secure Google Apps Script authorization endpoints via native WebRequest. You simply add https://script.google.com and https://script.googleusercontent.com in MT5 Tools -> Options -> Expert Advisors.",
            },
            {
                question: "What should I do if the EA displays 'License: NOT REGISTERED' or fails to trade?",
                answer: "First, verify that your account ID shown in the panel's Status box has been authorized by your broker or partner admin. Second, ensure 'Allow WebRequest for listed URL' has both Google Script endpoints added. Third, ensure the toolbar 'Algo Trading' button is green and 'Allow Algo Trading' is checked in the EA Common tab.",
            },
        ],
        metrics: {
            winRate: "68.4%",
            profitFactor: "1.85",
            maxDrawdown: "4.2%",
            monthlyAvg: "4.8% - 7.5%",
            verifiedLink:
                "https://myfxbook.com/members/thenexttrade/goldscalperninja-real/10294815",
        },
        colorTheme: "gold",
        functions: [
            {
                title: "Stop Orders That Chase Price",
                desc: "Trailing Buy Stop and Sell Stop orders follow market movement and execute only on confirmed micro-reversal rebounds, preventing falling-knife entries.",
            },
            {
                title: "Two-Phase Pruning Engine",
                desc: "Sequential rolling recovery that first banks scalp profits and verifies execution, then systematically cuts the oldest trapped orders while maintaining net gain.",
            },
            {
                title: "Trend Master D1 Daily Compass",
                desc: "Macro directional filter reading daily price action at D1 open to set dynamic bias zones (UP 100%, SW, DOWN 0%) and lock counter-trend entries.",
            },
            {
                title: "Lot–Price Distance Filter (v3.1)",
                desc: "Mathematical ladder guard ensuring larger lots always sit at better prices than smaller orders, while automatically blocking duplicate fills.",
            },
            {
                title: "Neon Control Panel & Mobile Remote",
                desc: "Visual dashboard with 7 color-coded telemetry zones, one-click manual overrides, and MT5 mobile remote control via pending orders at price 999.00.",
            },
            {
                title: "5-Layer Safety Brakes & News Radar",
                desc: "Combines MT5 economic calendar news pauses (±15 min around high-impact USD news), daily profit/loss circuit breakers, and hard lot/dollar caps.",
            },
        ],
        setupSteps: [
            {
                step: "01",
                title: "Deploy EA Binary",
                desc: "Copy GoldScalperNinja EA v3.1.ex5 to MT5 -> File -> Open Data Folder -> MQL5 -> Experts, then right-click Navigator and select Refresh.",
            },
            {
                step: "02",
                title: "Authorize WebRequest URLs",
                desc: "Open MT5 -> Tools -> Options -> Expert Advisors. Check 'Allow WebRequest for listed URL' and add https://script.google.com and https://script.googleusercontent.com.",
            },
            {
                step: "03",
                title: "Attach to XAUUSD Chart",
                desc: "Open an XAUUSD chart on any timeframe (M1 to H1 supported). Drag the EA onto the chart.",
            },
            {
                step: "04",
                title: "Enable Algo Trading in Settings",
                desc: "In the EA Common tab, check 'Allow Algo Trading'. In Inputs tab, load or configure your desired preset (.set file) and click OK.",
            },
            {
                step: "05",
                title: "Activate Master Algo Trading",
                desc: "Click the main 'Algo Trading' button on the MT5 top toolbar (ensure the icon turns green).",
            },
            {
                step: "06",
                title: "Verify License & Telemetry",
                desc: "Check the panel status block. It must display 'License: ACTIVE | lifetime'. If 'NOT REGISTERED', copy the account ID shown on the panel to authorize.",
            },
            {
                step: "07",
                title: "Deploy on Low-Latency VPS",
                desc: "Ensure MT5 runs continuously 24/7 on a Windows VPS located near your broker server to prevent execution gaps.",
            },
        ],
        riskControls: [
            {
                title: "Layer 1: Lot Sizing & Volume Caps",
                desc: "Enforce per-order and total open volume caps (both sides) to prevent excessive exposure during extended gold trends.",
            },
            {
                title: "Layer 2: Global Stop Loss ($)",
                desc: "Emergency circuit breaker that closes all open positions and cancels pending orders if combined floating drawdown reaches a defined dollar threshold.",
            },
            {
                title: "Layer 3: Daily Profit & Loss Circuit Breakers",
                desc: "Daily profit targets and max loss limits automatically shut down trading until the next server day upon being triggered.",
            },
            {
                title: "Layer 4: High-Impact News Filter & Sessions",
                desc: "Integrates with MT5 economic calendar to pause new cycle initialization 15 minutes before and after high-impact USD events, alongside server trading schedules.",
            },
            {
                title: "Layer 5: Safe Close & Remote Emergency Switch",
                desc: "Automatically liquidates small drawdowns during unsafe states, and allows instant emergency shutdown from iOS/Android MT5 by placing a Sell Stop at 999.00.",
            },
        ],
    },
    {
        slug: "trade-manager",
        title: "GSN Trade Manager",
        version: "v2.0",
        description:
            "5-Tab MT5 Command Deck for 1-click split-TP scalping, institutional Volume Profile (POC/VAH/VAL), 42-signal MTF trend matrix, Smart DCA recovery, and on-demand cloud sync.",
        longDescription:
            '<div class="flex-1 flex flex-col justify-between gap-2"><p><strong class="text-gold">Version 2.0 — 5-Tab MT5 Execution &amp; Risk Command Deck</strong></p><p class="text-xs text-gray-500 dark:text-gray-400">GSN Trade Manager v2.0 unifies manual split-target execution, institutional Volume Profile auction levels, multi-timeframe trend confluence, and math-driven DCA recovery into a single zero-lag MT5 command deck.</p><div class="flex-1 flex flex-col justify-between gap-1.5 py-0.5"><p>— <strong class="text-gold">Tab 1 (TRADE): Split-TP &amp; Live R:R</strong> — Draggable Entry, SL, and TP1–TP3 lines (3:3:3 split) with live Dollar R:R preview, Auto-BE, and smart TP % trimming.</p><p>— <strong class="text-gold">Tab 2 (S&amp;D ZONE): Volume Profile &amp; Order Blocks</strong> — Live Daily POC Magnet, VAH/VAL walls, and M1–H4 Supply/Demand zones with 1-click POC and Value Area execution.</p><p>— <strong class="text-gold">Tab 3 (TREND): 42-Signal Confluence Matrix</strong> — Scans 6 engines (Sonic R, Structure, SuperTrend, MACD, ADX, VOL-MOM) across M1–D1 for real-time Buy/Sell Power %.</p><p>— <strong class="text-gold">Tab 4 (SEMI): Smart DCA, BE Lot &amp; Shield</strong> — Dual-mode recovery (Martingale or BE Lot solver) inside a draggable Zone Box with Mobile DCA and Smart Shield hedging.</p><p>— <strong class="text-gold">Tab 5 (SYNC): Zero-Lag Cloud Audit</strong> — On-demand deal synchronization (Today to Custom Range) via personal API key with zero background chart lag.</p></div><p class="font-bold text-gold">Engineered for cold risk math, fast visual execution, and controlled recovery.</p></div>',
        type: "MANUAL_ASSIST",
        platform: "MT5",
        icon: SlidersHorizontal,
        targetAsset: "XAUUSD (Gold) & All MT5 Symbols",
        strategyStyle: "5-Tab Manual Split-TP, Volume Profile & Smart DCA Deck",
        recommendedLeverage: "1:100 or higher",
        setupDifficulty: "Easy (10 min)",
        specHighlights: [
            { label: "Architecture", value: "5-Tab Command Deck (TRADE, S&D, TREND, SEMI, SYNC)" },
            { label: "Volume Profile", value: "Daily POC Magnet, VAH/VAL & M1–H4 Order Blocks" },
            { label: "Confluence Engine", value: "42-Signal Matrix (6 Engines × 7 Timeframes)" },
            { label: "Recovery & Defense", value: "BE Lot Solver, Draggable Zone Box & Smart Shield" },
        ],
        accentRing: "ring-blue-500/15 dark:ring-blue-400/15",
        bullets: [
            "3-Target Split-TP (TP1–TP3), Live Dollar R:R & Smart Partial Trim",
            "Institutional Volume Profile (POC, VAH, VAL) & Order Blocks",
            "42-Signal MTF Confluence Matrix (Sonic R, Structure, SuperTrend, MACD, ADX, VOL-MOM)",
            "Dual-Mode Smart DCA (Martingale vs. BE Lot), Zone Box & Smart Shield",
            "MOBILE DCA Phone Adoption & Zero-Lag On-Demand Cloud Sync",
        ],
        parameters: [
            // Tab 1: TRADE
            {
                group: "Tab 1: Manual Split-TP & Risk",
                name: "Lot Size",
                defaultValue: "0.07",
                description:
                    "Total manual position size stepped via [-]/[+] and divided across active TP1–TP3 weight boxes.",
            },
            {
                group: "Tab 1: Manual Split-TP & Risk",
                name: "TP1 / TP2 / TP3 Weight Split",
                defaultValue: "3 | 3 | 3",
                description:
                    "Proportional volume weights dividing total lot across 3 targets (3:3:3 = 33.3% each; set any box to 0 to disable).",
            },
            {
                group: "Tab 1: Manual Split-TP & Risk",
                name: "Zone (pips)",
                defaultValue: "70",
                description:
                    "Default planning zone width in pips (on 2-decimal XAUUSD, 10 pips = 100 points = $1.00 USD price move).",
            },
            {
                group: "Tab 1: Manual Split-TP & Risk",
                name: "Max Risk (%)",
                defaultValue: "50.0% (15.0% Recommended)",
                description:
                    "Maximum permitted account equity risk percentage audited against live SL Loss % before firing.",
            },
            {
                group: "Tab 1: Manual Split-TP & Risk",
                name: "BE Offset (pips)",
                defaultValue: "0",
                description:
                    "Extra profit offset in pips added above/below entry when locking Breakeven via SL -> BE or Auto-BE.",
            },
            {
                group: "Tab 1: Manual Split-TP & Risk",
                name: "TP % (Smart Partial Trim)",
                defaultValue: "20",
                description:
                    "Percentage of open volume shaved starting from the heaviest loser or smallest winner first when clicking TP BUY or TP SELL.",
            },
            // Tab 4: SEMI
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "DCA Recovery Mode",
                defaultValue: "MODE: MARTINGALE MULTIPLIER / MODE: BE LOT",
                description:
                    "Toggles between fixed lot multiplier scaling and Break-Even Lot solver (solves exact lot needed so a BE Retrace Pips bounce closes basket at BE + $1.00).",
            },
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "Starting Lot",
                defaultValue: "0.05 (0.01 Safe Start)",
                description:
                    "Seed volume for Order #1 of a Semi-Auto DCA sequence. Every recovery layer scales from this base.",
            },
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "Multiplier / BE Retrace Pips",
                defaultValue: "1.50 (1.20x–1.35x Recommended)",
                description:
                    "Fixed lot multiplier in Martingale mode, or target retrace distance in pips when operating in MODE: BE LOT.",
            },
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "DCA Step (Pips)",
                defaultValue: "30",
                description:
                    "Minimum adverse distance in pips ($3.00 USD on Gold) required before adding the next recovery order.",
            },
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "Zone Range (Pips)",
                defaultValue: "142",
                description:
                    "Height in pips of the draggable on-chart TRADE BY ZONE rectangle where DCA orders are permitted to fire.",
            },
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "Target TP / Target SL (0=Off)",
                defaultValue: "30 / 100",
                description:
                    "Unified basket Take-Profit in pips (Yellow Combined TP line) and hard catastrophe Stop-Loss in pips from initial entry.",
            },
            {
                group: "Tab 4: Smart DCA, BE Lot & Shield",
                name: "Max Single Lot & Max Basket Lot",
                defaultValue: "0.50 / 2.00",
                description:
                    "Mandatory prop-firm volume caps limiting any single recovery order (0.50) and total cumulative open basket volume (2.00).",
            },
            // Part III: F7 Inputs
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Enable Hotkeys (B, S, X, E)",
                defaultValue: "true",
                description:
                    "Enables single-key chart shortcuts: B = BUY NOW, S = SELL NOW, X = CLOSE ALL, E = Move SL to Breakeven.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Auto BE when TP1 hit",
                defaultValue: "true",
                description:
                    "Automatically moves the Stop Loss of remaining TP2 and TP3 split tickets to entry (+ BE Offset) as soon as TP1 closes in profit.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Auto Close Pending Orders on TP1 hit",
                defaultValue: "true",
                description:
                    "Deletes any unfilled pending orders from the same setup once price reaches TP1 so stale orders cannot fill late on a reversal.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Auto Move SL to TP1 when TP2 hit",
                defaultValue: "false",
                description:
                    "When enabled, once price hits TP2, the Stop Loss of the final TP3 runner is trailed to the TP1 price level to lock in profit.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Enable Daily Trading Limits (Max Loss / Gain %)",
                defaultValue: "false (2.0% Loss / 3.0% Gain)",
                description:
                    "Circuit breaker tracking daily equity change from server midnight (defaults to 2.0% Max Daily Loss and 3.0% Max Daily Gain when ON).",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Enable Trail SL by Candle High/Low",
                defaultValue: "false (Lookback = 1, Buffer = 3p)",
                description:
                    "Trails the Stop Loss of manual trades behind the previous closed candle's High/Low plus a 3-pip safety buffer.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Enable Lock Profit (step trailing)",
                defaultValue: "false",
                description:
                    "4-stage profit ratchet for news runners: at +30p locks +10p; at +60p locks +30p; at +100p locks +60p; at +150p locks +100p.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Default SL / TP1 / TP2 / TP3 (pips)",
                defaultValue: "110 / 50 / 100 / 200",
                description:
                    "Initial pip distances projected onto the chart when clicking GET BUY or GET SELL on Tab 1.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Semi Auto DCA: Magic Number vs. Magic Number",
                defaultValue: "123457 / 123456",
                description:
                    "Isolates Tab 4 Semi-Auto DCA baskets (123457) from Tab 1 Manual Scalping orders (123456) so manual trims never interfere with DCA math.",
            },
            {
                group: "F7 Inputs: Automation & Protection",
                name: "Enable Trailing TP for Semi-Auto Grid",
                defaultValue: "false (5.0 pips)",
                description:
                    "Instead of closing the DCA basket the instant it touches Target TP, trails the basket exit behind price by 5.0 pips to capture oversized bounces.",
            },
        ],
        logic: [
            "Tab 1 (TRADE) Split-TP & Live Dollar R:R Engine: Projects draggable ENTRY, SL, and TP1–TP3 lines onto the chart, previews exact dollar risk/reward before firing, splits volume across 3|3|3 weights, and auto-moves remaining stops to Breakeven once TP1 banks.",
            "Smart Partial Trimming (TP %): Clicking TP BUY or TP SELL sorts open orders on that side by floating profit ascending and shaves volume starting from the heaviest loser or smallest winner first—freeing margin while keeping your best runners alive.",
            "Tab 2 (S&D ZONE) Institutional Volume Profile & Order Blocks: Computes live session horizontal volume distribution to map the Daily POC Magnet (fair-value node), VAH (upper 70% rejection wall), and VAL (lower 70% support wall) alongside unmitigated M1–H4 Supply/Demand Order Blocks.",
            "Tab 3 (TREND) 42-Signal Equal-Weight Confluence Matrix: Scans 6 institutional engines (Sonic R 34/89 EMA Dragon, Swing BOS/CHoCH Structure, SuperTrend ATR, MACD Impulse, ADX Strength, VOL-MOM) across 7 timeframes (M1–D1), aggregating active BUY vs. SELL votes into Buy/Sell Power % and D1 Dominance.",
            "Tab 4 (SEMI) Dual-Mode Recovery & Yellow Combined TP Line: Tracks volume-weighted basket breakeven via an on-chart Yellow Line. In MODE: BE LOT, dynamically solves the exact next order lot size so a configured pip pullback closes the entire basket at breakeven + $1.00.",
            "Interactive Zone Box, MOBILE DCA & Smart Shield Hedge: Restricts recovery orders inside a draggable TRADE BY ZONE rectangle, adopts manual MT5 Mobile phone trades (Magic 0) when MOBILE DCA is ON, and arms a protective opposite Stop order at the zone edge (SMART SHIELD: ON) that closes hedged BUY + SELL baskets at +$1.00 net profit.",
        ],
        faqs: [
            {
                question: "How does Smart Partial Close (TP %) choose which positions to trim first?",
                answer: "When you enter a percentage (e.g., 20%) and click TP BUY or TP SELL on Tab 1, the engine sorts all open orders on that side by floating profit ascending and shaves volume starting from the heaviest loser or smallest winner first. This reduces deep-zone margin drag while keeping your best runners alive.",
            },
            {
                question: "Why is MODE: BE LOT (RECOVERY) smarter than a fixed 1.5x Martingale multiplier?",
                answer: "Fixed exponential multipliers (1.5x–2.0x) accelerate violently after order #8. In MODE: BE LOT, the Multiplier input becomes BE Retrace Pips and mathematically solves for the exact lot size required so a fixed pullback (e.g., 60 pips) brings the entire basket to breakeven + $1.00 USD.",
            },
            {
                question: "How do TRADE BY ZONE and SMART SHIELD protect my basket during runaway Gold trends?",
                answer: "Clicking TRADE BY ZONE draws a draggable price rectangle on your chart; DCA recovery orders are only permitted inside those boundaries. When SMART SHIELD: ON is active, the EA places a protective opposite Stop order at the outer edge of the Zone Box to lock net exposure on a breakout, then closes the entire BUY + SELL basket as soon as combined profit reaches +$1.00 USD (including spread, swap, and commission).",
            },
            {
                question: "How should I trade the Daily POC, VAH, and VAL on Tab 2 (S&D ZONE)?",
                answer: "Following Institutional Auction Market Theory: never open new trades right on top of the DAILY POC (MAGNET)—use SNAP TP TO POC to set it as your primary Take-Profit target. Look for Long entries when an unmitigated M15/H1 DEMAND zone overlaps VAL (Support Wall), and look for Short entries when an M15/H1 SUPPLY zone overlaps VAH (Rejection Wall) using LIMIT AT VALUE AREA.",
            },
            {
                question: "Why is Tab 5 (SYNC) 100% manual-only, and what is the $200 balance requirement?",
                answer: "Closed deals are uploaded only when you click one of the 8 sync buttons on Tab 5 (Today, Last 3 Days, Last Week, Last Month, 3M, 6M, Entire History, or Sync Selected Range)—never in the background during fast scalping ticks, guaranteeing zero chart lag. Cloud telemetry enforces a $200 USD minimum balance gate on Real accounts (Demo accounts have no balance minimum).",
            },
            {
                question: "What happens to my open trades if the internet drops or a license check fails?",
                answer: "The 3-tier license engine verifies your MT5 account via the primary server, GitHub backup list, and a 72-hour signed local offline cache. Even if a license shows EXPIRED or NETWORK ERROR, the EA never abandons open trades—it only blocks new initial entries while continuing to manage existing positions and recovery baskets safely.",
            },
        ],
        colorTheme: "blue",
        functions: [
            {
                title: "Precision 3-Target Split & Partial Trim",
                desc: "Project draggable Entry, SL, and TP1–TP3 lines (3:3:3 weights) with a live Dollar R:R bar, Auto-BE on TP1 hit, and smart TP % partial shaving.",
            },
            {
                title: "Institutional Volume Profile & POC Magnet",
                desc: "Map unmitigated M1–H4 Supply/Demand Order Blocks alongside the live Daily POC Magnet, VAH Rejection Wall, and VAL Support Wall.",
            },
            {
                title: "42-Signal MTF Confluence Matrix",
                desc: "Scan 6 institutional engines (Sonic R, Structure, SuperTrend, MACD, ADX, VOL-MOM) across 7 timeframes (M1–D1) with Buy/Sell Power %.",
            },
            {
                title: "Dual-Mode Smart DCA & BE Lot Solver",
                desc: "Switch between fixed Martingale Multiplier and MODE: BE LOT (RECOVERY) to solve the exact lot needed to close baskets at BE + $1.00.",
            },
            {
                title: "Draggable Zone Box & Smart Shield",
                desc: "Confine DCA recovery inside an interactive on-chart Zone Box and arm SMART SHIELD breakout hedging for automatic +$1.00 net exits.",
            },
            {
                title: "Mobile DCA Adoption & On-Demand Sync",
                desc: "Adopt manual MT5 phone trades automatically via MOBILE DCA on your VPS, and batch-upload closed deals via Tab 5 SYNC with zero tick lag.",
            },
        ],
        setupSteps: [
            {
                step: "01",
                title: "Copy the EA File",
                desc: "In MT5, click File -> Open Data Folder -> MQL5 -> Experts. Paste the compiled GoldScalperNinja - TradeManager.ex5 file, then right-click Expert Advisors in Navigator and select Refresh.",
            },
            {
                step: "02",
                title: "Allow WebRequest URLs",
                desc: "Open Tools -> Options -> Expert Advisors. Tick Allow Algorithmic Trading and Allow WebRequest for listed URL, then add https://raw.githubusercontent.com/ and https://api.github.com (plus your dashboard URL for Tab 5 SYNC).",
            },
            {
                step: "03",
                title: "Open a Clean XAUUSD Chart",
                desc: "Open a clean XAUUSD chart (M5 or M15 recommended). Keep one Trade Manager instance per symbol/Magic pair.",
            },
            {
                step: "04",
                title: "Attach to Chart & Verify Inputs",
                desc: "Drag GoldScalperNinja - TradeManager onto the chart. In the Common tab, tick Allow Algorithmic Trading. In the Inputs tab, keep the defaults (Magic 123456 / Semi-Auto Magic 123457) and click OK.",
            },
            {
                step: "05",
                title: "Turn On Master Algo Trading",
                desc: "Confirm the Algo Trading button on the top MT5 toolbar is green.",
            },
            {
                step: "06",
                title: "Verify 5-Tab Panel & License",
                desc: "Confirm all 5 workspaces (TRADE, S&D ZONE, TREND, SEMI, SYNC) switch smoothly and no license warning pop-up appears.",
            },
            {
                step: "07",
                title: "Run on a 24/7 Windows VPS",
                desc: "Whenever using Tab 4 (SEMI) DCA, MOBILE DCA phone adoption, or SMART SHIELD breakout hedging, run MT5 on a 24/7 VPS close to your broker's server.",
            },
        ],
        riskControls: [
            {
                title: "Rule 1: Lock Max Single & Basket Lot Caps",
                desc: "Never leave Max Single Lot (0.50) or Max Basket Lot (2.00) uncapped (0) on Tab 4. Hard volume ceilings keep deep recovery chains inside prop-firm margin limits.",
            },
            {
                title: "Rule 2: Always Arm Target SL or Smart Shield",
                desc: "Never run an open-ended DCA chain with Target SL = 0 and SMART SHIELD: OFF. Always combine a TRADE BY ZONE box with a catastrophe stop or Smart Shield hedge.",
            },
            {
                title: "Rule 3: Prefer BE Lot or Gentle Multipliers",
                desc: "Exponential multipliers (1.8x–2.0x) accelerate violently after order #8. Use MODE: BE LOT (RECOVERY) or keep multipliers at 1.20x–1.35x with 30–50 pip steps.",
            },
            {
                title: "Rule 4: Never Panic-Close One Hedged Leg",
                desc: "When SMART SHIELD or a recovery basket is working toward the yellow Combined TP/BE line, manually closing only the winning leg leaves the losing leg naked. Use CLOSE ALL DCA.",
            },
            {
                title: "Rule 5: Daily Circuit Breakers & Killzone Discipline",
                desc: "Enable F7 Daily Trading Limits (2.0% Loss / 3.0% Gain), avoid new DCA baskets during the 21:00–01:00 UTC rollover spread window, and practice 4 weeks on Demo before live deployment.",
            },
        ],
    },
    {
        slug: "gsn-shadown-matrix",
        title: "GSN Shadow Matrix",
        version: "v1.0",
        description:
            "Asymmetric Dual Grid & Counter-Hedge XAUUSD engine with 6 M5 seed filters, EMA-34 trend reversal lot braking, Dynamic ATR spacing, and Same-Side Smart Pruning.",
        longDescription:
            '<div class="flex-1 flex flex-col justify-between gap-2.5"><p><strong class="text-gold">Version 1.0 — Asymmetric Dual Grid, Counter-Hedge &amp; Smart Pruning Architecture</strong></p><p class="text-xs text-gray-500 dark:text-gray-400">GSN Shadow Matrix v1.0 is an asymmetric dual-grid and counter-hedge XAUUSD engine built to neutralize one-way gold trends—combining closed-bar M5 seed filters, automatic counter-hedging, and EMA-34 lot braking so counter-trend drawdowns stay flat while trend-aligned positions compound.</p><div class="flex-1 flex flex-col justify-between gap-2 py-1"><p>— <strong class="text-gold">Weapon 01: 6 M5 Seed Filters &amp; Fast First-Order Scalp</strong> — Evaluates closed M5 candle signals across 6 selectable engines (MA, SuperTrend, Ichimoku, ADX+RSI, Bollinger Bands, MACD Trend) and banks fast +90-point ($0.90) single-order scalps before grid expansion.</p><p>— <strong class="text-gold">Weapon 02: Counter-Hedge &amp; M15 Dual Grid</strong> — Locks initial seed drawdown at -250 points (-$2.50) with an opposite Hedge Start position, then expands simultaneous BUY + SELL pairs on new M15 bars every 150 points ($1.50) or adaptive ATR(14) steps.</p><p>— <strong class="text-gold">Weapon 03: Asymmetric Ladder &amp; EMA-34 Reversal Brake</strong> — Scales winning trend orders by 1.05x while halving counter-trend multipliers (×0.50 = 0.80x) against M5 EMA-34, clamping losing counter-trend lots flat at the 0.02 base lot across all 8 tiers.</p><p>— <strong class="text-gold">Weapon 04: Same-Side Smart Pruning (Tier &gt;= 5)</strong> — Pairs newest winners with oldest same-side losers from Tier 5 at +$1.00 net surplus (closing the losing leg first and verifying broker fill) to continuously recycle the 8-tier ceiling.</p><p>— <strong class="text-gold">Weapon 05: 3-View Obsidian HUD &amp; Async Basket Exit</strong> — Features Live Telemetry, direct on-chart Strategy &amp; Risk editing persisted via GlobalVariables, a Monthly Profit Calendar, and parallel OrderSendAsync closure at $50.00 TP.</p></div><p class="font-bold text-gold">Engineered for asymmetric trend compounding, flat counter-trend exposure, and sub-3% equity drawdown.</p></div>',
        type: "AUTO_TRADE",
        platform: "MT5",
        icon: Bot,
        targetAsset: "XAUUSD (Gold)",
        strategyStyle:
            "M5 Seeded Asymmetric Dual Grid, Counter-Hedge & Same-Side Smart Pruning",
        recommendedLeverage: "1:200 or higher",
        setupDifficulty: "Easy (10 min)",
        specHighlights: [
            {
                label: "Seed & Fast Scalp",
                value: "6 M5 Strategy Filters + 90-pt ($0.90) First-Order TP",
            },
            {
                label: "Hedge & Dual Grid",
                value: "250-pt ($2.50) Counter-Hedge + 150-pt M15 Dual Pairs",
            },
            {
                label: "Lot Brake Engine",
                value: "1.05x Win / 1.60x Lose + 50% M5 EMA-34 Reversal Brake",
            },
            {
                label: "Pruning & Ceiling",
                value: "Hard 8-Tier Cap + Tier 5 Same-Side Pruning (+$1.00)",
            },
            {
                label: "Volatility Guard",
                value: "M15 New-Bar Gate + Optional Dynamic ATR(14) Spacing",
            },
            {
                label: "Obsidian 3-View UI",
                value: "Live Telemetry, On-Chart Strategy Edit & Profit Calendar",
            },
        ],
        accentRing: "ring-emerald-500/15 dark:ring-emerald-400/15",
        bullets: [
            "6 selectable M5 seed filters & +90-pt ($0.90) fast first-order scalp",
            "250-pt counter-hedge & 150-pt M15 simultaneous BUY + SELL grid",
            "EMA-34 Trend Reversal Brake keeps counter-trend lots flat at 0.02",
            "Same-Side Smart Pruning (Tier >= 5) & $50.00 OrderSendAsync exit",
            "3-View Obsidian HUD: Live Telemetry, Direct Strategy Edit & Profit Calendar",
        ],
        parameters: [
            // Section 1: General & Persistent On-Chart Controls
            {
                group: "1: General & On-Chart Controls",
                name: "Magic Number (InpMagicNumber)",
                defaultValue: "6868686",
                description:
                    "Unique order identification tag stamped onto every Shadow Matrix position.",
            },
            {
                group: "1: General & On-Chart Controls",
                name: "Entry Signal Strategy (InpFilterType)",
                defaultValue: "MA (EMA/SMA) [0..5]",
                description:
                    "Selectable live on View 1 (2x3 Grid): MA (EMA/SMA), SuperTrend, Ichimoku, ADX + RSI, Bollinger Bands, or MACD Trend. Persisted in MT5 GlobalVariables.",
            },
            {
                group: "1: General & On-Chart Controls",
                name: "Base Lot Size (InpBaseLot)",
                defaultValue: "0.02",
                description:
                    "Tier 1 seed lot size adjustable live on View 1 (±0.01 steppers, range 0.01 – 100.0).",
            },
            {
                group: "1: General & On-Chart Controls",
                name: "Grid Step Distance (InpGridStep)",
                defaultValue: "150",
                description:
                    "Distance in points ($1.50 on Gold) between M15 dual grid tiers, adjustable live on View 1 (±10 pts).",
            },
            {
                group: "1: General & On-Chart Controls",
                name: "Dynamic ATR Grid Spacing (InpUseDynamicATR)",
                defaultValue: "false (OFF / FIXED)",
                description:
                    "Toggles between deterministic 150-point fixed spacing and adaptive volatility spacing (150 + ATR(14) × 1.0).",
            },
            {
                group: "1: General & On-Chart Controls",
                name: "Basket Take Profit $ (InpTPTotal)",
                defaultValue: "50.0",
                description:
                    "Combined floating USD profit target ($50.00) that triggers instant parallel OrderSendAsync basket closure.",
            },
            // Section 2: Money Management
            {
                group: "2: Money Management & EMA-34 Brake",
                name: "Winning Side Multiplier (InpMultWin)",
                defaultValue: "1.05",
                description:
                    "Gentle multiplier applied when price is in profit relative to the newest open order of that direction (rounded up via MathCeil).",
            },
            {
                group: "2: Money Management & EMA-34 Brake",
                name: "Losing Side Multiplier (InpMultLose)",
                defaultValue: "1.60",
                description:
                    "Base multiplier when price is in loss relative to the newest order of that direction, prior to EMA-34 reversal braking.",
            },
            {
                group: "2: Money Management & EMA-34 Brake",
                name: "Reduce Lot on Trend Reversal (InpUseTrendRev)",
                defaultValue: "true",
                description:
                    "Activates the M5 EMA-34 Trend Reversal Brake. Halves the multiplier whenever an order is placed against the M5 EMA-34 trend.",
            },
            {
                group: "2: Money Management & EMA-34 Brake",
                name: "Reversal Reduction Ratio (InpTrendRevMult)",
                defaultValue: "0.50",
                description:
                    "Multiplier reduction factor (50%) when counter-trend: 1.60 × 0.50 = 0.80x, clamping counter-trend losing lots back to Base Lot (0.02).",
            },
            // Section 3: Grid & Hedge Engine
            {
                group: "3: Grid & Hedge Engine",
                name: "Grid Bar Timeframe (InpGridTF)",
                defaultValue: "15 Minutes (PERIOD_M15)",
                description:
                    "New-bar gate for regular dual grid expansion. Prevents opening multiple grid pairs inside a single 60-second news spike candle.",
            },
            {
                group: "3: Grid & Hedge Engine",
                name: "Hedge Distance Points (InpHedgeDist)",
                defaultValue: "250",
                description:
                    "Adverse distance in points ($2.50 on Gold) before a solitary seed order locks drawdown with an opposite 'Hedge Start' position.",
            },
            {
                group: "3: Grid & Hedge Engine",
                name: "Max Grid Tiers Per Direction (InpMaxGridTiers)",
                defaultValue: "8",
                description:
                    "Hard per-side ceiling (max 8 BUY and 8 SELL orders). Blocks further expansion until Same-Side Smart Pruning frees tier capacity.",
            },
            // Section 4: Smart Pruning Defense
            {
                group: "4: Same-Side Smart Pruning",
                name: "Enable Smart Pruning (InpEnablePruning)",
                defaultValue: "true",
                description:
                    "Activates Same-Side Smart Pruning (BUY with BUY, SELL with SELL) to trim tail risk without unbalancing hedge delta.",
            },
            {
                group: "4: Same-Side Smart Pruning",
                name: "Danger Tier Threshold (InpPruneDangerTier)",
                defaultValue: "5",
                description:
                    "Minimum open orders on a single side (>= 5) before pairing the newest winning order with the oldest losing order of that same side.",
            },
            {
                group: "4: Same-Side Smart Pruning",
                name: "Pruning Surplus Profit $ (InpPruneMinProfit)",
                defaultValue: "1.0",
                description:
                    "Minimum combined net profit ($1.00 USD including swap and commission) required to close the oldest loser first and newest winner second.",
            },
            // Section 5: First Order TP
            {
                group: "5: First Order Fast Scalp",
                name: "First Order TP Points (InpTPFirstPoints)",
                defaultValue: "90",
                description:
                    "When only the initial seed order is open (total_orders == 1), closes it immediately at +90 points ($0.90) profit and re-arms the next cycle.",
            },
            // Section 6: Strategy Filters & Sessions
            {
                group: "6: M5 Seed Filters & Sessions",
                name: "6 Built-In M5 Strategy Engines",
                defaultValue: "MA(34) / ST(10,3.0) / Ichi(9,26,52) / ADX+RSI / BB(20,2) / MACD(12,26,9)",
                description:
                    "Closed-bar (shift=1) M5 entry engines selectable directly from the on-chart Strategy Settings panel.",
            },
            {
                group: "6: M5 Seed Filters & Sessions",
                name: "Server & 4 Custom Intraday Sessions",
                defaultValue: "07:30–23:59 (Server) / 4 Intraday Slots",
                description:
                    "Optional time gates restricting when a new seed cycle (total_orders == 0) may start while keeping active basket management running 24/5.",
            },
        ],
        logic: [
            "Stage 1 (Gate & License Check): Verifies online/cached license state, checks the on-chart EA ACTIVE: ON toggle, and validates trading session windows before starting a new cycle.",
            "Stage 2 (M5 Seed Entry & +90-Pt Fast Scalp): When total_orders == 0, evaluates closed M5 candle signals on the active Strategy Filter (1..6) to open a 0.02 lot seed trade. If it reaches +90 points ($0.90) before hedging, CheckFirstOrderTP() banks the scalp immediately.",
            "Stage 3 (Initial Counter-Hedge at -250 Pts): If the solitary seed order moves -250 points (-$2.50) against entry, CheckHedgeLogic() opens an opposite 'Hedge Start' order, locking the basket into hedged mode (is_hedged = true).",
            "Stage 4 (M15 Dual Grid Expansion): Once hedged, opens simultaneous BUY + SELL pairs ('Grid Buy' + 'Grid Sell') on new M15 bars whenever price moves 150 points ($1.50) beyond boundary orders (or 150 + ATR(14) when Dynamic ATR Spacing is ON), capped at 8 tiers per side.",
            "Stage 5 (Asymmetric Lot Ladder & EMA-34 Reversal Brake): Winning trend sides scale gently by 1.05x (0.02 -> 0.03 -> 0.04...), while losing counter-trend sides against M5 EMA-34 have their 1.60x multiplier halved (×0.50 = 0.80x) and clamped back to 0.02 lot.",
            "Stage 6 (Same-Side Smart Pruning & Async Exit): When either side reaches >= 5 orders, PruneSideSequence() pairs the newest winner with the oldest same-side loser at >= +$1.00 net profit (closing the losing leg first). When total basket profit hits $50.00, CloseAll() flattens all positions in parallel via OrderSendAsync.",
        ],
        faqs: [
            {
                question:
                    "How does the EMA-34 Trend Reversal Brake prevent runaway Martingale lot sizes?",
                answer: "In an unprotected 1.60x grid, a violent one-way Gold trend accumulates 2.13 lots on the losing side by Tier 8. Shadow Matrix checks the M5 EMA-34 on every new order: whenever a losing side is counter-trend (e.g., SELL while Close > EMA-34), its 1.60x multiplier is multiplied by 0.50 (= 0.80x) and clamped back to the 0.02 base lot. By Tier 8, the losing side holds only 0.16 lots total while the winning trend side holds 0.44 lots, driving the basket naturally to its $50.00 Take Profit.",
            },
            {
                question:
                    "What is Same-Side Smart Pruning and why does it close the losing leg first?",
                answer: "Once either BUY or SELL accumulates 5 or more open positions (Danger Tier Threshold = 5), the EA pairs the newest profitable order on that side with the oldest losing order of that exact same direction. When their combined net profit reaches +$1.00 (including commission and swap), it closes the oldest losing leg first and only closes the winning leg after broker confirmation—ensuring a requote never leaves a deep loser stranded without its winning pair.",
            },
            {
                question:
                    "Why does the dual grid wait for a new M15 bar and how does Dynamic ATR Spacing work?",
                answer: "Waiting for the opening tick of a new M15 candle prevents the EA from firing multiple grid levels inside a single 60-second news spike candle. When Dynamic ATR Grid Spacing is toggled [ON], the EA adds M15 ATR(14) × 1.0 on top of the 150-point base step to automatically widen spacing during extreme volatility.",
            },
            {
                question:
                    "Can I switch strategies or change Base Lot, Grid Step, and Basket TP directly on the chart?",
                answer: "Yes. Clicking [ STRATEGY SETTINGS ] on the Obsidian panel opens View 1, where you can switch between all 6 M5 seed filters (MA, SuperTrend, Ichimoku, ADX+RSI, Bollinger Bands, MACD Trend) and edit Base Lot Size, Grid Step Distance, Dynamic ATR Spacing, and Basket Take Profit ($). All 5 settings persist automatically in MT5 Terminal GlobalVariables across chart reloads and restarts.",
            },
            {
                question:
                    "How should I use the [ LAST ROUND ] button before high-impact USD news?",
                answer: "Two hours before FOMC, NFP, or US CPI releases (or before Friday market close), click [ LAST ROUND ] on the main dashboard. The EA will continue managing, pruning, and hedging your currently open basket until it hits the $50.00 target and closes—and will then pause without opening any new cycles until you toggle [ LAST ROUND ] off.",
            },
            {
                question:
                    "What happens if my license expires while a grid basket is still open?",
                answer: "Shadow Matrix uses Graceful License Protection. It never abandons or force-closes open trades in drawdown. If a license check fails while positions are open, the EA blocks new seed cycles (total_orders == 0) while continuing full dual-grid hedging, Same-Side Smart Pruning, and $50.00 basket take-profit closure until your chart is completely flat.",
            },
        ],
        metrics: {
            winRate: "71.6%",
            profitFactor: "1.82",
            maxDrawdown: "2.88%",
            monthlyAvg: "+29.29% ($2,929 / $10k)",
            verifiedLink:
                "https://myfxbook.com/members/thenexttrade/shadow-matrix-real/10294816",
        },
        colorTheme: "emerald",
        functions: [
            {
                title: "6 M5 Seed Filters & +90-Pt Fast Scalp",
                desc: "Select from MA (EMA 34), SuperTrend, Ichimoku, ADX+RSI, Bollinger Bands, or MACD Trend on M5, banking quick +90-point ($0.90) single-order scalps.",
            },
            {
                title: "250-Pt Counter-Hedge & M15 Dual Grid",
                desc: "Caps initial seed drawdown at -250 points ($2.50) with an opposite hedge, then expands simultaneous BUY + SELL pairs on M15 every 150 points ($1.50).",
            },
            {
                title: "Asymmetric Ladder & EMA-34 Lot Brake",
                desc: "Compounds with-trend winners by 1.05x while halving counter-trend multipliers (×0.50) against M5 EMA-34 to keep losing counter-trend lots flat at 0.02.",
            },
            {
                title: "M15 New-Bar Gate & Dynamic ATR Spacing",
                desc: "Prevents multi-order clustering during 1-minute news spikes and optionally widens grid steps dynamically using M15 ATR(14) volatility buffers.",
            },
            {
                title: "Same-Side Smart Pruning (Tier >= 5)",
                desc: "Pairs the newest winner with the oldest loser of the same direction at +$1.00 net surplus—closing the losing leg first to recycle the 8-tier ceiling.",
            },
            {
                title: "3-View Obsidian HUD & Async Basket Exit",
                desc: "Includes Live Telemetry, direct on-chart Strategy & Risk Settings, a Monthly Profit Calendar heatmap, and parallel OrderSendAsync closure at $50.00 TP.",
            },
        ],
        setupSteps: [
            {
                step: "01",
                title: "Copy the Compiled EA File",
                desc: "In MT5, click File -> Open Data Folder -> MQL5 -> Experts, paste GoldScalperNinja - Shadow Matrix.ex5, then refresh Expert Advisors in Navigator.",
            },
            {
                step: "02",
                title: "Authorize License WebRequest URLs",
                desc: "Open Tools -> Options -> Expert Advisors, enable Allow Algorithmic Trading and Allow WebRequest for listed URL, and add https://raw.githubusercontent.com and https://api.github.com.",
            },
            {
                step: "03",
                title: "Attach to Clean XAUUSD Chart",
                desc: "Open an XAUUSD (GOLD) chart on M5 or M15. Drag Shadow Matrix onto the chart (signal M5 and grid M15 timeframes are locked internally).",
            },
            {
                step: "04",
                title: "Verify Obsidian Panel & EA ACTIVE: ON",
                desc: "Confirm the Obsidian Control Panel renders on the chart and the top-right status indicator reads EA ACTIVE : ON in bright green.",
            },
            {
                step: "05",
                title: "Configure On-Chart Strategy & Risk (View 1)",
                desc: "Click [ STRATEGY SETTINGS ] on the panel to choose your M5 Seed Filter (1..6), Base Lot Size (0.02), Grid Step (150), ATR Spacing, and Basket TP ($50.0).",
            },
            {
                step: "06",
                title: "Run 24/5 on a Low-Latency VPS",
                desc: "Deploy on a dedicated Windows VPS (<15ms latency to broker) so dual-grid management and OrderSendAsync basket exits execute without interruption.",
            },
        ],
        riskControls: [
            {
                title: "Rule 1: Respect Capital Per 0.02 Base Lot",
                desc: "Use $3,000–$5,000 minimum ($10,000 recommended for <3% max DD) per 0.01–0.02 base lot on Standard accounts (1:200+ leverage), or $300 USD (30,000 USC) on Cent accounts.",
            },
            {
                title: "Rule 2: Keep EMA-34 Trend Reversal Brake ON",
                desc: "Always leave Reduce Lot on Trend Reversal = true (0.50 ratio). It prevents counter-trend martingale lot inflation by clamping counter-trend tiers to 0.02 lot.",
            },
            {
                title: "Rule 3: Arm [ LAST ROUND ] Before High-Impact News",
                desc: "Click [ LAST ROUND ] 2 hours before FOMC, NFP, or US CPI releases so the active basket closes cleanly at $50.00 TP and pauses before the news spike.",
            },
            {
                title: "Rule 4: Never Manually Close Only the Winning Side",
                desc: "The winning trend ladder (0.02 -> 0.03 -> 0.04...) funds Same-Side Smart Pruning and the $50.00 Basket TP. Never strip green positions while leaving red tiers open.",
            },
            {
                title: "Rule 5: Hard 8-Tier Ceiling & Scheduled Withdrawals",
                desc: "Keep Max Grid Tiers Per Direction at 7–8 with Danger Tier Threshold at 4–5, and withdraw realized profits on a regular weekly or monthly schedule.",
            },
        ],
    },
    {
        slug: "snr-system",
        title: "GSN SNR System",
        description:
            "Malaysian SNR limit-order EA for XAUUSD: reads candle-body support and resistance (A / V / GAP, RBS / SBR flips), ICT CHoCH + Fibonacci OTE zones, and swing / Bollinger extremes, then places BUY LIMIT and SELL LIMIT orders with a hard stop-loss and 1:2 risk-reward.",
        longDescription:
            '<div class="flex-1 flex flex-col justify-between gap-2.5"><p><strong class="text-gold">3-Module Malaysian SNR Limit Engine — Body Levels, OTE Zones & Swing Extremes</strong></p><p class="text-xs text-gray-500 dark:text-gray-400">GSN SNR System scans the chart the way a Malaysian SNR trader does by hand: it marks support and resistance from candle <em>bodies</em> (not wicks), filters them by freshness and H1 storyline, and waits for price to come back. Every entry is a pending LIMIT order with a hard stop-loss attached at placement — no market chasing.</p><div class="flex-1 flex flex-col justify-between gap-2 py-1"><p>— <strong class="text-gold">Module 01: Malaysian SNR (A / V / GAP)</strong> — Maps A-peak resistance, V-valley support, and same-colour GAP junctions from open/close bodies, keeps only fresh levels (MISS rule, zero wick retests), and adds Engulfing (EG / Bystra) confluence plus RBS / SBR body-breakout flips.</p><p>— <strong class="text-gold">Module 02: ICT CHoCH / BOS + OTE 0.618–0.786</strong> — Detects fractal swing structure breaks, projects the Fibonacci Optimal Trade Entry box, checks for a Fair Value Gap inside the impulse leg, and rests limit orders inside the OTE zone.</p><p>— <strong class="text-gold">Module 03: Dynamic S&amp;R + Bollinger Extremes</strong> — Optional engine (off by default) that trades major swing SSR levels and Bollinger Band (20, 2.0) extremes.</p><p>— <strong class="text-gold">Single or DCA Execution per Module</strong> — Single mode: one limit order, hard SL, TP = SL × R:R, stop moved to breakeven at +1R. DCA mode: capped recovery basket with additive or multiplicative lots and stepped basket trailing from the weighted average entry.</p><p>— <strong class="text-gold">On-Chart Command Deck</strong> — Edit Base Lot, SL distance, R:R, spacing, max pending, DCA step and trail directly on the chart, delete one side of pending orders, and rescan M15 / H1 / H4 in one click.</p></div><p class="font-bold text-gold">Built for traders who want SNR discipline enforced by code: fresh levels only, pending orders only, hard stop-loss on every order.</p></div>',
        type: "SEMI_AUTO",
        platform: "MT5",
        icon: Layers,
        targetAsset: "XAUUSD (Gold) & Major FX",
        strategyStyle:
            "Malaysian SNR Body Levels, ICT CHoCH + OTE & Swing / BB Extremes via Limit Orders",
        recommendedLeverage: "1:100 or higher",
        setupDifficulty: "Easy (5 min)",
        specHighlights: [
            {
                label: "Entry Type",
                value: "Pending BUY LIMIT / SELL LIMIT only — no market chasing",
            },
            {
                label: "Default Risk Frame",
                value: "0.02 lot · $5.00 hard SL · 1:2 R:R ($10.00 TP)",
            },
            {
                label: "Level Engines",
                value: "Malaysian SNR + ICT OTE (0.618–0.786) + Swing / BB (20, 2.0)",
            },
            {
                label: "Trend Filter",
                value: "H1 Storyline from SNR body breakouts — no lagging indicators",
            },
            {
                label: "Execution Modes",
                value: "Single (+1R → Breakeven) or capped DCA basket with trailing",
            },
            {
                label: "Recommended Chart",
                value: "XAUUSD H1 (rescan on M15 / H1 / H4 from the panel)",
            },
        ],
        accentRing: "ring-amber-500/15 dark:ring-amber-400/15",
        bullets: [
            "Fresh A / V / GAP body levels with MISS rule & RBS / SBR flips",
            "ICT CHoCH / BOS + Fibonacci OTE (0.618–0.786) limit zones",
            "Hard SL on every order, 1:2 R:R, breakeven at +1R",
            "H1 Storyline filter, max pending cap & minimum $1.50 spacing",
            "On-chart Command Deck: edit risk, delete one side, rescan TF",
        ],
        parameters: [
            {
                group: "1: Shared Entry & Risk",
                name: "Base Lot Size (InpBaseLot)",
                defaultValue: "0.02",
                description:
                    "Lot size for every Single-mode limit order and the first order of a DCA basket. Calibrated for XAUUSD on H1.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Stop Loss Distance $ (InpSlPriceDist)",
                defaultValue: "5.00",
                description:
                    "Hard stop-loss distance in price ($5.00 on Gold). Attached to the order at placement, never added later.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Risk:Reward Ratio (InpRrRatio)",
                defaultValue: "2.00",
                description:
                    "Take-profit distance = SL distance × R:R. Default gives a $10.00 TP against a $5.00 SL.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Min Price Spacing $ (InpMinPriceDist)",
                defaultValue: "1.50",
                description:
                    "Minimum distance from current price and between pending orders, so limits do not stack on top of each other.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Max Pending Orders per Module (InpMaxPending)",
                defaultValue: "6",
                description:
                    "Combined BUY + SELL pending order cap for each module.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Auto Breakeven at +1R (InpAutoBreakeven)",
                defaultValue: "true",
                description:
                    "In Single mode, moves the stop-loss to entry once the trade reaches +1R.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Auto Rescan on New Candle (InpAutoRescanNewBar)",
                defaultValue: "true",
                description:
                    "Re-runs the level scan on each new chart candle so stale levels are dropped and new ones are picked up.",
            },
            {
                group: "1: Shared Entry & Risk",
                name: "Enforce H1 Storyline (InpEnforceTrend)",
                defaultValue: "true",
                description:
                    "Only places limits in the direction of the H1 storyline, derived from A / V body breakouts (RBS / SBR) and engulfing rejections.",
            },
            {
                group: "2: Module 1 — Malaysian SNR",
                name: "Enable Malaysian SNR Engine (InpEnableMsnr)",
                defaultValue: "true",
                description:
                    "Scans A-peak resistance, V-valley support and GAP junctions from candle bodies, with freshness (MISS) and RBS / SBR flip validation.",
            },
            {
                group: "2: Module 1 — Malaysian SNR",
                name: "SNR Lookback Bars (InpLookbackBars)",
                defaultValue: "240",
                description:
                    "Number of historical candles scanned for SNR levels.",
            },
            {
                group: "3: Module 2 — CHoCH + OTE",
                name: "Enable CHoCH + OTE Engine (InpEnableOte)",
                defaultValue: "true",
                description:
                    "Detects CHoCH / BOS structure breaks and rests limit orders inside the Fibonacci 0.618–0.786 OTE box.",
            },
            {
                group: "3: Module 2 — CHoCH + OTE",
                name: "OTE Execution Mode (InpOteExecMode)",
                defaultValue: "Single",
                description:
                    "Single = one limit order with hard SL/TP and +1R breakeven. DCA = recovery basket with stepped trailing.",
            },
            {
                group: "3: Module 2 — CHoCH + OTE",
                name: "OTE DCA Lot Progression (InpOteDcaLotType)",
                defaultValue: "Additive",
                description:
                    "Additive: Base + N × 0.10 lot. Multiplicative: Base × 1.50^N.",
            },
            {
                group: "3: Module 2 — CHoCH + OTE",
                name: "OTE DCA Step / Max Orders",
                defaultValue: "$3.00 / 5",
                description:
                    "Price distance between DCA recovery orders and the hard cap on basket size.",
            },
            {
                group: "3: Module 2 — CHoCH + OTE",
                name: "OTE Trailing Milestones $ (InpOteTrailSteps)",
                defaultValue: "6,10,14,18,22",
                description:
                    "Basket profit milestones from the weighted average entry. First milestone moves SL to breakeven; each next milestone locks the previous one.",
            },
            {
                group: "4: Module 3 — Dynamic S&R / BB",
                name: "Enable Dynamic S&R Engine (InpEnableSnr)",
                defaultValue: "false",
                description:
                    "Optional engine for major swing SSR levels and Bollinger Band (20, 2.0) extremes. Uses the same Single / DCA settings structure as Module 2.",
            },
            {
                group: "5: Protection & Dashboard",
                name: "Max Daily Drawdown % (InpMaxDailyLossPct)",
                defaultValue: "0.0 (Off)",
                description:
                    "Daily equity drawdown circuit breaker. When hit, new limits and DCA orders are blocked for the rest of the day.",
            },
            {
                group: "5: Protection & Dashboard",
                name: "Base Magic Number (InpMagicBase)",
                defaultValue: "20260900",
                description:
                    "Each module uses its own magic: Base (SNR), Base+1 (OTE), Base+2 (S&R), so baskets never mix.",
            },
            {
                group: "5: Protection & Dashboard",
                name: "Max Slippage Points (InpSlippagePoints)",
                defaultValue: "20",
                description:
                    "Maximum accepted execution deviation for market-side actions.",
            },
            {
                group: "5: Protection & Dashboard",
                name: "Show Command Deck (InpEnableDashboard)",
                defaultValue: "true",
                description:
                    "Shows the interactive on-chart panel for live parameter edits, module toggles and rescans.",
            },
        ],
        logic: [
            "Stage 1 (Scan): On attach and on each new candle, the EA scans up to 240 bars for candle-body levels — A (peak resistance), V (valley support) and GAP (same-colour momentum junctions).",
            "Stage 2 (Validate): Each level must pass the MISS / freshness rule (no wick retest since formation). Engulfing (EG / Bystra) confluence and RBS / SBR body-breakout flips are tagged; Module 2 adds CHoCH / BOS + OTE 0.618–0.786 zones with a Fair Value Gap check.",
            "Stage 3 (Filter): With the H1 Storyline filter on, only levels aligned with the H1 direction (from SNR body breakouts, no indicators) are kept. Levels closer than $1.50 to price or to an existing order are skipped.",
            "Stage 4 (Place): BUY LIMIT below price at support, SELL LIMIT above price at resistance, each with a hard SL ($5.00 default) and TP = SL × R:R, capped at 6 pending orders per module.",
            "Stage 5 (Manage): Single mode moves SL to breakeven at +1R. DCA mode adds capped recovery orders every $3.00 against the basket and trails a shared basket stop from the weighted average entry through the 6 / 10 / 14 / 18 / 22 milestones.",
            "Stage 6 (Protect): A daily equity drawdown breaker (when set) and the license gate block new orders, while positions already open keep being managed until they close.",
        ],
        faqs: [
            {
                question: "What makes this a Malaysian SNR system rather than a normal support/resistance EA?",
                answer: "Levels are drawn from candle open/close bodies, not wicks. The EA looks for A-shaped peaks (resistance), V-shaped valleys (support) and GAP junctions between same-colour candles, then keeps only fresh levels that price has not wicked back into (the MISS rule). Broken levels flip role through RBS (Resistance Become Support) and SBR (Support Become Resistance).",
            },
            {
                question: "Does the EA enter at market?",
                answer: "No. Every entry is a pending BUY LIMIT or SELL LIMIT placed at the level, with the stop-loss and take-profit attached in the same request. If price never returns to the level, no trade happens.",
            },
            {
                question: "Which timeframe should I run it on?",
                answer: "The default 0.02 base lot and $5.00 stop are calibrated for XAUUSD on H1. You can rescan M15, H1 or H4 from the Command Deck; on lower timeframes reduce the SL distance and lot size accordingly.",
            },
            {
                question: "What is the difference between Single and DCA mode?",
                answer: "Single mode places one order per level with a hard SL, TP at 1:2 and breakeven at +1R — the risk per trade is fixed. DCA mode opens up to 5 recovery orders every $3.00 against the basket and trails a shared stop from the average entry. DCA increases exposure quickly (additive lots reach 1.10 lots total at 5 orders from a 0.02 base), so test it on demo or cent first.",
            },
            {
                question: "Can I stop one direction without removing the EA?",
                answer: "Yes. The Command Deck has DELETE PENDING BUY and DELETE PENDING SELL buttons to remove and lock one side, plus a pause toggle. Open positions continue to be managed by their existing SL, TP and breakeven rules.",
            },
            {
                question: "Does it filter news or trading sessions?",
                answer: "No built-in news or session filter is active. Pause the EA or delete pending orders manually before FOMC, NFP and CPI releases, and use the daily drawdown breaker to cap a bad day.",
            },
        ],
        colorTheme: "gold",
        functions: [
            {
                title: "Malaysian SNR Body Levels",
                desc: "A-peak resistance, V-valley support and GAP junctions from candle bodies, with MISS freshness and Engulfing (EG / Bystra) confluence.",
            },
            {
                title: "RBS / SBR Role Flips",
                desc: "When a candle body closes through a level, the EA flips its role — broken resistance becomes support, broken support becomes resistance.",
            },
            {
                title: "ICT CHoCH + OTE Zones",
                desc: "Fractal swing structure breaks with a Fibonacci 0.618–0.786 OTE box and a Fair Value Gap check before any limit is placed.",
            },
            {
                title: "H1 Storyline Filter",
                desc: "Direction comes from H1 SNR body breakouts and rejections — pure price action, no moving-average lag.",
            },
            {
                title: "Hard SL & Fixed R:R",
                desc: "Every limit carries a stop-loss at placement and TP = SL × R:R (1:2 default), with breakeven at +1R in Single mode.",
            },
            {
                title: "On-Chart Command Deck",
                desc: "Edit lot, SL, R:R, spacing, max pending, DCA step and trail live; toggle modules; delete one side; rescan M15 / H1 / H4.",
            },
        ],
        setupSteps: [
            {
                step: "01",
                title: "Copy the Compiled EA File",
                desc: "In MT5 open File -> Open Data Folder -> MQL5 -> Experts, paste GoldScalperNinja_SNR.ex5, then refresh Expert Advisors in the Navigator.",
            },
            {
                step: "02",
                title: "Allow Algo Trading & WebRequest",
                desc: "Tools -> Options -> Expert Advisors: enable Allow Algorithmic Trading and Allow WebRequest, then add your TheNextTrade server URL for license and telemetry sync.",
            },
            {
                step: "03",
                title: "Attach to XAUUSD H1",
                desc: "Open an XAUUSD H1 chart, drag the EA on, and paste your License Key (TNT-XXXX-XXXX-XXXX) into the Sync API Key input.",
            },
            {
                step: "04",
                title: "Check Levels & Pending Orders",
                desc: "Confirm the Command Deck appears, SNR ray lines and OTE boxes are drawn, and pending limits respect the max pending cap.",
            },
            {
                step: "05",
                title: "Set Your Daily Drawdown Breaker",
                desc: "Max Daily Drawdown % is off by default. Set it (for example 3%) before running on a live account.",
            },
        ],
        riskControls: [
            {
                title: "Rule 1: Start in Single Mode",
                desc: "Single mode fixes the loss per order at the $5.00 hard SL. Only switch a module to DCA after testing it on demo or cent.",
            },
            {
                title: "Rule 2: Size for All Pending Orders Filling",
                desc: "Two default modules can hold up to 12 pending orders. At 0.02 lot and a $5.00 SL that is $10 per order — size the account for the case where several fill on the same move.",
            },
            {
                title: "Rule 3: Turn On the Daily Breaker",
                desc: "Set Max Daily Drawdown % (it ships at 0 = off) so the EA stops placing new limits after a bad day.",
            },
            {
                title: "Rule 4: Clear Limits Before Red-Folder News",
                desc: "There is no built-in news filter. Use DELETE PENDING BUY / SELL or pause before FOMC, NFP and CPI.",
            },
            {
                title: "Rule 5: Keep DCA Caps Tight",
                desc: "If you use DCA, keep Max DCA Orders at 5 or lower and prefer Additive lots over Multiplicative to keep basket exposure predictable.",
            },
        ],
    },
];

export function getSystemBySlug(slug: string): SystemData | undefined {
    const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized === "gsnphoenixgrid" || normalized === "gsnshadowmatrix") {
        return TRADING_SYSTEMS_DATA.find((s) => s.slug === "gsn-shadown-matrix");
    }
    return TRADING_SYSTEMS_DATA.find(
        (s) => s.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
    );
}
