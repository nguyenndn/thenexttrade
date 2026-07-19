"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

const BalanceGrowthChart = dynamic(() =>
    import("@/components/dashboard/BalanceGrowthChart").then(
        (m) => m.BalanceGrowthChart
    )
);
const DailyWinRateChart = dynamic(() =>
    import("@/components/dashboard/DailyWinRateChart").then(
        (m) => m.DailyWinRateChart
    )
);
const ProfitDistributionChart = dynamic(() =>
    import("@/components/dashboard/ProfitDistributionChart").then(
        (m) => m.ProfitDistributionChart
    )
);
const LotDistributionChart = dynamic(() =>
    import("@/components/dashboard/LotDistributionChart").then(
        (m) => m.LotDistributionChart
    )
);
const MonthlyAnalyticsChart = dynamic(() =>
    import("@/components/dashboard/MonthlyAnalyticsChart").then(
        (m) => m.MonthlyAnalyticsChart
    )
);
const TopTradesList = dynamic(() =>
    import("@/components/dashboard/TopTradesList").then((m) => m.TopTradesList)
);
const SymbolPerformanceList = dynamic(() =>
    import("@/components/dashboard/SymbolPerformanceList").then(
        (m) => m.SymbolPerformanceList
    )
);
const RecentTradesMini = dynamic(() =>
    import("@/components/dashboard/RecentTradesMini").then(
        (m) => m.RecentTradesMini
    )
);
const TradingSessionsCard = dynamic(() =>
    import("@/components/dashboard/TradingSessionsCard").then(
        (m) => m.TradingSessionsCard
    )
);
const DayOfWeekCard = dynamic(() =>
    import("@/components/dashboard/DayOfWeekCard").then((m) => m.DayOfWeekCard)
);
const TradingCalendar = dynamic(() =>
    import("@/components/dashboard/TradingCalendar").then(
        (m) => m.TradingCalendar
    )
);
const WinLossComparisonChart = dynamic(() =>
    import("@/components/dashboard/WinLossComparisonChart").then(
        (m) => m.WinLossComparisonChart
    )
);
const PlCalendarHeatmap = dynamic(() =>
    import("@/components/dashboard/PlCalendarHeatmap").then(
        (m) => m.PlCalendarHeatmap
    )
);

export type WidgetType =
    | "BALANCE_GROWTH"
    | "DAILY_WIN_RATE"
    | "PROFIT_DIST"
    | "LOT_DIST"
    | "MONTHLY_ANALYTICS"
    | "TOP_TRADES"
    | "SYMBOL_PERF"
    | "RECENT_TRADES"
    | "TRADING_SESSIONS"
    | "DAY_OF_WEEK"
    | "TRADING_CALENDAR"
    | "WIN_LOSS_COMPARISON"
    | "PL_HEATMAP";

export interface WidgetConfig {
    type: WidgetType;
    title: string;
    description: string;
    defaultW: number;
    defaultH: number;
    minW: number;
    minH: number;
    component: React.ComponentType<any>;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetConfig> = {
    BALANCE_GROWTH: {
        type: "BALANCE_GROWTH",
        title: "Balance Growth",
        description: "Track your account balance over time.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: BalanceGrowthChart,
    },
    DAILY_WIN_RATE: {
        type: "DAILY_WIN_RATE",
        title: "Daily Win Rate",
        description: "Your win rate percentage over time.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: DailyWinRateChart,
    },
    PROFIT_DIST: {
        type: "PROFIT_DIST",
        title: "Profit Distribution",
        description: "Breakdown of your profits and losses.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: ProfitDistributionChart,
    },
    LOT_DIST: {
        type: "LOT_DIST",
        title: "Lot Size Distribution",
        description: "See the most frequently traded lot sizes.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: LotDistributionChart,
    },
    MONTHLY_ANALYTICS: {
        type: "MONTHLY_ANALYTICS",
        title: "Monthly Analytics",
        description: "Your monthly performance breakdown.",
        defaultW: 240,
        defaultH: 88,
        minW: 60,
        minH: 30,
        component: MonthlyAnalyticsChart,
    },
    TOP_TRADES: {
        type: "TOP_TRADES",
        title: "Top Trades",
        description: "Your best and worst trades.",
        defaultW: 120,
        defaultH: 88,
        minW: 40,
        minH: 30,
        component: TopTradesList,
    },
    SYMBOL_PERF: {
        type: "SYMBOL_PERF",
        title: "Symbol Performance",
        description: "Performance broken down by pairs.",
        defaultW: 120,
        defaultH: 88,
        minW: 40,
        minH: 30,
        component: SymbolPerformanceList,
    },
    RECENT_TRADES: {
        type: "RECENT_TRADES",
        title: "Recent Trades",
        description: "A list of your most recent trades.",
        defaultW: 120,
        defaultH: 88,
        minW: 40,
        minH: 30,
        component: RecentTradesMini,
    },
    TRADING_SESSIONS: {
        type: "TRADING_SESSIONS",
        title: "Trading Sessions",
        description: "Performance by trading session.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: TradingSessionsCard,
    },
    DAY_OF_WEEK: {
        type: "DAY_OF_WEEK",
        title: "Day of Week",
        description: "Your performance across different days.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: DayOfWeekCard,
    },
    TRADING_CALENDAR: {
        type: "TRADING_CALENDAR",
        title: "Trading Calendar",
        description:
            "Monthly calendar showing daily win rates, trade counts, and P&L.",
        defaultW: 240,
        defaultH: 110,
        minW: 80,
        minH: 50,
        component: TradingCalendar,
    },
    WIN_LOSS_COMPARISON: {
        type: "WIN_LOSS_COMPARISON",
        title: "Win/Loss Comparison",
        description:
            "Comparison of your average win size vs average loss size.",
        defaultW: 120,
        defaultH: 66,
        minW: 40,
        minH: 30,
        component: WinLossComparisonChart,
    },
    PL_HEATMAP: {
        type: "PL_HEATMAP",
        title: "P&L Calendar Heatmap",
        description:
            "GitHub-style heatmap showing green/red daily profit intensities.",
        defaultW: 240,
        defaultH: 66,
        minW: 80,
        minH: 30,
        component: PlCalendarHeatmap,
    },
};

export const AVAILABLE_WIDGETS = Object.values(WIDGET_REGISTRY);
