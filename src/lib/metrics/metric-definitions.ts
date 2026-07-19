/**
 * Central Metric Definition Layer
 * ================================
 * Single source of truth for all KPI explanations across the platform.
 * Used by MetricHelp component to render consistent tooltips/popovers.
 */

export type MetricDefinition = {
    id: string;
    label: string;
    shortDescription: string;
    formula: string;
    includedData: string;
    edgeCases: string[];
    goodToKnow?: string;
    detailsHref?: string;
};

export const METRIC_DEFINITIONS = {
    totalBalance: {
        id: "totalBalance",
        label: "Total Balance",
        shortDescription: "Sum of all connected trading account balances.",
        formula: "Sum of balance across all active accounts (Live + Funded).",
        includedData: "All accounts marked as active in Account Hub.",
        edgeCases: [
            "Accounts without a synced balance show $0.",
            "Demo accounts are excluded unless explicitly added.",
            "Balance updates depend on sync frequency — it may lag by a few minutes.",
        ],
        goodToKnow:
            "This reflects the latest snapshot from your broker, not real-time equity.",
    },

    periodPnL: {
        id: "periodPnL",
        label: "Period P&L",
        shortDescription:
            "Net profit or loss from closed trades in the selected date range.",
        formula:
            "Sum of (PnL + Commission + Swap) for all closed trades in the selected period.",
        includedData:
            "Closed trades in the selected account and date range. Open trades are excluded.",
        edgeCases: [
            "If no trades were closed in the period, shows $0.00.",
            "Commission and swap are included in the calculation.",
            "Deposits and withdrawals are not included — this is trading P&L only.",
        ],
    },

    winRate: {
        id: "winRate",
        label: "Win Rate",
        shortDescription:
            "Percentage of decisive closed trades that ended in profit.",
        formula: "wins / (wins + losses) × 100",
        includedData:
            "Closed trades in the selected account and date range. Break-even trades are excluded.",
        edgeCases: [
            "If there are wins and no losses, Win Rate is 100%.",
            "If there are only break-even trades, shows -- instead of 0%.",
            "Open trades are excluded from the calculation.",
        ],
        detailsHref: "/dashboard/intelligence",
    },

    tradeScore: {
        id: "tradeScore",
        label: "Trade Score",
        shortDescription:
            "A discipline score from 0 to 100 based on execution quality.",
        formula:
            "Composite score from win rate, risk:reward, plan compliance, SL discipline, revenge trading, weak pairs, and emotion patterns.",
        includedData:
            "Closed trades in the selected account and date range. Requires enough trade history to avoid noisy scoring.",
        edgeCases: [
            "If there are not enough trades, shows 'Need 30+ trades'.",
            "A profitable day can still have a lower score if risk or discipline signals are weak.",
            "The score reflects discipline and risk quality, not only P&L.",
        ],
        detailsHref: "/dashboard/intelligence",
    },

    profitFactor: {
        id: "profitFactor",
        label: "Profit Factor",
        shortDescription: "Gross profit divided by gross loss.",
        formula: "Gross Winning P&L / |Gross Losing P&L|",
        includedData: "Closed trades in the selected account and date range.",
        edgeCases: [
            "If there is profit and no loss, shows ∞ (infinity).",
            "If there is no decisive trade data, shows --.",
            "A value above 1.0 means more was won than lost overall.",
        ],
    },

    avgWin: {
        id: "avgWin",
        label: "Avg Win",
        shortDescription: "Average profit per winning trade.",
        formula: "Gross Profit / Number of Winning Trades",
        includedData:
            "Winning closed trades in the selected account and date range.",
        edgeCases: [
            "If there are no winning trades, shows --.",
            "Includes commission and swap in the profit calculation.",
        ],
    },

    avgLoss: {
        id: "avgLoss",
        label: "Avg Loss",
        shortDescription: "Average loss per losing trade.",
        formula: "|Gross Loss| / Number of Losing Trades",
        includedData:
            "Losing closed trades in the selected account and date range.",
        edgeCases: [
            "If there are no losing trades, shows --.",
            "Displayed as a positive number for readability.",
        ],
    },

    profitBySymbol: {
        id: "profitBySymbol",
        label: "Profit by Symbol",
        shortDescription: "Net profit breakdown by traded instrument.",
        formula: "Sum of (PnL + Commission + Swap) grouped by symbol.",
        includedData: "Top 10 symbols by net profit in the selected period.",
        edgeCases: [
            "Symbols with fewer than 1 trade in the period are not shown.",
            "Win Rate per symbol excludes break-even trades.",
        ],
    },

    lotBySymbol: {
        id: "lotBySymbol",
        label: "Lot Distribution",
        shortDescription: "Total lots traded, broken down by symbol.",
        formula: "Sum of lot sizes grouped by symbol.",
        includedData: "Top 5 symbols by total lot volume.",
        edgeCases: [
            "Partial lots are included.",
            "This shows volume exposure, not profitability.",
        ],
    },

    dailyWinRate: {
        id: "dailyWinRate",
        label: "Daily Win Rate",
        shortDescription: "Win rate calculated per trading day.",
        formula: "Daily wins / (Daily wins + Daily losses) × 100",
        includedData: "Closed trades grouped by exit date.",
        edgeCases: [
            "Days with only break-even trades show 0% (daily granularity).",
            "Non-trading days are not shown.",
        ],
    },

    monthlyAnalytics: {
        id: "monthlyAnalytics",
        label: "Monthly Performance",
        shortDescription:
            "Aggregated monthly profit, trade count, and win rate for the past 12 months.",
        formula: "Monthly sum of PnL with win count for each calendar month.",
        includedData: "Last 12 months of closed trades.",
        edgeCases: [
            "Months with no trades show as gaps in the chart.",
            "Current month data updates as new trades close.",
        ],
    },
    streak: {
        id: "streak",
        label: "Streak",
        shortDescription:
            "Consecutive trading days with at least one closed trade.",
        formula: "Number of consecutive days with closed trades.",
        includedData: "All closed trades across connected accounts.",
        edgeCases: [
            "Weekend days are skipped so they do not break the streak.",
            "Requires at least one closed trade per active trading day.",
        ],
    },
    totalTrades: {
        id: "totalTrades",
        label: "Total Trades",
        shortDescription:
            "Total number of closed trades executed in the period.",
        formula:
            "Count of all closed trades in the selected account and date range.",
        includedData:
            "Closed trades in the selected period. Open trades are excluded.",
        edgeCases: ["Includes winning, losing, and break-even trades."],
    },
    avgRR: {
        id: "avgRR",
        label: "Avg R:R",
        shortDescription: "Average Risk to Reward ratio on closed trades.",
        formula: "Avg Win / Avg Loss",
        includedData: "All closed trades in the selected period.",
        edgeCases: ["If there are no losses, shows '--' or is unbounded."],
    },
    expectancy: {
        id: "expectancy",
        label: "Expectancy",
        shortDescription: "Expected net profit per trade executed.",
        formula: "Net P&L / Total Trades",
        includedData: "All closed trades in the selected period.",
        edgeCases: [
            "A positive expectancy means you win money on average per trade over time.",
        ],
    },
    fees: {
        id: "fees",
        label: "Broker Fees",
        shortDescription: "Sum of commission and swap charges.",
        formula: "Commission + Swap",
        includedData: "All closed trades in the selected period.",
        edgeCases: ["Broker fees are deducted directly from your trade P&L."],
    },
    maxWin: {
        id: "maxWin",
        label: "Max Win",
        shortDescription:
            "Your single largest winning trade in the selected period.",
        formula: "Maximum profit of a single closed trade.",
        includedData: "Closed trades in the selected period.",
        edgeCases: ["Shows $0 if no profitable trades exist."],
    },
    maxLoss: {
        id: "maxLoss",
        label: "Max Loss",
        shortDescription:
            "Your single largest losing trade in the selected period.",
        formula: "Maximum loss (negative value) of a single closed trade.",
        includedData: "Closed trades in the selected period.",
        edgeCases: ["Shows $0 if no losing trades exist."],
    },
} as const satisfies Record<string, MetricDefinition>;

export type MetricId = keyof typeof METRIC_DEFINITIONS;
