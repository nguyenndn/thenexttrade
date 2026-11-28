import { Bot, SlidersHorizontal, Layers, LucideIcon } from "lucide-react";
import type { Mt5WebRequestServerEntry } from "@/lib/sync/sync-urls";

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
    webRequestServers?: Mt5WebRequestServerEntry[];
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
        webRequestServers: [
            { id: "license-script", role: "MAIN", label: "v3.1 License Script", url: "https://script.google.com" },
            { id: "license-response", role: "BACKUP", label: "v3.1 License Response", url: "https://script.googleusercontent.com" },
        ],
        title: "GoldScalperNinja EA",
        version: "v3.1",
        description:
            "An automated XAUUSD recovery system for MetaTrader 5. Trailing stop entries wait for a rebound, while Smart Pruning uses winning positions to reduce older losing exposure. Configure lot caps and loss limits before enabling live trading.",
        longDescription:
            "<p>GoldScalperNinja v3.1 is an automated recovery EA designed for XAUUSD on MetaTrader 5. Instead of entering each grid level immediately, it trails stop entries behind price and opens an order after the configured rebound. The five lot-ladder styles A–E control how volume grows across a recovery chain.</p>\n<p>Smart Pruning pairs profitable positions with older losing positions to reduce the open chain. Auto Trend Master uses the daily candle body and the previous daily close to restrict entries against a strong daily move; it is a directional filter, not a prediction of the next market move.</p>\n<p>The panel separates direction permissions, new-cycle control and the EA ON/OFF state. CYCLE: OFF prevents a fresh cycle while existing chains continue to be managed. The mobile ON/OFF command is a different control: it pauses or resumes EA trading without closing positions.</p>\n<p>Several important protections ship disabled: per-order and total lot caps, the global stop loss, and daily profit/loss limits use 0 for OFF. News and session filters primarily govern new cycles. Recovery trading can increase floating loss and margin use during a prolonged one-way move; no pruning or filter guarantees a profitable exit.</p>",
        type: "AUTO_TRADE",
        platform: "MT5",
        icon: Bot,
        targetAsset: "XAUUSD (Gold)",
        strategyStyle:
            "Price Action & Momentum Scalping with Trend Master D1 & Lot-Price Distance Filter",
        recommendedLeverage: "Broker / margin dependent",
        setupDifficulty: "Easy (5 min)",
        specHighlights: [
            {
                label: "Platform / Manual",
                value: "MetaTrader 5 · v3.1"
            },
            {
                label: "Instrument",
                value: "XAUUSD (Gold)"
            },
            {
                label: "Entry / Recovery",
                value: "Trailing stops · Styles A–E"
            },
            {
                label: "Risk Defaults",
                value: "Lot and loss caps OFF (0)"
            }
        ],
        accentRing: "ring-gold/20",
        bullets: [
            "Trailing stop entries and five A–E lot-ladder styles",
            "Smart Pruning and D1 Auto Trend Master",
            "Separate new-cycle and remote EA controls",
            "Configurable caps and breakers; key limits start OFF"
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
            "Entry gates: global BUY/SELL permissions, the selected direction mode, then Auto Trend Master when AUTO is selected. Spacing, lot rules and other entry checks still apply.",
            "Trailing stop entries follow price and wait for the configured rebound. A distance filter avoids placing orders too close to an existing chain.",
            "The selected A–E ladder changes volume by tier. Initial lot, additive/exponential growth and orders per tier determine how quickly exposure increases.",
            "Smart Pruning combines winners with older losers when the applicable net-profit condition is met. It can shorten a chain without waiting for every position to recover.",
            "Basket targets, trailing rules and configured loss limits manage exits. CYCLE: OFF stops fresh cycles while preserving management of existing chains.",
            "The news filter and trading schedules can prevent new cycles; they must not be treated as a blanket freeze of an already active recovery chain."
        ],
        faqs: [
            {
                question: "Which platform and instrument does the v3.1 manual cover?",
                answer: "MetaTrader 5 and XAUUSD (Gold). Validate symbol suffixes, broker execution rules and point values on the actual account; the manual does not establish a universal preset for every broker."
            },
            {
                question: "Are the lot caps and loss breakers enabled by default?",
                answer: "No. The documented per-order cap, total-volume cap, global stop loss and daily profit/loss limits use 0 for OFF. Set limits deliberately before running the EA."
            },
            {
                question: "How is CYCLE: OFF different from the mobile OFF command?",
                answer: "CYCLE: OFF prevents a new cycle while current chains remain managed. The mobile command pauses or resumes the EA and does not close positions. They are separate controls."
            },
            {
                question: "How do the mobile ON/OFF commands work?",
                answer: "Place a Sell Stop on the same symbol at 999.00 for OFF or 888.00 for ON. The manual also accepts 9990.00 and 8880.00. The EA removes the command order. These commands do not close existing positions."
            },
            {
                question: "Why does the EA remain stopped after Safe Close?",
                answer: "Safe Close intentionally switches the EA OFF. Send the remote ON command or remove and reattach the EA; waiting for the next trading day is not enough."
            },
            {
                question: "Can the recovery chain or virtual stops run while MT5 is closed?",
                answer: "No. EA-side management and virtual entries require an active, connected terminal. Broker-held orders can remain on the server, but the EA cannot manage them while offline."
            }
        ],
        colorTheme: "gold",
        functions: [
            {
                title: "Trailing Stop Entries",
                desc: "Choose the documented stop-entry mode, including broker-side and virtual execution. Virtual entries require the MT5 terminal or VPS to remain connected."
            },
            {
                title: "Five Lot-Ladder Styles",
                desc: "Styles A–E change tier progression. Initial lot, multiplier, additive increment and orders per tier jointly determine volume growth."
            },
            {
                title: "Smart Pruning",
                desc: "Uses profitable positions to offset older losing exposure when its net closing condition is satisfied. Pruning does not remove the risk of a growing recovery chain."
            },
            {
                title: "Auto Trend Master",
                desc: "Uses D1 price context to restrict the side opposing a strong daily move. BUY/SELL global permissions remain hard locks that the panel cannot override."
            },
            {
                title: "Separate Cycle and Remote Controls",
                desc: "CYCLE: OFF prevents fresh cycles. The mobile Sell Stop command controls EA ON/OFF; the command order is removed, and existing positions are not closed by that switch."
            },
            {
                title: "Configurable Trading Brakes",
                desc: "Supports lot caps, global loss limits, daily limits, news/session filters and Safe Close. Review which protections are enabled rather than assuming the defaults protect an account."
            }
        ],
        setupSteps: [
            {
                step: "01",
                title: "Install the MT5 EA",
                desc: "Copy the supplied .ex5 into MQL5/Experts, refresh Navigator and attach one instance to a clean XAUUSD chart. Use the chart timeframe and preset supplied with your release."
            },
            {
                step: "02",
                title: "Authorize the Manual’s License Endpoints",
                desc: "The v3.1 manual requires Allow WebRequest for https://script.google.com and https://script.googleusercontent.com. Ensure the trading account is licensed. For a newer release, follow the endpoints shown by that release."
            },
            {
                step: "03",
                title: "Set Exposure and Loss Limits",
                desc: "Review initial lot, lot-ladder style, order and total-volume caps, global stop loss and daily limits. A value of 0 disables the documented cap or loss limit."
            },
            {
                step: "04",
                title: "Review Entry and Cycle Settings",
                desc: "Check the direction mode, global BUY/SELL permissions, grid step, distance filter, news filter and server-time sessions. These settings do not all apply to the same stage of a cycle."
            },
            {
                step: "05",
                title: "Enable and Validate on Demo",
                desc: "Enable Algo Trading and confirm the panel, Experts and Journal show normal operation. Test CYCLE: OFF, remote ON/OFF and recovery management before relying on a connected VPS."
            }
        ],
        riskControls: [
            {
                title: "Lot Caps Are OFF at 0",
                desc: "Per-order and total open-volume caps must be configured explicitly. The default 1.5 exponential multiplier can increase recovery exposure rapidly."
            },
            {
                title: "Global and Daily Limits Are Optional",
                desc: "Global stop loss and daily profit/loss breakers are disabled at 0. A configured threshold is an execution rule, not a guarantee against gaps, slippage or terminal outages."
            },
            {
                title: "New-Cycle Filters Have Limited Scope",
                desc: "News and time filters primarily prevent a fresh cycle. Existing recovery activity can continue, so a filtered period does not imply zero trading exposure."
            },
            {
                title: "Safe Close Can Leave the EA OFF",
                desc: "After a Safe Close shutdown, the manual requires the remote ON command or removing and reattaching the EA to resume. It does not automatically resume on the next day."
            },
            {
                title: "Remote OFF Is Not Emergency Liquidation",
                desc: "The mobile Sell Stop command pauses the EA; it does not flatten positions. Distinguish it from closing a basket and from CYCLE: OFF."
            }
        ],
    },
    {
        slug: "trade-manager",
        title: "GSN Trade Manager",
        version: "v2.0",
        description:
            "A five-tab MetaTrader 5 execution assistant for manual trades, multi-target exits, market context and optional DCA recovery. The trader chooses the setup; Smart Shield and recovery controls remain conditional tools, not guaranteed exits.",
        longDescription:
            "<p>GoldScalperNinja Trade Manager is a MetaTrader 5 execution assistant with five tabs: TRADE, GOLD ZONE, TREND, SEMI and SYNC. It helps the trader prepare and manage a setup; the manual does not describe a fully autonomous signal-entry robot.</p>\n<p>TRADE combines market and pending entries with three take-profit targets, weighted volume splits, breakeven and partial-close tools. GOLD ZONE adds supply/demand context and Daily POC, VAH and VAL. TREND presents six signal engines across seven timeframes as a confluence dashboard, not a promise that all signals are correct.</p>\n<p>SEMI provides optional multiplier-based DCA or a Break-Even Lot solver, a draggable trade zone, mobile-trade adoption and Smart Shield hedging. The displayed +$1 recovery surplus is an exit condition, not a guaranteed outcome. Volume caps and zone boundaries do not eliminate market-gap or margin risk.</p>\n<p>SYNC checks the license and account on CONNECT, then uploads closed-trade history only when you choose a range and click a Sync button. The guide specifies a $200 minimum balance for real-account CONNECT; demo accounts have no minimum. Daily loss/gain limits are OFF by default, with 2% / 3% thresholds available when enabled.</p>",
        type: "MANUAL_ASSIST",
        platform: "MT5",
        icon: SlidersHorizontal,
        targetAsset: "XAUUSD (Gold) & All MT5 Symbols",
        strategyStyle: "5-Tab Manual Split-TP, Volume Profile & Smart DCA Deck",
        recommendedLeverage: "Broker / margin dependent",
        setupDifficulty: "Easy (10 min)",
        specHighlights: [
            {
                label: "Workflow",
                value: "Manual execution · 5 tabs"
            },
            {
                label: "Trade Management",
                value: "3 TP targets · weighted splits"
            },
            {
                label: "Recovery",
                value: "Optional DCA · BE Lot · Shield"
            },
            {
                label: "Closed-Trade Sync",
                value: "Manual · selected date range"
            }
        ],
        accentRing: "ring-blue-500/15 dark:ring-blue-400/15",
        bullets: [
            "Five tabs: TRADE, GOLD ZONE, TREND, SEMI and SYNC",
            "Three-target execution with weighted volume splits",
            "Optional DCA, BE Lot solver and Smart Shield",
            "Manual closed-history sync for a chosen date range"
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
            "Choose direction and entry, stop loss and up to three take-profit targets. Execute at market or place the pending setup after checking volume and the target split.",
            "Use GOLD ZONE for order-block and value-area context, and TREND for the six-engine, seven-timeframe confluence matrix. The trader remains responsible for selecting and confirming a setup.",
            "TP1 can move remaining trades to breakeven and cancel unfilled setup orders. Moving the TP3 runner’s SL to TP1 on TP2 is a separate option that is OFF by default.",
            "SEMI recovery can use multiplier lots or the BE Lot solver. Zone boundaries, maximum single/basket lots and optional Smart Shield control different aspects of an active recovery basket.",
            "MOBILE DCA can adopt supported manual phone trades while the EA remains running on the desktop terminal or VPS; the phone itself does not host the EA.",
            "In SYNC, CONNECT validates credentials and checks balance/equity. Closed deals are uploaded only on an explicit range Sync action, including swaps, commissions and net profit."
        ],
        faqs: [
            {
                question: "Does Trade Manager open fully autonomous signal trades?",
                answer: "The guide describes a manual execution assistant with optional Semi-Auto recovery. GOLD ZONE and TREND provide context; the trader chooses and confirms the trading setup."
            },
            {
                question: "Does SYNC upload closed trades automatically?",
                answer: "No. CONNECT validates the key and checks balance/equity. Closed history is uploaded only when you select a preset or custom range and click a Sync button."
            },
            {
                question: "Is there a minimum balance for CONNECT?",
                answer: "The guide specifies a $200 minimum balance for real accounts. Demo accounts have no minimum. This is a connection condition, not a recommended amount for trading or recovery."
            },
            {
                question: "Does the +$1 BE Lot or Smart Shield target guarantee a profitable exit?",
                answer: "No. It is the configured recovery objective. Lot caps, broker constraints, available margin, gaps and execution delays can prevent the expected result."
            },
            {
                question: "Can I manage phone trades without leaving MT5 running?",
                answer: "No. MOBILE DCA adopts supported manual phone trades through the EA running in MT5 on your computer or VPS. Keep that terminal and Algo Trading active."
            },
            {
                question: "Which automatic protections are enabled initially?",
                answer: "The guide lists hotkeys, breakeven on TP1 and cancellation of remaining setup pending orders on TP1 as true. Daily trading limits, TP2-to-TP1 trailing, candle trailing, step profit locking and SEMI trailing TP are false."
            }
        ],
        colorTheme: "blue",
        functions: [
            {
                title: "Three-Target Execution",
                desc: "Prepare market or pending entries with TP1, TP2 and TP3 and a weighted lot split. Hotkeys B, S, X and E cover buy, sell, close all and breakeven when enabled."
            },
            {
                title: "Daily Value-Area Context",
                desc: "GOLD ZONE displays supply/demand zones and Daily POC, VAH and VAL, with execution helpers such as value-area limits and snapping a target to POC."
            },
            {
                title: "Multi-Timeframe Confluence",
                desc: "TREND combines Sonic R, Market Structure, SuperTrend, MACD, ADX and VOL-MOM over M1, M5, M15, M30, H1, H4 and D1."
            },
            {
                title: "Optional DCA and BE Lot Recovery",
                desc: "Choose multiplier recovery or a lot solver for the configured retrace. Set and monitor Max Single Lot and Max Basket Lot; a computed recovery target can still fail to execute."
            },
            {
                title: "Trade Zone, Mobile Adoption and Shield",
                desc: "Use the draggable zone to constrain new recovery orders, adopt supported manual mobile trades, or arm an opposite hedge. Smart Shield does not guarantee a risk-free exit."
            },
            {
                title: "Manual Cloud History Sync",
                desc: "CONNECT checks the key and account. Choose Today, a preset lookback or custom dates and explicitly Sync closed history; history uploads do not run in the background."
            }
        ],
        setupSteps: [
            {
                step: "01",
                title: "Install the EA",
                desc: "Copy the supplied TradeManager .ex5 into MQL5/Experts and refresh Navigator. Attach it to the intended chart with Algo Trading enabled."
            },
            {
                step: "02",
                title: "Authorize License and Sync Servers",
                desc: "Allow WebRequest to https://thenexttrade.app, https://raw.githubusercontent.com and https://api.github.com. Enter your personal dashboard key on the SYNC tab."
            },
            {
                step: "03",
                title: "Check F7 Protection Defaults",
                desc: "Daily Trading Limits are OFF by default; their enabled thresholds are 2% loss and 3% gain. Review TP1 breakeven, pending cancellation, candle trailing, step trailing and the separate manual/DCA magic numbers."
            },
            {
                step: "04",
                title: "Validate TRADE and SEMI Separately",
                desc: "On demo, test a three-target manual setup. If using SEMI, configure single/basket lot caps, DCA step, target SL, trade-zone boundaries and Smart Shield before starting a basket."
            },
            {
                step: "05",
                title: "Connect and Sync a Chosen Range",
                desc: "Click CONNECT to validate the account; the guide requires at least $200 balance on a real account. Select a date range and click Sync to upload closed trades, then verify the dashboard result."
            }
        ],
        riskControls: [
            {
                title: "Separate Manual and Recovery Exposure",
                desc: "The guide uses manual Magic 123456 and Semi-Auto Magic 123457. Confirm which trades each action manages before using CLOSE ALL, TP BUY/SELL or MOBILE DCA."
            },
            {
                title: "Single and Basket Lot Caps",
                desc: "The illustrated SEMI controls show Max Single Lot 0.50 and Max Basket Lot 2.00. Check the loaded values and account constraints; these are ceilings, not suitable lot sizes for every account."
            },
            {
                title: "Daily Limits Start OFF",
                desc: "F7 Daily Trading Limits default to false. When enabled, the documented default loss/gain thresholds are 2% / 3%; they do not guarantee those exact realized outcomes."
            },
            {
                title: "DCA and Smart Shield Remain Conditional",
                desc: "Recovery can increase volume. A trade zone, stop or hedge depends on execution and cannot remove gap, slippage, margin or connectivity risk. Closing one leg of a hedged basket changes its exposure."
            },
            {
                title: "EA Management Needs a Connected Terminal",
                desc: "Breakeven automation, recovery, mobile adoption and other EA-side actions require the desktop/VPS terminal to remain active. A phone connection alone does not run the manager."
            }
        ],
    },
    {
        slug: "shadow-matrix",
        webRequestServers: [
            { id: "license-raw", role: "MAIN", label: "License Endpoint", url: "https://raw.githubusercontent.com" },
            { id: "license-api", role: "BACKUP", label: "License API", url: "https://api.github.com" },
        ],
        title: "GSN Shadow Matrix",
        version: "v1.0",
        description:
            "An XAUUSD dual-grid and counter-hedge EA with M5 seed signals, M15 regular grid expansion, an EMA-34 lot brake, RECO Trap recovery and same-side pruning. Hedge distances and basket targets are operating thresholds, not loss caps or profit guarantees.",
        longDescription:
            "<p>Shadow Matrix is a MetaTrader 5 XAUUSD system that starts a cycle from one of six closed-candle M5 filters: MA, SuperTrend, Ichimoku, ADX + RSI, Bollinger Bands or MACD. The specification uses a 0.02-lot seed and a 90-point first-order target when the initial position remains alone.</p>\n<p>If price moves 250 points against the seed, the counter-hedge logic opens the opposite direction. Regular dual-grid expansion then uses an M15 new-bar gate and a 150-point base step. Dynamic ATR spacing is OFF by default; it adds volatility spacing only when enabled in the matching ATR mode.</p>\n<p>Winning and losing multipliers are 1.05 and 1.60 before the optional EMA-34 reversal reduction of 0.50. RECO Trap manages recovery near the hedged corridor edges on ticks; it is separate from the M15 gate for regular grid pairs. Same-side pruning begins at five orders and seeks a $1 net surplus from the newest winner and oldest loser of that direction.</p>\n<p>The documented basket target is $50 and the ceiling is eight open tiers per direction. These settings do not cap account drawdown, guarantee a profitable close or establish prop-firm compliance. The 250-point hedge trigger is an entry threshold, not a stop loss. Historical stress-test figures in the specification are examples of one test configuration.</p>",
        type: "AUTO_TRADE",
        platform: "MT5",
        icon: Bot,
        targetAsset: "XAUUSD (Gold)",
        strategyStyle:
            "M5 Seeded Asymmetric Dual Grid, Counter-Hedge & Same-Side Smart Pruning",
        recommendedLeverage: "Broker / margin dependent",
        setupDifficulty: "Easy (10 min)",
        specHighlights: [
            {
                label: "Seed / Regular Grid",
                value: "M5 signals · M15 new-bar gate"
            },
            {
                label: "Base / Hedge Distance",
                value: "0.02 lot · 250 points"
            },
            {
                label: "Step / Tier Ceiling",
                value: "150 points · 8 per direction"
            },
            {
                label: "Basket TP / Pruning",
                value: "$50 target · from tier 5"
            }
        ],
        accentRing: "ring-emerald-500/15 dark:ring-emerald-400/15",
        bullets: [
            "Six M5 seed filters and M15 regular grid expansion",
            "Counter-hedge, dual grid and tick-responsive RECO Trap",
            "EMA-34 lot brake and same-side pruning",
            "Persisted strategy settings and profit calendar"
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
            "With no active basket, a closed M5 signal from the selected strategy starts one seed. MA is the default seed strategy; six filters are available.",
            "A lone seed can close at the 90-point first-order target. If it moves 250 points against entry, the EA attempts the opposite counter-hedge; this does not define a maximum possible loss.",
            "Regular grid pairs use new M15 bars and the configured spacing. The default base step is 150 points; ATR expansion requires both ATR mode and Dynamic ATR Spacing enabled.",
            "Lot sizing applies the 1.05 winning or 1.60 losing multiplier, then the configured EMA-34 reversal brake when applicable. Broker volume rounding and base-lot constraints affect the final order size.",
            "RECO Trap is tick-responsive at the hedged corridor boundaries. It is a separate recovery path, so the M15 gate must not be described as a global one-pair-per-bar limit.",
            "From five positions on a side, pruning pairs that side’s newest profitable order with its oldest losing order when the $1 net-surplus condition is met. Basket TP initiates asynchronous closes at the $50 target; execution and final realized P/L can differ.",
            "Time filters govern a new cycle. Existing hedge, grid, pruning and basket-management logic continues outside the permitted seed-entry sessions."
        ],
        faqs: [
            {
                question: "Is Dynamic ATR spacing enabled by default?",
                answer: "No. The default grid mode is ATR Dynamic Step, but Dynamic ATR Grid Spacing is false. The base step remains 150 points until the toggle is enabled in the matching mode."
            },
            {
                question: "Is every new order restricted to one M15 grid event?",
                answer: "No. The M15 new-bar gate governs regular grid pairs. RECO Trap is a separate tick-responsive recovery path, so that gate is not a global limit on all recovery entries."
            },
            {
                question: "Does the 250-point hedge distance cap my drawdown?",
                answer: "No. It triggers an opposite hedge attempt. It is not a stop loss or an equity drawdown cap, and execution can occur beyond the configured threshold."
            },
            {
                question: "Why did changing F7 not update the panel’s strategy values?",
                answer: "Base lot, grid step, Dynamic ATR Spacing, entry strategy and basket TP persist in GSN_SM_* GlobalVariables. Change them in STRATEGY SETTINGS. Only clear the relevant saved variables after understanding the effect on your running setup."
            },
            {
                question: "Do session filters stop an existing recovery basket?",
                answer: "No. The specification applies time filters to new cycles. Existing hedge, grid, pruning and basket TP management continues outside those seed-entry windows."
            },
            {
                question: "Are the historical stress-test results a live-performance guarantee?",
                answer: "No. They describe one historical test and configuration. They do not guarantee a return, future drawdown, broker execution quality or prop-firm approval."
            }
        ],
        colorTheme: "emerald",
        functions: [
            {
                title: "Six M5 Seed Filters",
                desc: "Choose MA, SuperTrend, Ichimoku, ADX + RSI Pullback, Bollinger Bands or MACD Trend. Closed-candle evaluation is distinct from the regular M15 grid schedule."
            },
            {
                title: "Counter-Hedge and Dual Grid",
                desc: "Attempts a counter-hedge at the configured adverse distance, then expands the two directions using regular grid rules. Hedging can preserve floating exposure; it does not erase a loss."
            },
            {
                title: "EMA-34 Lot Brake",
                desc: "Applies the reversal reduction ratio to qualifying counter-trend sizing. This changes new volume; it does not provide an equity stop."
            },
            {
                title: "RECO Trap Corridor Recovery",
                desc: "Responds to ticks near corridor boundaries while the basket is hedged. Its timing differs from the M15 new-bar gate for regular grid expansion."
            },
            {
                title: "Same-Side Smart Pruning",
                desc: "At the configured danger tier, pairs a winner and loser within the same direction and checks the surplus condition before closing. It does not pair BUY winners with SELL losers."
            },
            {
                title: "Three-View Chart Dashboard",
                desc: "Overview, strategy settings and profit calendar provide basket controls and monthly history. Five strategy settings persist in MT5 GlobalVariables, so F7 changes may not overwrite the panel."
            }
        ],
        setupSteps: [
            {
                step: "01",
                title: "Install on MT5",
                desc: "Copy the supplied Shadow Matrix .ex5 into MQL5/Experts, refresh Navigator and attach it to the intended XAUUSD chart. The specification separates M5 seed evaluation from M15 regular grid expansion."
            },
            {
                step: "02",
                title: "Authorize the License Servers",
                desc: "The specification requires Allow WebRequest to https://raw.githubusercontent.com and https://api.github.com, with your account registered for the release. Follow any additional endpoint requirements shown by your actual build."
            },
            {
                step: "03",
                title: "Check the F7 Strategy and Risk Settings",
                desc: "Review the base lot, winning/losing multipliers, EMA-34 lot brake, hedge distance, tier ceiling, RECO Trap, pruning, basket target and optional session filters before enabling the EA."
            },
            {
                step: "04",
                title: "Review Persisted Strategy Settings",
                desc: "Use STRATEGY SETTINGS to check Base Lot Size, Grid Step Distance, Dynamic ATR Spacing, Entry Strategy and Basket Take Profit. These five values persist under GSN_SM_* GlobalVariables and can override changed F7 defaults."
            },
            {
                step: "05",
                title: "Verify the Actual Cycle on Demo",
                desc: "Test a seed, counter-hedge, regular grid expansion, RECO Trap, pruning and basket close. Validate broker point size, lot rounding and both-direction position support rather than copying stress-test results as expectations."
            }
        ],
        riskControls: [
            {
                title: "Hedge Trigger Is Not a Stop Loss",
                desc: "The 250-point threshold attempts an opposite order. Floating loss, spread, swap and execution risk remain after a hedge; the basket is not protected by a guaranteed dollar loss cap."
            },
            {
                title: "Tier Ceiling Is Not an Equity Ceiling",
                desc: "The documented maximum is eight open tiers per direction. Review combined volume and free margin; limiting the number of orders does not bound drawdown."
            },
            {
                title: "Two Separate Expansion Paths",
                desc: "The M15 gate applies to regular grid pairs. RECO Trap reacts on ticks, so it must be included when assessing potential recovery activity during fast moves."
            },
            {
                title: "Pruning and Basket Targets Depend on Execution",
                desc: "A $1 pruning surplus and $50 basket target are conditions for closing attempts. Spreads, swaps, commissions, rejections and asynchronous fill prices affect the realized outcome."
            },
            {
                title: "Backtests Do Not Establish Live or Prop-Firm Safety",
                desc: "The specification’s July 2026 stress test is historical evidence for its stated setup. Live drawdown and compliance with a particular firm’s rules require separate validation."
            }
        ],
    },
    {
        slug: "snr-system",
        title: "GSN SNR System",
        description:
            "The SNR v2.00 source scans three independent zone engines and places spaced BUY LIMIT / SELL LIMIT orders with individual broker-side SL/TP. It uses fixed base lots, chart-timeframe presets and optional +1.3R breakeven; it does not implement DCA recovery.",
        longDescription:
            "<p>GoldScalperNinja SNR v2.00 is a three-module limit-order execution EA for MetaTrader 5. MSNR scans A/V/GAP patterns and support/resistance flips (RBS/SBR). ICT OTE scans structure changes and retracement zones, including the 0.618–0.786 golden pocket. Dynamic S&R combines swing levels with Bollinger Band context. MSNR and OTE are enabled by default; Dynamic S&R is OFF.</p>\n<p>Each enabled module can place BUY LIMIT and SELL LIMIT orders from its zone candidates. Entries use the configured base lot, minimum price spacing, per-module pending cap and individual broker-side stop loss/take profit. The current source does not implement averaging, multiplier DCA, basket recovery or stepped DCA trailing.</p>\n<p>The F7 declarations are not the final runtime defaults. With the untouched default inputs, InitRuntimeConfig applies H1 0.02 lot / $10 SL, M30 0.04 / $7.50, M15 0.02 / $5, or M5 0.01 / $4, and widens the minimum price spacing to $10 / $6 / $3.50 / $1.50 on those periods. The declared 2.00 R:R is kept unchanged, so TP distances are $20 / $15 / $10 / $8 respectively on Gold. Dollar figures here are XAUUSD price distances, not a fixed dollar account risk.</p>\n<p>Automatic rescanning is ON for a new chart candle. Optional breakeven is OFF and, when enabled, triggers at +1.3R. H1 Storyline is context/telemetry, not a directional entry veto; the current spread and active-session checks are permissive. The daily drawdown breaker is OFF at 0. Configure and validate these controls rather than assuming a news, spread or session filter is protecting entries.</p>",
        type: "SEMI_AUTO",
        platform: "MT5",
        icon: Layers,
        targetAsset: "XAUUSD (Gold)",
        strategyStyle:
            "Three-module limit execution",
        recommendedLeverage: "Broker / margin dependent",
        setupDifficulty: "Intermediate",
        specHighlights: [
            {
                label: "Entry Type",
                value: "BUY LIMIT / SELL LIMIT only"
            },
            {
                label: "H1 Runtime Preset",
                value: "0.02 lot · $10 SL · 1:2 R:R"
            },
            {
                label: "Modules",
                value: "MSNR + OTE ON · S&R OFF"
            },
            {
                label: "Optional Protection",
                value: "BE OFF · daily limit OFF"
            }
        ],
        accentRing: "ring-amber-500/15 dark:ring-amber-400/15",
        bullets: [
            "Three independent zone engines and limit-only entries",
            "Fixed base lots with individual broker-side SL/TP",
            "Chart-dependent runtime presets at the declared 1:2 R:R",
            "Optional +1.3R breakeven; no current DCA mode"
        ],
        parameters: [
            {
                group: "Source Version",
                name: "EA source version",
                defaultValue: "2.00",
                description: "Documented from the supplied GoldScalperNinja_SNR.mq5 and its included modules. This is the source version, not a verification of the downloaded binary."
            },
            {
                group: "License & Telemetry",
                name: "InpSyncApiKey",
                defaultValue: "Empty",
                description: "Personal license/API key. With license checks enabled, an empty or unverified key blocks new limit deployment and removes pending orders; open positions remain managed."
            },
            {
                group: "License & Telemetry",
                name: "InpSyncApiUrl",
                defaultValue: "https://thenexttrade.app",
                description: "Primary license and telemetry server. The source also lists raw.githubusercontent.com and api.github.com as backup WebRequest hosts."
            },
            {
                group: "Strategy Modules",
                name: "InpEnableMsnr",
                defaultValue: "true",
                description: "MSNR: A/V/GAP patterns and RBS/SBR support/resistance flips."
            },
            {
                group: "Strategy Modules",
                name: "InpEnableOte",
                defaultValue: "true",
                description: "ICT structure-change and OTE retracement scanning. Zones are executed with limit orders, not market chasing."
            },
            {
                group: "Strategy Modules",
                name: "InpEnableSnr",
                defaultValue: "false",
                description: "Optional Dynamic S&R / swing levels / Bollinger Band engine."
            },
            {
                group: "Strategy Modules",
                name: "InpLookbackBars",
                defaultValue: "240",
                description: "Historical zone-scan lookback; the signal engine clamps the effective value to 80–500 bars."
            },
            {
                group: "Entry & SL/TP",
                name: "InpBaseLot",
                defaultValue: "0.02 (F7)",
                description: "An unchanged 0.02 input activates runtime lots: H1 0.02, M30 0.04, M15 0.02, M5 0.01. Other chart periods use 0.02. Broker lot constraints still apply."
            },
            {
                group: "Entry & SL/TP",
                name: "InpSlPriceDist",
                defaultValue: "5.00 (F7)",
                description: "An unchanged 5.00 input activates runtime SL price distances: H1 (and any higher period) $10, M30 $7.50, M15 $5, M5 $4; other periods use $5. This is not dollar P/L risk."
            },
            {
                group: "Entry & SL/TP",
                name: "InpRrRatio",
                defaultValue: "2.00",
                description: "InitRuntimeConfig keeps the declared 2.00 and only substitutes 2.0 if the input is below 0.2. TP distance = SL price distance × R:R, i.e. $20 / $15 / $10 / $8 for the H1 / M30 / M15 / M5 presets."
            },
            {
                group: "Entry & SL/TP",
                name: "InpMinPriceDist",
                defaultValue: "1.50",
                description: "Minimum price spacing from the current market and other relevant orders; on Gold this is a $1.50 quote-price distance."
            },
            {
                group: "Entry & SL/TP",
                name: "InpMaxPending",
                defaultValue: "6 per module",
                description: "Combined BUY + SELL pending cap for each module, not six across the whole EA. Runtime value is clamped to 1–30."
            },
            {
                group: "Entry & SL/TP",
                name: "InpAutoBreakeven",
                defaultValue: "false",
                description: "When enabled, triggers at +1.3R and attempts to move SL to entry plus/minus a five-point offset, subject to broker stop constraints."
            },
            {
                group: "Entry & SL/TP",
                name: "InpAutoRescanNewBar",
                defaultValue: "true",
                description: "Refreshes zone scans on a new candle of the chart timeframe. RESCAN is also available on the command deck."
            },
            {
                group: "Entry & SL/TP",
                name: "InpEnforceTrend",
                defaultValue: "true (telemetry)",
                description: "Tracks the H1 Storyline context. The current execution path does not reject a limit solely because it opposes that storyline."
            },
            {
                group: "Protection & Dashboard",
                name: "InpMaxDailyLossPct",
                defaultValue: "0.0 (OFF)",
                description: "Optional drawdown gate measured against day-start equity. It is not a guaranteed liquidation cap, and open positions retain their individual SL/TP."
            },
            {
                group: "Protection & Dashboard",
                name: "InpMagicBase",
                defaultValue: "20260900",
                description: "The three modules use Base, Base+1 and Base+2 to identify their own orders and positions."
            },
            {
                group: "Protection & Dashboard",
                name: "InpSlippagePoints",
                defaultValue: "20",
                description: "Configured execution deviation in points. Broker execution and symbol constraints still apply."
            },
            {
                group: "Protection & Dashboard",
                name: "InpEnableDashboard",
                defaultValue: "true",
                description: "Shows the on-chart command deck for module controls, order management, RESCAN and live SL/TP settings."
            }
        ],
        logic: [
            "Validate the license, initialize symbol/broker constraints, then apply the chart-timeframe runtime presets. F7 values that match the declared defaults can be replaced during initialization.",
            "Scan MSNR patterns, ICT structure-change/OTE retracements and the optional Dynamic S&R engine independently using the historical lookback.",
            "For each enabled module, select valid zones and place fixed-base-lot BUY LIMIT / SELL LIMIT orders with individual broker SL/TP, minimum spacing and a combined per-module pending cap.",
            "Automatically refresh zones on a new chart candle when enabled. The H1 Storyline is telemetry; it does not by itself veto counter-storyline orders.",
            "If optional breakeven is enabled, attempt SL-to-entry adjustment with a five-point offset after +1.3R. Keep broker stop/freeze-level constraints in mind.",
            "DELETE PENDING BUY or SELL also locks that side until RESCAN. CLOSE ALL closes managed open positions; do not assume it also deletes every pending order.",
            "License revocation or failed authorization prevents new deployment and removes pending orders while keeping management of existing positions active. Connectivity and broker execution remain necessary."
        ],
        faqs: [
            {
                question: "Does this SNR version include DCA or martingale recovery?",
                answer: "No. The supplied v2.00 source places fixed-base-lot zone limits with individual SL/TP. It does not implement the old Single/DCA modes, additive/multiplicative recovery lots or stepped basket trailing."
            },
            {
                question: "Why is my effective SL/TP different from the F7 default?",
                answer: "Lot defaults and SL price distances are rewritten by timeframe: an untouched 0.02 lot / 5.00 SL becomes H1 0.02 / $10, M30 0.04 / $7.50, M15 0.02 / $5, M5 0.01 / $4. InpRrRatio is not rewritten — it stays at the declared 2.00, so TP = SL × 2. The panel shows the runtime configuration."
            },
            {
                question: "When does automatic breakeven activate?",
                answer: "It is OFF by default. When enabled, the current trade manager triggers at +1.3R and attempts to move SL to entry with a five-point offset, subject to broker constraints."
            },
            {
                question: "Does the H1 Storyline stop trades against the trend?",
                answer: "No. InpEnforceTrend is used for H1 Storyline context/telemetry in this source. The active deployment logic does not reject entries solely because of that direction."
            },
            {
                question: "Are news, spread and session filters blocking entries?",
                answer: "The current SNR source does not contain a blocking news filter. IsSpreadAcceptable and IsActiveTradeSession return true. Session labels and H1 context must not be interpreted as enforced entry filters."
            },
            {
                question: "Is six the pending limit across the entire EA?",
                answer: "No. InpMaxPending applies to the combined BUY + SELL pending count of each module. MSNR and OTE are both enabled initially; already filled positions are not counted as pending orders."
            },
            {
                question: "Why are there no new BUY or SELL limits after deleting a side?",
                answer: "The corresponding DELETE PENDING action locks that side until RESCAN. Check the side lock, enabled modules, license state, spacing and pending cap when diagnosing missing orders."
            },
            {
                question: "Does CLOSE ALL also cancel pending orders?",
                answer: "The current CLOSE ALL handler closes managed positions. Pending orders use separate DELETE PENDING BUY and SELL actions; use those controls as well when you intend to clear pending exposure."
            }
        ],
        colorTheme: "gold",
        functions: [
            {
                title: "MSNR Pattern Engine",
                desc: "Scans A-shape, V-shape and gap structures plus RBS/SBR role reversals. Uses its own magic number and independent zone/order state."
            },
            {
                title: "ICT CHoCH / OTE Engine",
                desc: "Builds retracement zones from structure changes, with the 0.618, 0.705 and 0.786 OTE levels used in the source."
            },
            {
                title: "Optional Dynamic S&R Engine",
                desc: "Adds swing support/resistance and Bollinger Band context when explicitly enabled; it is OFF in the supplied default configuration."
            },
            {
                title: "Individual SL/TP Limit Orders",
                desc: "Each pending entry carries its own stop/target and fixed base lot. There is no current DCA multiplier, basket recovery solver or stepped recovery trailing mode."
            },
            {
                title: "Timeframe Runtime Presets",
                desc: "Untouched inputs initialize different lots, SL distances and spacing by chart timeframe, all at the declared 1:2 R:R. Review the command deck after initialization to see the effective configuration."
            },
            {
                title: "Interactive Command Deck",
                desc: "Control modules, rescan zones, lock a pending side and close managed positions. Auto-rescan, optional breakeven and the profit calendar assist ongoing management."
            }
        ],
        setupSteps: [
            {
                step: "01",
                title: "Install the Supplied SNR Release",
                desc: "Place the compiled SNR .ex5 in MQL5/Experts and refresh Navigator. If compiling from source, keep the supplied include modules and shared GSN telemetry dependencies available to MetaEditor."
            },
            {
                step: "02",
                title: "Authorize License and Telemetry",
                desc: "Allow WebRequest to https://thenexttrade.app, https://raw.githubusercontent.com and https://api.github.com. Enter your personal key in InpSyncApiKey; verify the license is accepted before expecting new limits."
            },
            {
                step: "03",
                title: "Choose the Chart Timeframe Deliberately",
                desc: "Check the runtime lot, SL and spacing preset for H1, M30, M15 or M5. Untouched F7 values are rewritten per timeframe, while the 1:2 R:R stays at the declared InpRrRatio = 2.00."
            },
            {
                step: "04",
                title: "Check Modules and Effective Risk",
                desc: "Defaults enable MSNR and OTE, disable Dynamic S&R, allow six pending orders per module, and leave breakeven and the daily drawdown breaker OFF. Confirm spacing, volume and effective SL/TP in the panel."
            },
            {
                step: "05",
                title: "Validate the Command Deck on Demo",
                desc: "Enable Algo Trading, inspect Experts/Journal, and test a scan, a limit fill, SL/TP, optional +1.3R breakeven, side deletion/locking and RESCAN. Keep the managing terminal connected."
            }
        ],
        riskControls: [
            {
                title: "Price Distance Is Not Account Risk",
                desc: "A $5 XAUUSD SL is a quote-price distance. Dollar account risk also depends on volume, contract size, currency, spread and execution; it is not a fixed $5 loss."
            },
            {
                title: "Check the Runtime Preset",
                desc: "Default-looking F7 inputs can become chart-dependent lots, SL distances and spacing during initialization, while the 1:2 R:R is unchanged. Verify the effective panel values before enabling execution."
            },
            {
                title: "Pending Caps Are Per Module",
                desc: "Six is the default combined BUY + SELL pending cap for each module. Enabling additional modules increases potential exposure; the cap does not limit the total number of already filled positions."
            },
            {
                title: "Optional Breakers Start OFF",
                desc: "Auto breakeven is false and the daily drawdown limit is 0. H1 Storyline telemetry does not enforce direction; the current source has no blocking news filter and permissive spread/session checks."
            },
            {
                title: "Close Positions and Delete Pending Orders Separately",
                desc: "CLOSE ALL manages open positions; side-specific DELETE PENDING controls remove pending orders and lock that side until RESCAN. Use the relevant controls together when intentionally clearing exposure."
            }
        ],
    },
];

export function getSystemBySlug(slug: string): SystemData | undefined {
    const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized === "gsnsnrsystem") {
        return TRADING_SYSTEMS_DATA.find((s) => s.slug === "snr-system");
    }
    if (
        normalized === "gsnphoenixgrid" ||
        normalized === "gsnshadowmatrix" ||
        normalized === "gsnshadownmatrix" ||
        normalized === "shadowmatrix" ||
        normalized === "shadownmatrix"
    ) {
        return TRADING_SYSTEMS_DATA.find(
            (s) => s.slug === "shadow-matrix"
        );
    }
    return TRADING_SYSTEMS_DATA.find(
        (s) => s.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
    );
}

export function getCanonicalSystemPageSlug(slug: string): string {
    const matched = getSystemBySlug(slug);
    return matched ? matched.slug : slug.trim().toLowerCase();
}
