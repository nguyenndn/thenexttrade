import { Bot, SlidersHorizontal, Wrench, LucideIcon } from "lucide-react";

export interface SystemParameter {
  name: string;
  defaultValue: string;
  description: string;
}

export interface SystemFaq {
  question: string;
  answer: string;
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
  accentRing: string;
  version?: string;
  bullets: string[];
  parameters: SystemParameter[];
  logic: string[];
  faqs: SystemFaq[];
}

export const TRADING_SYSTEMS_DATA: SystemData[] = [
  {
    slug: "goldscalperninja",
    title: "EA GoldScalperNinja",
    description: "An MT5 Expert Advisor built for XAUUSD workflows, structured entries, and disciplined execution support.",
    longDescription: "EA GoldScalperNinja is our flagship algorithmic trading system designed specifically for the gold (XAUUSD) market. It uses high-probability momentum breakouts combined with structural price action analysis to target brief yet powerful price movements. Featuring institutional-grade risk management and strict daily stop limits, it is built to protect trading accounts from catastrophic market reversals while capturing consistent short-term gains.",
    type: "AUTO_TRADE",
    platform: "MT5",
    icon: Bot,
    targetAsset: "XAUUSD (Gold)",
    strategyStyle: "Momentum Breakout & Scalping",
    recommendedLeverage: "1:100 or higher",
    setupDifficulty: "Easy (5 min)",
    accentRing: "ring-gold/20",
    bullets: [
      "MT5 Expert Advisor",
      "XAUUSD-focused workflow",
      "Unlock with eligible account"
    ],
    parameters: [
      { name: "MagicNumber", defaultValue: "20261001", description: "Unique tracking ID for the EA's orders on this chart." },
      { name: "LotSize", defaultValue: "0.01", description: "Base trade size for position execution when using static lotting." },
      { name: "MaxSpreadPoints", defaultValue: "35", description: "Maximum allowable spread (in points) before entry is blocked." },
      { name: "RiskPercent", defaultValue: "1.0", description: "Percentage of account balance risked per trade (overrides static LotSize if > 0)." },
      { name: "StopLossPips", defaultValue: "150", description: "Hard stop loss distance in standard pips (1 pip = 10 points on Gold)." },
      { name: "TakeProfitPips", defaultValue: "300", description: "Take profit target distance in standard pips." },
      { name: "EnableTrailingStop", defaultValue: "true", description: "Activates trailing stop logic to protect profits on running trades." },
      { name: "TrailingStartPips", defaultValue: "100", description: "Minimum pips in profit required before trailing stop begins moving." },
      { name: "TrailingStepPips", defaultValue: "20", description: "Minimum increment change to update the trailing stop level." }
    ],
    logic: [
      "Identifies key local support and resistance boundaries on lower timeframes (M5/M15).",
      "Uses a custom volatility index (ATR-based) to verify that a breakout has genuine volume support.",
      "Automatically applies strict daily maximum drawdown limits to prevent overtrading during low-liquidity sessions.",
      "Includes an optional news filter to temporarily disable entries 15 minutes before and after high-impact economic releases."
    ],
    faqs: [
      { question: "Does this EA run 24/7?", answer: "Yes, it runs continuously when your MT5 terminal is active or hosted on a VPS. However, it will only open positions during key active trading hours (London and New York sessions) when volatility is high." },
      { question: "Can I use it on other currency pairs?", answer: "While you can technically drag it onto other charts, the core breakout algorithm, default spreads, and volatility parameters are highly optimized and backtested specifically for XAUUSD (Gold)." },
      { question: "What is the recommended starting balance?", answer: "We recommend a minimum starting balance of $200 for micro-lot (0.01) trading. For professional risk settings (1% per trade), a starting capital of $1,000 is recommended." }
    ]
  },
  {
    slug: "trade-manager",
    title: "Trade Manager",
    description: "Manage entries, stop loss, take profit, and risk actions faster during live execution.",
    longDescription: "Trade Manager is a premium utility overlay panel for MetaTrader 5 that converts manual trading into a precise, high-speed operation. Instead of entering parameters manually, the interface allows manual traders to execute orders with 1-click, automatically calculating position sizes based on desired account risk percentage and stop-loss levels. It also features automatic break-even shifts and trailing controls.",
    type: "MANUAL_ASSIST",
    platform: "BOTH",
    icon: SlidersHorizontal,
    targetAsset: "All Symbols (FX, Crypto, Indices, Gold)",
    strategyStyle: "Execution Assist & Risk Management Tool",
    recommendedLeverage: "Any",
    setupDifficulty: "Very Easy (2 min)",
    accentRing: "ring-blue-500/15 dark:ring-blue-400/15",
    bullets: [
      "Faster order management",
      "Risk controls at execution",
      "Built for active MT5 traders"
    ],
    parameters: [
      { name: "ShowHotkeys", defaultValue: "true", description: "Display hotkey letter overlays (e.g. 'B' for Buy, 'S' for Sell) on the chart panel." },
      { name: "DefaultStopLoss", defaultValue: "100", description: "Default Stop Loss distance in pips initialized on start." },
      { name: "DefaultTakeProfit", defaultValue: "200", description: "Default Take Profit distance in pips initialized on start." },
      { name: "AutoBreakEven", defaultValue: "true", description: "Automatically shifts Stop Loss to the entry price once Target 1 is hit." },
      { name: "BreakEvenPips", defaultValue: "50", description: "Minimum pips in profit needed before moving Stop Loss to break even." },
      { name: "PartialClosePercent", defaultValue: "50.0", description: "The percentage of the total trade volume to close automatically at Target 1." }
    ],
    logic: [
      "Calculates the exact lot size for every manual trade in real-time, matching your preset risk parameter (e.g. 0.5% or 1%).",
      "Renders dynamic target lines on your chart that can be dragged manually to adjust Stop Loss or Take Profit levels before clicking execute.",
      "Includes a 'Close All' panic button that immediately clears all open orders and pending limits on the active symbol."
    ],
    faqs: [
      { question: "Is this tool a robot that opens trades for me?", answer: "No, this is an execution assistant. You decide when to buy or sell. Once you click the button, the panel immediately calculates risk and places the trade with all stop levels and trailing mechanisms pre-attached." },
      { question: "Does it work on indices and crypto?", answer: "Yes, it works on any financial asset supported by your MT5 broker, including indices (US30, GER40) and cryptocurrencies (BTCUSD)." }
    ]
  },
  {
    slug: "partner-ea-toolkit",
    title: "Partner EA Toolkit",
    description: "Additional MT5 tools and setup resources for traders who qualify through the partner account path.",
    longDescription: "The Partner EA Toolkit is an exclusive package of secondary Expert Advisors, trend indicators, and trading resources designed to diversify risk. Available only to members who connect their trading accounts through our verified broker partners, this toolkit helps traders build a multi-asset automated portfolio to run alongside the core GoldScalperNinja system.",
    type: "AUTO_TRADE",
    platform: "MT5",
    icon: Wrench,
    targetAsset: "EURUSD, GBPUSD, USDJPY",
    strategyStyle: "Multi-Asset Grid & Swing Portfolio",
    recommendedLeverage: "1:100 or higher",
    setupDifficulty: "Medium (10 min)",
    accentRing: "ring-emerald-500/15 dark:ring-emerald-400/15",
    bullets: [
      "Extra EA resources",
      "Setup guides included",
      "Community support path"
    ],
    parameters: [
      { name: "PortfolioMode", defaultValue: "true", description: "Enables concurrent trading setups on multiple whitelisted pairs." },
      { name: "DailyLossLimitPercent", defaultValue: "2.0", description: "Maximum account equity drawdown allowed in a single day before EA terminates." },
      { name: "CorrelationFilter", defaultValue: "true", description: "Blocks trade entry on highly correlated pairs to reduce compounding exposure." },
      { name: "SlippagePoints", defaultValue: "3", description: "Maximum allowable slippage in points before order is rejected." }
    ],
    logic: [
      "Monitors multi-pair price correlation to avoid overexposure to USD swings.",
      "Uses a hybrid grid-swing strategy to benefit from both trending markets and range-bound consolidations.",
      "Auto-scales grid steps based on current average daily range (ADR) of each asset."
    ],
    faqs: [
      { question: "How do I unlock the Partner Toolkit?", answer: "You must sign up with one of our approved partner brokers using our referral link, deposit the minimum capital required by the broker, and verify the account number in your TheNextTrade dashboard." },
      { question: "Can I use the tools on multiple broker accounts?", answer: "Once unlocked, you can link the toolkit to any accounts verified and approved under your profile in our system." }
    ]
  }
];

export function getSystemBySlug(slug: string): SystemData | undefined {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TRADING_SYSTEMS_DATA.find(
    s => s.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );
}
