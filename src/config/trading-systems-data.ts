import { Bot, SlidersHorizontal, LucideIcon } from "lucide-react";

export interface SystemParameter {
  name: string;
  defaultValue: string;
  description: string;
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
  type: "AUTO_TRADE" | "MANUAL_ASSIST" | "INDICATOR";
  platform: "MT5" | "MT4" | "BOTH";
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
    title: "EA GoldScalperNinja",
    version: "v3.0",
    description: "Automated MT5 Expert Advisor with D1 Trend Master filters and Smart Sequence Pruning.",
    longDescription: "<strong>EA GoldScalperNinja</strong> is a professional-grade automated trading system engineered specifically for the volatile <strong>XAUUSD (Gold)</strong> market. Replacing rigid grid strategies, it features a revolutionary <span class=\"text-gold font-extrabold\">Smart Sequence Pruning</span> (rolling recovery) system that utilizes scalp profits from new trades to systematically trim and close the deepest drawdown positions. Directional control is governed by the proprietary <span class=\"text-gold font-extrabold\">Trend Master</span> module on the Daily (D1) timeframe, restricting entries to high-probability zones. Equipped with an MQL5 <strong>News Filter</strong>, daily safety limits, and a <strong>Mobile Remote Control</strong> switch.",
    type: "AUTO_TRADE",
    platform: "MT5",
    icon: Bot,
    targetAsset: "XAUUSD (Gold)",
    strategyStyle: "Daily Trend Master & Smart Sequence Pruning",
    recommendedLeverage: "1:100 or higher",
    setupDifficulty: "Easy (5 min)",
    specHighlights: [
      { label: "Primary Timeframe", value: "D1 Trend Master bias" },
      { label: "Entry Mode", value: "Stop, StopLimit, or Virtual Stop" },
      { label: "Remote Control", value: "MT5 mobile pending-order switch" },
      { label: "Safety Stack", value: "News filter, daily limits, safe close" },
    ],
    accentRing: "ring-gold/20",
    bullets: [
      "D1 Trend Master momentum filter",
      "Smart Sequence Pruning (rolling recovery)",
      "Virtual Stop entry mode option",
      "Mobile remote control via pending orders"
    ],
    parameters: [
      { name: "Trade direction mode", defaultValue: "Auto Trend Master", description: "Master trade control. Options: Only BUY, Only SELL, BUY & SELL, or Auto Trend Master." },
      { name: "Allow entries in trend direction", defaultValue: "true", description: "Permits opening additional grid trades in the direction of the current trend." },
      { name: "Above this % -> prefer BUY (0-100)", defaultValue: "75", description: "When price >= 75% of the zone, restricts sell entries." },
      { name: "Below this % -> prefer SELL (0-100)", defaultValue: "25", description: "When price <= 25% of the zone, restricts buy entries." },
      { name: "Entry mode", defaultValue: "Stop", description: "Execution style. Options: standard Stop orders, StopLimit, or Virtual Stop." },
      { name: "First grid step (points)", defaultValue: "30", description: "Price distance from the current market price to the very first pending order." },
      { name: "Grid step (points)", defaultValue: "100", description: "Standard price interval for placing consecutive grid orders." },
      { name: "Exponential lot multiplier", defaultValue: "1.5", description: "Martingale lot size multiplier applied to subsequent grid levels." },
      { name: "Enable sequence pruning", defaultValue: "true", description: "Enables Smart Pruning which uses new winning trades to trim old losing ones." },
      { name: "Activate when total orders >= this", defaultValue: "6", description: "The grid must reach this many open trades before pruning begins." },
      { name: "Daily profit target $ (0=off)", defaultValue: "0.0", description: "The daily target in currency to close all orders and lock in gains." },
      { name: "Daily max loss $ (0=off)", defaultValue: "0.0", description: "The maximum acceptable daily drawdown limit before cutting all trades." },
      { name: "Enable news filter", defaultValue: "true", description: "Pauses first-order initialization 15 minutes before and after high-impact news." },
      { name: "Enable remote control via pending orders", defaultValue: "true", description: "Enables remote ON/OFF control from the MT5 mobile app using specific trigger prices." }
    ],
    logic: [
      "Trend Master calculates daily limits using yesterday's candle volatility (Z-value) and N-day Average ATR.",
      "Dynamic Control Zone locks the EA into Uptrend bias, Downtrend bias, or Sideways range trading.",
      "Smart Sequence Pruning pairs new profitable positions with the oldest negative ones to close at a net positive profit.",
      "Virtual Stop mode hides active pending orders from the broker's book to prevent slippage and stop hunting."
    ],
    faqs: [
      { question: "How does the Trend Master filter work?", answer: "At the start of each day, it projects a dynamic Control Zone. If price breaks the upper limit, the EA restricts sell entries. If it breaks the lower limit, it restricts buy entries. If it stays inside, it trades both directions (sideways market)." },
      { question: "What is Smart Sequence Pruning?", answer: "Instead of waiting for a full market reversal to recover a drawdown, the EA uses profits from fresh trades to close out the deepest losing orders in the background, continuously shrinking the basket size." },
      { question: "Can I control the EA from my mobile phone?", answer: "Yes. By placing a Buy Limit exactly at your pre-configured Magic Price, you can turn the EA ON remotely. Placing a Sell Limit at that price turns the EA OFF, straight from your MT5 mobile app." }
    ],
    metrics: {
      winRate: "68.4%",
      profitFactor: "1.85",
      maxDrawdown: "4.2%",
      monthlyAvg: "4.8% - 7.5%",
      verifiedLink: "https://myfxbook.com/members/thenexttrade/goldscalperninja-real/10294815"
    },
    colorTheme: "gold",
    functions: [
      {
        title: "Rule-Based Execution",
        desc: "Executes trades based on predefined technical structures, eliminating manual order entry hesitation."
      },
      {
        title: "Dynamic Position Sizing",
        desc: "Calculates lot sizes dynamically based on your set account risk percentage and stop-loss distance."
      },
      {
        title: "Automated Profit Management",
        desc: "Manages active positions with multi-stage Take Profit, Trailing Stop, and Break-Even protection."
      }
    ],
    setupSteps: [
      {
        step: "01",
        title: "Download EA File",
        desc: "Retrieve the compiled .ex5 file from your dashboard once your partner account is verified."
      },
      {
        step: "02",
        title: "Deploy to MT5 Directory",
        desc: "Open MT5, go to File > Open Data Folder, navigate to MQL5/Experts, and paste the downloaded file."
      },
      {
        step: "03",
        title: "Configure Allow DLL",
        desc: "Drag the EA onto your XAUUSD chart. In the common tab, check 'Allow DLL imports' and 'Allow Algo Trading'."
      },
      {
        step: "04",
        title: "Load Presets",
        desc: "Apply the recommended .set files provided in your dashboard to sync optimal starting parameters."
      }
    ],
    riskControls: [
      {
        title: "Start on Demo/Cent Accounts",
        desc: "Always test the EA's execution behavior on a demo or small cent account to understand its parameter scaling."
      },
      {
        title: "VPS Recommended",
        desc: "Run MT5 on a reliable Virtual Private Server (VPS) with low latency to ensure continuous connection and execution."
      },
      {
        title: "News Filter Management",
        desc: "Consider pausing automated algo trading during major macroeconomic events (like NFP or FOMC) to avoid high slippage."
      }
    ]
  },
  {
    slug: "trade-manager",
    title: "Trade Manager",
    version: "v1.4",
    description: "Premium overlay panel for manual execution, multi-timeframe trend matrix, semi-auto DCA grids, and direct trade journal sync.",
    longDescription: "<strong>GSN Trade Manager</strong> is a premium MT5 execution panel designed to convert manual analysis into high-speed, flawless operations. It features <strong>1-click risk-calculated entries</strong>, automated Breakeven, and multi-stage Take Profits. The utility integrates a <span class=\"text-blue-500 font-extrabold dark:text-blue-400\">Multi-Timeframe Trend Matrix</span> for indicator confluence alongside a <strong>Semi-Auto DCA Grid</strong> engine that adopts mobile trades. With the new <strong>Sync API Tab</strong>, all active executions are logged directly to your web trading journal in real time without any desktop helpers.",
    type: "MANUAL_ASSIST",
    platform: "MT5",
    icon: SlidersHorizontal,
    targetAsset: "All Symbols (FX, Crypto, Indices, Gold)",
    strategyStyle: "Execution Assist & Semi-Auto DCA Grid",
    recommendedLeverage: "Any",
    setupDifficulty: "Very Easy (2 min)",
    specHighlights: [
      { label: "Panel Mode", value: "Manual chart overlay" },
      { label: "Order Tools", value: "SL, TP, BE, partial close" },
      { label: "Trend Context", value: "Multi-timeframe matrix" },
      { label: "Journal Sync", value: "Built-in API (SYNC tab)" },
    ],
    accentRing: "ring-blue-500/15 dark:ring-blue-400/15",
    bullets: [
      "1-Click dynamic risk execution",
      "Multi-timeframe Trend Matrix (6x7)",
      "Semi-Auto DCA Grid with trailing TP",
      "Direct trading journal Sync (API Key)",
      "Mobile trade adoption (Magic 0)"
    ],
    parameters: [
      { name: "Lot Size", defaultValue: "0.1", description: "Base trade size for manual execution when using static lot size." },
      { name: "Zone (pips)", defaultValue: "70", description: "Grid spacing distance between orders for manual grid setups." },
      { name: "BE Offset (pips)", defaultValue: "10", description: "Minimum profit offset added to entry price when Stop Loss is moved to Breakeven." },
      { name: "Max Risk (%)", defaultValue: "1.0", description: "Blocks new positions if the current account risk percentage exceeds this limit." },
      { name: "TP1 / TP2 / TP3", defaultValue: "50 / 100 / 200", description: "Take profit targets in pips with custom position counts to scale out." },
      { name: "EnableSATrailingTP", defaultValue: "false", description: "Enables virtual trailing take profit for the Semi-Auto grid." },
      { name: "SATrailingDistancePips", defaultValue: "5.0", description: "Trailing distance in pips used to trail the grid's average take profit." },
      { name: "Sync API Key", defaultValue: "None", description: "Your unique API key generated from the Sync Settings page on your dashboard to pair MT5 with your trading journal." }
    ],
    logic: [
      "Dynamic lot sizing automatically calculates the position volume based on stop-loss pips and account risk percent.",
      "Trend Tab calculates trend scoring using weighted indicators (EMA Sonic R, ADX, RSI, MACD, S&R, Volume Divergences).",
      "Mobile Trade Adoption automatically detects, attaches stop levels to, and DCA-grids manual trades placed via mobile apps.",
      "Built-in Sync Module uses asynchronous HTTP requests to forward trading heartbeats and execution details directly to the dashboard.",
      "Auto Broker Pip Size Detection normalizes all calculations for Gold (3 digits) and Forex (5 digits) decimal pricing."
    ],
    faqs: [
      { question: "How does the built-in SYNC tab work?", answer: "The SYNC tab lets you paste your Sync API Key directly inside MT5. When connected, the EA whitelists our secure API gateway using WebRequests and automatically logs every transaction directly to your web dashboard journal in real time." },
      { question: "How does the Mobile Trade Adoption work?", answer: "When MOBILE DCA is ON, the EA on your VPS monitors the account for manual trades opened on the symbol from your phone (Magic 0). It immediately adopts the trade, adjusts SL/TP, and opens grid orders if price moves adversely." },
      { question: "What indicators are used in the Trend matrix?", answer: "It scans 7 timeframes (M1 to D1) for 6 key indicators: EMA crossover (Sonic R 34/89), ADX trend filter (>25), RSI momentum, MACD crossover, S&R levels, and volume-confirmed breakout signals." },
      { question: "What is Virtual Trailing Take Profit?", answer: "When enabled, the EA hides your take profit lines from the broker. Once price hits the average target, it trails the profit level dynamically and closes the grid locally on a price retracement." }
    ],
    colorTheme: "blue",
    functions: [
      {
        title: "One-Click Lot Calculation",
        desc: "Instantly computes risk-aligned lot sizes on screen before you hit buy or sell."
      },
      {
        title: "Rapid Execution Panel",
        desc: "Provides physical buttons on your MT5 chart for fast Break-Even, trailing adjustments, and partial closes."
      },
      {
        title: "Multi-Symbol Compatibility",
        desc: "Works seamlessly on all MT5 charts and symbols without needing custom asset presets."
      }
    ],
    setupSteps: [
      {
        step: "01",
        title: "Get EA File",
        desc: "Download the compiled Trade Manager .ex5 file from the Trading Systems dashboard section."
      },
      {
        step: "02",
        title: "Place in Experts folder",
        desc: "In MT5, open the Data Folder, navigate to MQL5/Experts, and drop the file there."
      },
      {
        step: "03",
        title: "Enable Chart Settings",
        desc: "Drag the Expert Advisor to any active chart and verify that DLL imports are enabled to allow panel drawing."
      },
      {
        step: "04",
        title: "Execute Live",
        desc: "Use the on-screen panel to manage your manual trades with precise risk parameters."
      }
    ],
    riskControls: [
      {
        title: "Visual Offset Verification",
        desc: "Double-check your stop-loss and take-profit line offsets on the panel before clicking execute."
      },
      {
        title: "Spread Awareness",
        desc: "Be aware of wide broker spreads during session transitions which may impact manual execution triggers."
      },
      {
        title: "Keyboard Shortcuts",
        desc: "Familiarize yourself with the visual buttons on a demo chart first to avoid accidental double-clicks."
      }
    ]
  },
  {
    slug: "gsn-phoenix-grid",
    title: "GSN Phoenix Grid",
    version: "v1.0",
    description: "5-Layer modular adverse DCA grid with Profit Bank harvesting and Macro-Trend filters.",
    longDescription: "<strong>GSN Phoenix Grid</strong> is a professional Expert Advisor for Gold built on a strict <strong>5-Layer Modular Architecture</strong>. Designed for adaptive survival, it dynamically adjusts grid spacing and multipliers across 3 drawdown levels. At its core, the proprietary <span class=\"text-emerald-500 font-extrabold dark:text-emerald-400\">Phoenix Profit Bank</span> harvests scalp gains to peel off and prune the oldest, high-risk positions, pulling the average take-profit closer. Backed by a <strong>Multi-Layered Protection System (MLPS)</strong> and an <strong>Auto-Hedge</strong> recovery module to safely navigate vertical market trends.",
    type: "AUTO_TRADE",
    platform: "MT5",
    icon: Bot,
    targetAsset: "XAUUSD (Gold)",
    strategyStyle: "5-Layer Adaptive Survival Grid & Hedge Recovery",
    recommendedLeverage: "1:200 or higher",
    setupDifficulty: "Hard (15 min)",
    specHighlights: [
      { label: "Grid Engine", value: "5-layer adaptive survival logic" },
      { label: "Profit Module", value: "Phoenix Profit Bank trimming" },
      { label: "Recovery Mode", value: "Auto-hedge + isolated DCA" },
      { label: "Persistence", value: "MT5 global variable recovery" },
    ],
    accentRing: "ring-emerald-500/15 dark:ring-emerald-400/15",
    bullets: [
      "Multi-Layered Protection System (MLPS)",
      "Phoenix Profit Bank trim mechanics",
      "Auto-Hedge & isolated recovery grid",
      "State persistence & crash recovery (GV)"
    ],
    parameters: [
      { name: "BaseLot", defaultValue: "0.01", description: "Starting volume for the initial position of a new grid cycle." },
      { name: "LotMode", defaultValue: "Bù Lot", description: "Martingale calculation mode: Multiplier (recursive compounding) or Bù Lot (slippage compensation)." },
      { name: "Adaptive Risk Levels", defaultValue: "Level 1 / 2 / 3", description: "Transitions grid spacing and multipliers automatically based on floating loss thresholds." },
      { name: "ProfitBankGroupSize", defaultValue: "3", description: "Number of deep Level 3 positions grouped together to harvest scalp profits." },
      { name: "ProfitBankAutoTrim", defaultValue: "true", description: "Automatically triggers virtual bank funds to close the worst-performing Level 1 and 2 positions." },
      { name: "HedgeActivationPips", defaultValue: "150", description: "Maximum adverse movement in pips before locking drawdown with opposite positions." },
      { name: "RecoveryStep", defaultValue: "600", description: "Minimum grid spacing points for the isolated trend-following recovery grid." },
      { name: "HedgeCloseProfit", defaultValue: "10.0", description: "Reduced profit target in currency to exit the entire locked hedged basket." },
      { name: "MLPS_SpikeMultiplier", defaultValue: "2.5", description: "Candle high-low ATR multiplier to trigger cooling period grid stretching." },
      { name: "MLPS_ADXThreshold", defaultValue: "35", description: "ADX threshold on M5 timeframe to block counter-trend first-order entries." }
    ],
    logic: [
      "Volatility-Adaptive Grid Spacing (ATR Engine) compresses/stretches grid steps based on current market volatility.",
      "Phoenix Profit Bank harvests L3 layers at profit and uses Virtual Bank Balance to trim adverse L1/L2 positions.",
      "Multi-Layered Protection System (MLPS) checks H1 EMA confluence, M5 Spike stretching, and Dow weekly swing breakouts.",
      "Global Variables (GV) persist balance, sequence indexes, and re-entry locks to prevent reset upon terminal crashes."
    ],
    faqs: [
      { question: "What is the Multi-Layered Protection System (MLPS)?", answer: "It is a 3-layer defense system: Layer 1 blocks counter-trend cycles using H1 EMA; Layer 2 stretches spacing by 2.0x during M5 price spikes (news); Layer 3 blocks entries on ADX strength and shifts spacing on H1 weekly breakouts." },
      { question: "How does the Profit Bank reduce grid drawdowns?", answer: "It harvests scalp profits from the volatile Level 3 (martingale) positions and puts them into a virtual bank. The EA then uses this bank to pay off and close the highest-drawdown Level 1 and 2 positions, drawing break-even closer." },
      { question: "How does the Hedge Recovery module resolve locked positions?", answer: "When drawdown hits the activation threshold, the EA hedges the losing side. It then runs an isolated Recovery DCA grid on the winning side, using separate lot sizing sequences, to exit the entire basket at a small net-neutral target." }
    ],
    colorTheme: "emerald",
    functions: [
      {
        title: "Grid Recovery Leg",
        desc: "Deploys mathematical grid scaling with customized lot multipliers when positions move into floating drawdown."
      },
      {
        title: "Profit Bank Harvesting",
        desc: "Secures a percentage of active profits into a separate Profit Bank buffer prior to cycle completion."
      },
      {
        title: "Max Drawdown Protection",
        desc: "Monitors daily and total account drawdown thresholds, initiating an auto-close if limits are breached."
      }
    ],
    setupSteps: [
      {
        step: "01",
        title: "Retrieve EA File",
        desc: "Download the compiled GSN Phoenix Grid .ex5 file from your dashboard under verified accounts."
      },
      {
        step: "02",
        title: "Deploy to Experts folder",
        desc: "In MT5, open Data Folder, go to MQL5/Experts, and paste the downloaded file."
      },
      {
        step: "03",
        title: "Check EA Settings",
        desc: "Drag the EA onto your chart. Ensure 'Allow DLL imports' is enabled for recovery calculations."
      },
      {
        step: "04",
        title: "Load Recovery Presets",
        desc: "Import the designated recovery preset (.set) file from your dashboard to configure initial multipliers."
      }
    ],
    riskControls: [
      {
        title: "Exposure Warning",
        desc: "Grid and hedging algorithms can dramatically increase margins. Never run high multipliers without testing."
      },
      {
        title: "Lot Size Calibration",
        desc: "Always start with the absolute minimum base lot (0.01) to verify distance settings."
      },
      {
        title: "Drawdown Trim Limits",
        desc: "Keep conservative daily drawdown limits configured within the EA settings to prevent major margin calls."
      }
    ]
  }
];

export function getSystemBySlug(slug: string): SystemData | undefined {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TRADING_SYSTEMS_DATA.find(
    s => s.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );
}
