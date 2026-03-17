import { Calculator, Target, DollarSign, Percent, TrendingUp, BarChart3, AlertTriangle, GitBranch, Scale, Layers, Skull, Clock, Calendar, ArrowLeftRight, Activity, Flame, Grid3X3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolData {
    slug: string;
    title: string;
    shortTitle: string;
    description: string;
    icon: LucideIcon;
    color: string;
    iconBg: string;
    category: "risk-management" | "trade-calculators" | "technical-analysis" | "market-info";
    howToUse: { step: string; detail: string }[];
    whatIs: { heading: string; paragraphs: string[] };
    features: string[];
    faqs: { question: string; answer: string }[];
}

export const TOOL_CATEGORIES = [
    { id: "risk-management", name: "Risk Management" },
    { id: "trade-calculators", name: "Trade Calculators" },
    { id: "technical-analysis", name: "Technical Analysis" },
    { id: "market-info", name: "Market Info" },
] as const;

export const ALL_TOOLS: ToolData[] = [
    // ═══════════════════════════════════════
    // RISK MANAGEMENT
    // ═══════════════════════════════════════
    {
        slug: "position-size-calculator",
        title: "Position Size Calculator",
        shortTitle: "Position Size",
        description: "Calculate optimal lot size based on your risk percentage and stop loss distance.",
        icon: Calculator,
        color: "from-blue-500 to-cyan-500",
        iconBg: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
        category: "risk-management",
        howToUse: [
            { step: "Enter your account balance", detail: "The total amount in your trading account." },
            { step: "Set your risk percentage", detail: "Most professionals risk 1-2% per trade. Never risk more than you can afford to lose." },
            { step: "Enter your stop loss in pips", detail: "The distance from your entry to your stop loss level." },
            { step: "Select your currency pair", detail: "The pair you're planning to trade." },
            { step: "Read your lot size", detail: "Use this lot size for your trade to maintain proper risk management." },
        ],
        whatIs: {
            heading: "What is a Position Size Calculator?",
            paragraphs: [
                "A Position Size Calculator determines exactly how many lots to trade based on your account size, risk tolerance, and stop loss distance. This is the foundation of proper risk management.",
                "Instead of using random lot sizes, professional traders calculate position size for every trade to ensure consistent risk exposure, typically 1-2% of account balance per trade.",
                "Our calculator supports standard lots (100,000 units), mini lots (10,000 units), and micro lots (1,000 units) for precise position sizing across all currency pairs.",
            ],
        },
        features: ["Risk percentage input", "Stop loss in pips", "Account currency support", "All currency pairs", "Standard/mini/micro lots", "Real-time calculation"],
        faqs: [
            { question: "What is the ideal risk per trade?", answer: "Most professional traders risk between 1-2% of their account balance per trade. This ensures that even a series of losing trades won't significantly damage your account." },
            { question: "What's the difference between standard, mini, and micro lots?", answer: "A standard lot is 100,000 units, a mini lot is 10,000 units, and a micro lot is 1,000 units of the base currency. Smaller lots allow for more precise risk management." },
            { question: "Should I always use a stop loss?", answer: "Yes. Trading without a stop loss exposes you to unlimited risk. A stop loss defines your maximum loss per trade and is essential for consistent risk management." },
        ],
    },
    {
        slug: "risk-reward-calculator",
        title: "Risk/Reward Calculator",
        shortTitle: "Risk/Reward",
        description: "Visualize and calculate risk-to-reward ratios for your trade setups.",
        icon: Target,
        color: "from-cyan-500 to-teal-500",
        iconBg: "bg-cyan-500/10 text-cyan-500 dark:text-cyan-400",
        category: "risk-management",
        howToUse: [
            { step: "Enter your entry price", detail: "The price at which you plan to enter the trade." },
            { step: "Set your stop loss price", detail: "The price level where you'll exit if the trade goes against you." },
            { step: "Set your take profit price", detail: "The target price where you'll take your profits." },
            { step: "Choose trade direction", detail: "Select LONG (buy) or SHORT (sell) based on your analysis." },
            { step: "Analyze the R:R ratio", detail: "A minimum 1:2 ratio is recommended for consistent profitability." },
        ],
        whatIs: {
            heading: "What is a Risk/Reward Ratio?",
            paragraphs: [
                "The Risk/Reward Ratio (R:R) compares the potential profit of a trade to its potential loss. For example, a 1:3 R:R means you can make 3x what you risk.",
                "Understanding R:R is crucial because it determines the minimum win rate you need to be profitable. With a 1:2 ratio, you only need to win 33% of your trades to break even.",
                "Professional traders typically look for setups with at least a 1:2 risk/reward ratio, meaning the potential reward is at least twice the risk.",
            ],
        },
        features: ["Entry/Stop Loss/Take Profit inputs", "LONG and SHORT support", "R:R ratio calculation", "Break-even win rate", "Pip distance calculation", "Visual comparison"],
        faqs: [
            { question: "What is a good risk-to-reward ratio?", answer: "A minimum of 1:2 is commonly recommended. This means for every $1 you risk, you aim to make $2. Higher ratios like 1:3 or 1:5 are even better but harder to achieve consistently." },
            { question: "How does R:R affect win rate?", answer: "With a 1:1 R:R, you need a 50%+ win rate. With 1:2, you only need 33%+. With 1:3, just 25%+. Better R:R ratios allow you to be profitable with fewer winning trades." },
            { question: "Should I always aim for high R:R?", answer: "Not necessarily. Very high R:R setups (like 1:10) have lower probability. Find a balance between R:R ratio and win probability that suits your strategy." },
        ],
    },
    {
        slug: "drawdown-calculator",
        title: "Drawdown Calculator",
        shortTitle: "Drawdown",
        description: "Calculate the recovery percentage needed after experiencing account losses.",
        icon: AlertTriangle,
        color: "from-orange-500 to-red-500",
        iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        category: "risk-management",
        howToUse: [
            { step: "Enter your account balance", detail: "Your current or starting account balance." },
            { step: "Enter the drawdown percentage", detail: "The percentage of your account you've lost." },
            { step: "Review the recovery needed", detail: "See how much gain is required to recover your original balance." },
            { step: "Use the reference table", detail: "Click any row to instantly see the recovery % for common drawdown levels." },
        ],
        whatIs: {
            heading: "What is a Drawdown Calculator?",
            paragraphs: [
                "A Drawdown Calculator shows you how much percentage gain you need to recover from a trading loss. The math is asymmetric — a 50% loss requires a 100% gain to recover.",
                "This tool is critical for understanding why risk management matters. Small losses are easy to recover from (a 10% loss needs just 11.1% recovery), but larger losses become exponentially harder.",
                "Professional traders use drawdown awareness to set strict risk limits. Most prop firms cap maximum drawdown at 5-10% to protect capital.",
            ],
        },
        features: ["Account balance input", "Drawdown percentage", "Recovery % calculation", "Interactive reference table", "Severity color coding", "Loss amount display"],
        faqs: [
            { question: "Why is recovery harder than loss?", answer: "Because percentages work on different bases. If you lose 50% of $10,000, you have $5,000. To get back to $10,000, you need to gain $5,000 — which is 100% of your remaining $5,000." },
            { question: "What is maximum acceptable drawdown?", answer: "Most professional traders and prop firms consider 5-10% maximum drawdown acceptable. Beyond 20%, recovery becomes very difficult and often leads to revenge trading." },
            { question: "How can I minimize drawdown?", answer: "Use strict position sizing (1-2% risk per trade), set stop losses on every trade, avoid overtrading, and diversify across uncorrelated setups." },
        ],
    },
    {
        slug: "risk-of-ruin-calculator",
        title: "Risk of Ruin Calculator",
        shortTitle: "Risk of Ruin",
        description: "Calculate the probability of losing your entire trading capital based on your win rate and risk per trade.",
        icon: Skull,
        color: "from-red-500 to-rose-600",
        iconBg: "bg-red-500/10 text-red-600 dark:text-red-400",
        category: "risk-management",
        howToUse: [
            { step: "Enter your win rate", detail: "Your historical winning percentage (e.g., 55%)." },
            { step: "Set risk per trade", detail: "The percentage of your account you risk on each trade." },
            { step: "Set reward-to-risk ratio", detail: "Your average win size relative to your average loss." },
            { step: "Review probability", detail: "See your statistical probability of total account loss." },
        ],
        whatIs: {
            heading: "What is Risk of Ruin?",
            paragraphs: [
                "Risk of Ruin calculates the mathematical probability of losing your entire trading account based on your trading statistics — win rate, risk per trade, and reward/risk ratio.",
                "Even profitable strategies have some probability of ruin if the risk per trade is too high. A 60% win rate with 10% risk per trade has a much higher ruin probability than the same strategy with 2% risk.",
                "This calculator helps you understand why proper position sizing is essential. By reducing risk per trade, you can make the probability of ruin virtually zero.",
            ],
        },
        features: ["Win rate input", "Risk per trade %", "Reward/risk ratio", "Ruin probability %", "Visual risk gauge", "Scenario comparison"],
        faqs: [
            { question: "What is an acceptable risk of ruin?", answer: "Ideally below 1%. Professional traders aim for less than 0.1% risk of ruin. If your risk of ruin is above 5%, you should reduce your risk per trade immediately." },
            { question: "How does win rate affect risk of ruin?", answer: "Higher win rates dramatically reduce risk of ruin, but only when combined with proper position sizing. A 70% win rate with 20% risk per trade can still have significant ruin probability." },
            { question: "Can I have 0% risk of ruin?", answer: "Theoretically no, but you can make it negligibly small (like 0.001%) by risking 1% or less per trade with a positive expectancy strategy." },
        ],
    },

    // ═══════════════════════════════════════
    // TRADE CALCULATORS
    // ═══════════════════════════════════════
    {
        slug: "pip-value-calculator",
        title: "Pip Value Calculator",
        shortTitle: "Pip Value",
        description: "Calculate the monetary value of a pip for any currency pair and lot size.",
        icon: DollarSign,
        color: "from-green-500 to-emerald-500",
        iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
        category: "trade-calculators",
        howToUse: [
            { step: "Select your currency pair", detail: "Choose the forex pair, metal, or index you're trading." },
            { step: "Enter your lot size", detail: "The number of standard lots (1.0 = 100,000 units)." },
            { step: "Read the pip value", detail: "The dollar amount you gain or lose per pip movement." },
        ],
        whatIs: {
            heading: "What is Pip Value?",
            paragraphs: [
                "A pip (percentage in point) is the smallest standard price movement in forex. For most pairs, 1 pip = 0.0001. For JPY pairs, 1 pip = 0.01.",
                "Pip value tells you how much money you make or lose for each pip the market moves. For EUR/USD with 1 standard lot, 1 pip = $10.00.",
                "Knowing your pip value is essential for position sizing and risk management — it connects price movement to actual dollar amounts in your account.",
            ],
        },
        features: ["All major currency pairs", "Gold and Silver support", "Index support", "Standard/mini/micro lots", "Real-time calculation", "USD-denominated results"],
        faqs: [
            { question: "How is pip value calculated?", answer: "Pip value = (one pip / exchange rate) × lot size. For USD quote pairs like EUR/USD, it's simply 0.0001 × 100,000 = $10 per standard lot." },
            { question: "Why do JPY pairs have different pip values?", answer: "JPY pairs are quoted to 2 decimal places instead of 4, so 1 pip = 0.01 instead of 0.0001. The pip value also depends on the current USD/JPY exchange rate." },
            { question: "Does pip value change?", answer: "For pairs where USD is the quote currency (like EUR/USD), pip value is fixed at $10/lot. For other pairs, it fluctuates with the exchange rate." },
        ],
    },
    {
        slug: "profit-loss-calculator",
        title: "Profit/Loss Calculator",
        shortTitle: "Profit/Loss",
        description: "Calculate potential profit or loss based on entry, exit prices, and lot size.",
        icon: TrendingUp,
        color: "from-teal-500 to-green-500",
        iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
        category: "trade-calculators",
        howToUse: [
            { step: "Select trade direction", detail: "Choose LONG (buy) if you expect price to rise, SHORT (sell) if you expect it to fall." },
            { step: "Enter entry and exit prices", detail: "The price you enter at and the price you plan to exit." },
            { step: "Set your lot size", detail: "Number of standard lots for the trade." },
            { step: "Select currency pair", detail: "The pair you're trading to get accurate pip values." },
            { step: "Review your P/L", detail: "See projected profit or loss in dollars and pips." },
        ],
        whatIs: {
            heading: "What is a Profit/Loss Calculator?",
            paragraphs: [
                "A Profit/Loss Calculator projects your potential gain or loss before you enter a trade. It considers entry price, exit price, lot size, and direction (long/short).",
                "This tool is essential for trade planning — you should always know your potential outcome before placing a trade, not after.",
                "By combining P/L calculation with risk/reward analysis, you can make rational trading decisions based on numbers rather than emotions.",
            ],
        },
        features: ["Long and Short trades", "Entry/Exit price input", "Multiple lot sizes", "All currency pairs", "Pip count display", "Dollar P/L result"],
        faqs: [
            { question: "What's the difference between Long and Short?", answer: "Long means buying (profiting when price goes up). Short means selling (profiting when price goes down). The calculator adjusts the P/L formula based on your direction." },
            { question: "Does this include spread and commissions?", answer: "This calculator shows raw P/L without spread or commission costs. You should subtract your broker's spread and any commissions from the result for accurate net P/L." },
            { question: "Can I calculate Gold and Indices P/L?", answer: "Yes. Select XAUUSD for Gold or US30/US100 for indices. The calculator automatically adjusts pip values and contract sizes." },
        ],
    },
    {
        slug: "margin-calculator",
        title: "Margin Calculator",
        shortTitle: "Margin",
        description: "Calculate the required margin to open a leveraged forex position.",
        icon: Percent,
        color: "from-indigo-500 to-blue-500",
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        category: "trade-calculators",
        howToUse: [
            { step: "Enter lot size", detail: "The number of lots you plan to trade." },
            { step: "Select currency pair", detail: "The pair determines the contract size." },
            { step: "Enter current price", detail: "The current market price of the pair." },
            { step: "Set your leverage", detail: "Your broker's leverage ratio (e.g., 1:100, 1:500)." },
            { step: "Review required margin", detail: "The amount your broker will hold as collateral." },
        ],
        whatIs: {
            heading: "What is Margin in Forex?",
            paragraphs: [
                "Margin is the amount of money your broker requires as collateral to open a leveraged position. It's not a fee — it's held by your broker while your trade is open.",
                "With 1:100 leverage, you only need $1,000 margin to control a $100,000 position. This amplifies both profits and losses.",
                "Understanding margin requirements helps you avoid margin calls and ensures you have enough free margin for additional trades and to withstand market fluctuations.",
            ],
        },
        features: ["Leverage ratio input", "Current price input", "Multiple currency pairs", "Contract size awareness", "Margin requirement output", "Real-time calculation"],
        faqs: [
            { question: "What happens if I don't have enough margin?", answer: "Your broker will issue a margin call, requiring you to deposit more funds. If you don't, they may close your positions automatically to prevent further losses." },
            { question: "What is free margin?", answer: "Free margin = Equity - Used Margin. It's the amount available to open new trades or absorb losses on existing positions." },
            { question: "Is higher leverage always better?", answer: "No. Higher leverage allows larger positions but also magnifies losses. Most regulated brokers limit leverage to 1:30 or 1:50 for retail traders for this reason." },
        ],
    },
    {
        slug: "leverage-calculator",
        title: "Leverage Calculator",
        shortTitle: "Leverage",
        description: "Understand your leverage exposure and calculate your effective leverage ratio.",
        icon: Scale,
        color: "from-indigo-500 to-cyan-500",
        iconBg: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400",
        category: "trade-calculators",
        howToUse: [
            { step: "Enter your account balance", detail: "Your total account equity." },
            { step: "Enter lot size", detail: "The position size you plan to trade." },
            { step: "Select currency pair", detail: "To determine the notional trade value." },
            { step: "Enter current price", detail: "The pair's current market price." },
            { step: "Review effective leverage", detail: "See your actual leverage ratio and risk level." },
        ],
        whatIs: {
            heading: "What is Leverage in Forex?",
            paragraphs: [
                "Leverage allows you to control a large position with a small amount of capital. A 1:100 leverage means $1,000 controls a $100,000 position.",
                "Effective leverage is the actual ratio between your total open position size and your account equity. This is different from your broker's maximum leverage.",
                "Understanding your effective leverage is crucial — even with 1:500 broker leverage, if your positions total 5x your equity, your effective leverage is only 1:5.",
            ],
        },
        features: ["Account balance input", "Position size input", "Notional value display", "Effective leverage ratio", "Risk level indicator", "Multiple pair support"],
        faqs: [
            { question: "What's the difference between broker leverage and effective leverage?", answer: "Broker leverage is the maximum allowed. Effective leverage is what you're actually using. If your broker offers 1:500 but you only open positions worth 10x your equity, your effective leverage is 1:10." },
            { question: "What is a safe leverage level?", answer: "Most professionals use effective leverage between 1:1 and 1:10. Above 1:20 is considered high risk. Above 1:50 is extremely dangerous for most traders." },
            { question: "Does leverage affect pip value?", answer: "Leverage doesn't change pip value directly — it changes how many lots you can open. More lots = higher pip value per trade = more risk." },
        ],
    },

    // ═══════════════════════════════════════
    // TECHNICAL ANALYSIS
    // ═══════════════════════════════════════
    {
        slug: "fibonacci-calculator",
        title: "Fibonacci Calculator",
        shortTitle: "Fibonacci",
        description: "Calculate Fibonacci retracement and extension levels for price action analysis.",
        icon: GitBranch,
        color: "from-amber-500 to-orange-500",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        category: "technical-analysis",
        howToUse: [
            { step: "Choose Retracement or Extension", detail: "Retracement for pullback levels, Extension for profit targets." },
            { step: "Select trend direction", detail: "Uptrend or Downtrend affects level placement." },
            { step: "Enter Swing High", detail: "The highest price point of the move." },
            { step: "Enter Swing Low", detail: "The lowest price point of the move." },
            { step: "Read the levels", detail: "Key levels (38.2%, 50%, 61.8%) are highlighted for quick reference." },
        ],
        whatIs: {
            heading: "What are Fibonacci Levels?",
            paragraphs: [
                "Fibonacci levels are horizontal lines based on the Fibonacci sequence ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%). Traders use these to identify potential support and resistance levels.",
                "Fibonacci Retracements help predict where price might pull back during a trend. The 61.8% level (the 'golden ratio') is the most watched retracement level.",
                "Fibonacci Extensions project where price might go beyond the original move. The 161.8% and 261.8% levels are popular profit-taking targets.",
            ],
        },
        features: ["Retracement & Extension", "Uptrend & Downtrend", "Key level highlighting", "All standard Fib levels", "Precise price output", "Auto decimal precision"],
        faqs: [
            { question: "Which Fibonacci level is most important?", answer: "The 61.8% retracement (golden ratio) is considered the most significant. Many traders also watch 38.2% and 50% levels. In extensions, 161.8% is the most popular target." },
            { question: "Do Fibonacci levels always work?", answer: "No. Fibonacci levels are self-fulfilling to some extent — they work because many traders watch them. Always combine Fib levels with other analysis like support/resistance, candlestick patterns, and volume." },
            { question: "How do I draw Fibonacci correctly?", answer: "For an uptrend, draw from the swing low to the swing high. For a downtrend, draw from the swing high to the swing low. Use significant swing points, not minor fluctuations." },
        ],
    },
    {
        slug: "compounding-calculator",
        title: "Compounding Calculator",
        shortTitle: "Compounding",
        description: "Project your account growth with compound returns over time.",
        icon: BarChart3,
        color: "from-emerald-500 to-teal-500",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        category: "technical-analysis",
        howToUse: [
            { step: "Enter starting balance", detail: "Your initial trading capital." },
            { step: "Set monthly gain percentage", detail: "Your target or average monthly return." },
            { step: "Choose duration", detail: "How many months to project (max 60)." },
            { step: "Optional: set monthly withdrawal", detail: "If you plan to withdraw profits each month." },
            { step: "Analyze the growth curve", detail: "The bar chart shows the exponential growth trajectory." },
        ],
        whatIs: {
            heading: "What is Compound Growth?",
            paragraphs: [
                "Compound growth means your profits generate their own profits. A 5% monthly return doesn't just add 60% per year — it compounds to 79.6% because each month's gain is calculated on an ever-growing balance.",
                "This is the most powerful concept in trading. A $10,000 account growing at 5% monthly becomes $33,864 after 2 years without any additional deposits.",
                "The key is consistency. Even small consistent gains compound dramatically over time, which is why professional traders focus on steady returns rather than home-run trades.",
            ],
        },
        features: ["Starting balance input", "Monthly gain %", "Duration up to 60 months", "Monthly withdrawal option", "Visual growth chart", "Total profit summary"],
        faqs: [
            { question: "Is 5% monthly return realistic?", answer: "5% monthly is achievable but challenging. Many successful traders average 3-8% monthly. The key is consistency — even 3% monthly compounds to impressive figures over years." },
            { question: "Should I reinvest all profits?", answer: "It depends on your goals. Full reinvestment maximizes compounding, but withdrawing some profits reduces risk and provides income. Many traders withdraw 30-50% and reinvest the rest." },
            { question: "Why does the growth curve accelerate?", answer: "That's the power of compounding. Early months show linear-looking growth, but as your balance grows, the same percentage generates increasingly larger dollar amounts." },
        ],
    },
    {
        slug: "pivot-point-calculator",
        title: "Pivot Point Calculator",
        shortTitle: "Pivot Points",
        description: "Calculate daily support and resistance pivot levels from previous session data.",
        icon: Layers,
        color: "from-teal-500 to-cyan-500",
        iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
        category: "technical-analysis",
        howToUse: [
            { step: "Enter previous High", detail: "The highest price of the previous trading session." },
            { step: "Enter previous Low", detail: "The lowest price of the previous session." },
            { step: "Enter previous Close", detail: "The closing price of the previous session." },
            { step: "Choose calculation method", detail: "Classic, Fibonacci, Woodie, or Camarilla." },
            { step: "Use the levels", detail: "R1-R3 are resistance, S1-S3 are support. PP is the central pivot." },
        ],
        whatIs: {
            heading: "What are Pivot Points?",
            paragraphs: [
                "Pivot Points are calculated support and resistance levels based on the previous day's high, low, and close. They're widely used by day traders and institutional traders.",
                "The central Pivot Point (PP) acts as the main support/resistance level. Above PP, the market is considered bullish; below PP, bearish. R1/R2/R3 are resistance levels; S1/S2/S3 are support.",
                "Multiple calculation methods exist — Classic (floor), Fibonacci, Woodie, and Camarilla — each with different formulas and emphasis on previous price action.",
            ],
        },
        features: ["Classic pivot formula", "Fibonacci pivots", "Woodie pivots", "Camarilla pivots", "3 support/resistance levels", "Central pivot point"],
        faqs: [
            { question: "Which pivot method is best?", answer: "Classic (floor) pivots are the most widely used. Fibonacci pivots are popular among technical traders. The best method depends on your market and timeframe." },
            { question: "Are pivot points reliable?", answer: "Pivot points are self-fulfilling indicators — because so many traders use them, price often reacts at these levels. They work best in trending markets with good volume." },
            { question: "Can I use pivots for swing trading?", answer: "While primarily used for day trading, weekly and monthly pivot points can be calculated for longer timeframes by using the previous week's or month's high/low/close." },
        ],
    },

    // ═══════════════════════════════════════
    // MARKET INFO
    // ═══════════════════════════════════════
    {
        slug: "market-hours",
        title: "Forex Market Hours",
        shortTitle: "Market Hours",
        description: "Visualize the major trading sessions: Sydney, Tokyo, London, and New York.",
        icon: Clock,
        color: "from-cyan-500 to-blue-500",
        iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
        category: "market-info",
        howToUse: [
            { step: "View active sessions", detail: "Green indicates currently open sessions." },
            { step: "Check session overlaps", detail: "London-New York overlap is the most volatile period." },
            { step: "Plan your trading hours", detail: "Trade during the sessions that match your strategy and pairs." },
        ],
        whatIs: {
            heading: "What are Forex Market Hours?",
            paragraphs: [
                "The forex market operates 24 hours a day, 5 days a week through four major sessions: Sydney (Asian open), Tokyo (Asian), London (European), and New York (American).",
                "Each session has different characteristics. London and New York are the most liquid, while the Asian session tends to be quieter. The London-New York overlap (1-5PM GMT) is the most active period.",
                "Understanding market hours helps you trade when volatility and volume suit your strategy, and avoid low-liquidity periods with wider spreads.",
            ],
        },
        features: ["Real-time session display", "Session overlap detection", "Your local timezone", "All 4 major sessions", "Visual timeline", "Open/Closed status"],
        faqs: [
            { question: "When is the best time to trade forex?", answer: "The London-New York overlap (8AM-12PM EST) offers the highest liquidity and tightest spreads. For JPY pairs, the Tokyo session (7PM-4AM EST) is most active." },
            { question: "Is the forex market open on weekends?", answer: "No. The forex market closes Friday 5PM EST and reopens Sunday 5PM EST. Some brokers offer limited weekend trading on crypto pairs." },
            { question: "Why does volatility vary by session?", answer: "Different financial centers have different participants and volumes. London handles about 38% of global forex volume, making it the most liquid session." },
        ],
    },
    {
        slug: "economic-calendar",
        title: "Economic Calendar",
        shortTitle: "Eco Calendar",
        description: "Track high-impact economic events and news releases that move the markets.",
        icon: Calendar,
        color: "from-amber-500 to-orange-500",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        category: "market-info",
        howToUse: [
            { step: "Browse upcoming events", detail: "Events are listed chronologically with date and time." },
            { step: "Filter by impact level", detail: "Focus on high-impact events that cause significant market moves." },
            { step: "Check forecast vs previous", detail: "Large deviations from forecast cause volatility." },
            { step: "Plan around events", detail: "Avoid opening trades right before high-impact news, or trade the reaction." },
        ],
        whatIs: {
            heading: "What is an Economic Calendar?",
            paragraphs: [
                "An Economic Calendar lists scheduled economic data releases, central bank decisions, and geopolitical events that can significantly impact financial markets.",
                "Key events include Non-Farm Payrolls (NFP), interest rate decisions, GDP releases, CPI inflation data, and employment reports. High-impact events can cause hundreds of pips of movement.",
                "Professional traders always check the economic calendar before trading. Many avoid taking new positions during major news releases to prevent being caught in volatile price swings.",
            ],
        },
        features: ["Impact level filtering", "Date range selection", "Country filtering", "Previous vs Forecast data", "Real-time updates", "Event descriptions"],
        faqs: [
            { question: "What are the most important economic events?", answer: "Interest rate decisions, Non-Farm Payrolls (NFP), CPI/inflation data, GDP releases, and employment data are the highest-impact events. Central bank speeches can also cause significant moves." },
            { question: "Should I trade during news events?", answer: "It depends on your strategy. News trading can be profitable but carries high risk due to extreme volatility, wide spreads, and slippage. Many beginners are advised to avoid trading during high-impact news." },
            { question: "What does the impact rating mean?", answer: "Low impact: minimal market reaction. Medium impact: moderate volatility. High impact: significant price moves expected, often 50+ pips in forex." },
        ],
    },
    {
        slug: "currency-converter",
        title: "Currency Converter",
        shortTitle: "Converter",
        description: "Convert between 15+ currencies using live exchange rates from Yahoo Finance.",
        icon: ArrowLeftRight,
        color: "from-green-500 to-teal-500",
        iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
        category: "market-info",
        howToUse: [
            { step: "Enter the amount", detail: "How much currency you want to convert." },
            { step: "Select source currency", detail: "The currency you're converting from." },
            { step: "Select target currency", detail: "The currency you're converting to." },
            { step: "Click Convert", detail: "Get the live exchange rate from Yahoo Finance." },
        ],
        whatIs: {
            heading: "What is a Currency Converter?",
            paragraphs: [
                "A Currency Converter calculates how much one currency is worth in another currency using live exchange rates.",
                "This tool uses Yahoo Finance data to provide near real-time rates for 15+ major world currencies including USD, EUR, GBP, JPY, AUD, CAD, CHF, and more.",
                "Whether you're planning international trades, calculating cross-currency positions, or managing multi-currency accounts, this converter gives you instant accurate conversions.",
            ],
        },
        features: ["15+ major currencies", "Live Yahoo Finance rates", "Instant swap direction", "Large number support", "Precise exchange rates", "Clean simple interface"],
        faqs: [
            { question: "How accurate are the rates?", answer: "Rates come from Yahoo Finance and are near real-time market mid-rates. They may differ slightly from your broker's rates due to spreads and data delays." },
            { question: "Are these rates suitable for trading?", answer: "These are indicative mid-market rates. Your actual trading rates will include your broker's spread. Use these for estimation and planning." },
            { question: "How often are rates updated?", answer: "Rates are fetched live each time you click Convert, so you always get the latest available data from Yahoo Finance." },
        ],
    },
    {
        slug: "live-market-rates",
        title: "Live Market Rates",
        shortTitle: "Live Rates",
        description: "Real-time prices for major forex pairs, cross pairs, metals, and crypto from Yahoo Finance.",
        icon: Activity,
        color: "from-blue-500 to-cyan-500",
        iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        category: "market-info",
        howToUse: [
            { step: "View rates automatically", detail: "Rates load automatically when you visit the page." },
            { step: "Check price changes", detail: "See daily change in absolute and percentage terms." },
            { step: "Click Refresh", detail: "Get the latest rates (auto-refreshes every 60 seconds)." },
        ],
        whatIs: {
            heading: "What are Live Market Rates?",
            paragraphs: [
                "Live Market Rates show you the current prices of major financial instruments in real-time, organized by category: Major Pairs, Cross Pairs, and Metals & Crypto.",
                "Each rate includes the current price, daily change (absolute and percentage), and trend direction — giving you a quick snapshot of market conditions.",
                "Data is sourced from Yahoo Finance and auto-refreshes every 60 seconds to keep you informed without constantly checking your trading platform.",
            ],
        },
        features: ["Auto-refresh every 60s", "Major & Cross Pairs", "Gold, Silver, BTC, ETH", "Daily change display", "Trend direction arrows", "Clean data table"],
        faqs: [
            { question: "Are these real-time?", answer: "Rates are near real-time from Yahoo Finance with slight delay. They're excellent for market overview but may differ from your broker's live feed." },
            { question: "Can I add custom pairs?", answer: "The current version shows a curated set of the most traded instruments. Custom pair support may be added in future updates." },
            { question: "Why do some rates show dashes?", answer: "If a rate shows '—', it means Yahoo Finance data wasn't available for that symbol at the moment. Click Refresh to try again." },
        ],
    },
    {
        slug: "currency-heat-map",
        title: "Currency Heat Map",
        shortTitle: "Heat Map",
        description: "Visualize relative strength of 8 major currencies based on cross-pair performance.",
        icon: Flame,
        color: "from-orange-500 to-red-500",
        iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        category: "market-info",
        howToUse: [
            { step: "Click Refresh", detail: "Fetch latest data from 28 cross-pair combinations." },
            { step: "Read the strength ranking", detail: "Currencies are ranked from strongest (top) to weakest (bottom)." },
            { step: "Green bars = strength", detail: "Positive bars indicate the currency is appreciating against peers." },
            { step: "Red bars = weakness", detail: "Negative bars indicate the currency is depreciating against peers." },
        ],
        whatIs: {
            heading: "What is a Currency Heat Map?",
            paragraphs: [
                "A Currency Heat Map shows the relative strength of major currencies by analyzing their performance across all cross pairs.",
                "Instead of looking at individual pairs, the heat map aggregates data from 28 combinations of USD, EUR, GBP, JPY, AUD, CAD, CHF, and NZD to determine which currencies are strong and which are weak.",
                "This helps traders identify momentum and find high-probability trades by pairing the strongest currency against the weakest.",
            ],
        },
        features: ["8 major currencies", "28 cross-pair analysis", "Strength ranking", "Visual bar chart", "Auto-refresh every 2 min", "Live Yahoo Finance data"],
        faqs: [
            { question: "How is strength calculated?", answer: "We fetch the daily change % for all 28 cross-pair combinations, then average the change for each currency across all pairs it appears in." },
            { question: "How should I use this?", answer: "Look for the strongest and weakest currencies, then trade the pair that combines them. For example, if USD is strongest and JPY is weakest, look for long USD/JPY setups." },
            { question: "How often should I check?", answer: "Check at the start of your trading session and periodically throughout. Currency strength can shift with major news events." },
        ],
    },
    {
        slug: "correlation-matrix",
        title: "Correlation Matrix",
        shortTitle: "Correlation",
        description: "Calculate Pearson correlation between 12 major forex pairs using historical price data.",
        icon: Grid3X3,
        color: "from-indigo-500 to-blue-500",
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        category: "market-info",
        howToUse: [
            { step: "Select a period", detail: "Choose 14, 30, 60, or 90 days of historical data." },
            { step: "Click Calculate", detail: "Fetches historical data and computes Pearson correlation." },
            { step: "Read the matrix", detail: "Green = positive correlation, Red = negative correlation." },
            { step: "Use for diversification", detail: "Avoid opening multiple highly correlated positions." },
        ],
        whatIs: {
            heading: "What is Pair Correlation?",
            paragraphs: [
                "Pair Correlation measures how two currency pairs move in relation to each other. A correlation of +1.0 means they move identically; -1.0 means they move in exact opposite directions.",
                "Understanding correlation is essential for risk management. Trading two highly correlated pairs (like EUR/USD and GBP/USD) effectively doubles your risk on the same market direction.",
                "This tool calculates Pearson correlation using daily returns over your selected period, providing an accurate statistical measure of pair relationships.",
            ],
        },
        features: ["12 major pairs", "4 time periods", "Pearson correlation", "Color-coded matrix", "Historical Yahoo data", "On-demand calculation"],
        faqs: [
            { question: "What correlation is considered significant?", answer: "Above +0.7 or below -0.7 is considered strong correlation. Between -0.3 and +0.3 is considered low correlation. Values in between are moderate." },
            { question: "Does correlation change over time?", answer: "Yes, correlation is not static. It can shift due to economic events, policy changes, and market conditions. That's why we offer different time periods." },
            { question: "How should I use this for trading?", answer: "Avoid opening multiple positions in highly correlated pairs (e.g., long EUR/USD and long GBP/USD). Use negative correlation for hedging." },
        ],
    },
];

export function getToolBySlug(slug: string): ToolData | undefined {
    return ALL_TOOLS.find((t) => t.slug === slug);
}

export function getSimilarTools(currentSlug: string, count = 6): ToolData[] {
    const current = getToolBySlug(currentSlug);
    if (!current) return ALL_TOOLS.filter((t) => t.slug !== currentSlug).slice(0, count);

    // Same category first, then others
    const sameCategory = ALL_TOOLS.filter((t) => t.category === current.category && t.slug !== currentSlug);
    const otherCategory = ALL_TOOLS.filter((t) => t.category !== current.category && t.slug !== currentSlug);

    return [...sameCategory, ...otherCategory].slice(0, count);
}
