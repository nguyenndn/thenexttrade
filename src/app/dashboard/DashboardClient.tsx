"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, Trophy, PieChart as PieChartIcon, Layers, CalendarRange, Gauge } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { InsightBanner } from "@/components/dashboard/InsightBanner";

// Lazy load chart components — only loaded when user scrolls to them
const ChartSkeleton = () => <div className="h-[280px] bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl" />;
const BalanceGrowthChart = dynamic(() => import("@/components/dashboard/BalanceGrowthChart").then(m => m.BalanceGrowthChart), { loading: () => <ChartSkeleton /> });
const ProfitDistributionChart = dynamic(() => import("@/components/dashboard/ProfitDistributionChart").then(m => m.ProfitDistributionChart), { loading: () => <ChartSkeleton /> });
const LotDistributionChart = dynamic(() => import("@/components/dashboard/LotDistributionChart").then(m => m.LotDistributionChart), { loading: () => <ChartSkeleton /> });
const DailyWinRateChart = dynamic(() => import("@/components/dashboard/DailyWinRateChart").then(m => m.DailyWinRateChart), { loading: () => <ChartSkeleton /> });
const MonthlyAnalyticsChart = dynamic(() => import("@/components/dashboard/MonthlyAnalyticsChart").then(m => m.MonthlyAnalyticsChart), { loading: () => <ChartSkeleton /> });
const TopTradesList = dynamic(() => import("@/components/dashboard/TopTradesList").then(m => m.TopTradesList), { loading: () => <ChartSkeleton /> });
const SymbolPerformanceList = dynamic(() => import("@/components/dashboard/SymbolPerformanceList").then(m => m.SymbolPerformanceList), { loading: () => <ChartSkeleton /> });
const RecentTradesMini = dynamic(() => import("@/components/dashboard/RecentTradesMini").then(m => m.RecentTradesMini), { loading: () => <ChartSkeleton /> });
const TradingSessionsCard = dynamic(() => import("@/components/dashboard/TradingSessionsCard").then(m => m.TradingSessionsCard), { loading: () => <ChartSkeleton /> });
const DayOfWeekCard = dynamic(() => import("@/components/dashboard/DayOfWeekCard").then(m => m.DayOfWeekCard), { loading: () => <ChartSkeleton /> });

interface DashboardClientProps {
    userName?: string;
    dashboardData: {
        totalBalance: number;
        winRate: number;
        winRateChange: number;
        streak: number;
        todayPnL: number;
        periodPnL: number; // Added
        // Pro Metrics
        profitFactor: number;
        avgWin: number;
        avgLoss: number;
        winCount: number;
        lossCount: number;
        breakEvenCount: number;
    };
    chartData: { date: string; balance: number }[];
    recentTrades: any[]; // Full trade objects
    symbolPerformance: { name: string; value: number }[];
    currentAccountId?: string;
    monthlyAnalytics: { date: string; value: number }[];
    dailyWinRates: { date: string; winRate: number; trades: number; wins: number }[];
    bestTrades: any[];
    worstTrades: any[];
    symbolAnalytics: any[];
    lotDistribution: { name: string; value: number }[];
    tradeScore: number | null;
    insight: { icon: string; title: string; description: string } | null;
    intelligenceScore?: number | null;
    sessionPerformance: { session: string; trades: number; pnl: number; winRate: number }[];
    dayOfWeekPerformance: { day: string; dayIndex: number; pnl: number; tradeCount: number; winRate: number }[];
}

export default function DashboardClient({
    userName = "Trader",
    dashboardData,
    chartData,
    recentTrades,
    symbolPerformance,
    currentAccountId,
    monthlyAnalytics,
    dailyWinRates,
    bestTrades,
    worstTrades,
    symbolAnalytics,
    lotDistribution,
    tradeScore,
    insight,
    intelligenceScore,
    sessionPerformance,
    dayOfWeekPerformance,
}: DashboardClientProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Modal State
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [showTradeModal, setShowTradeModal] = useState(false);

    const handleTradeClick = (id: string) => {
        const trade = recentTrades.find(t => t.id === id);
        if (trade) {
            setSelectedTrade(trade);
            setShowTradeModal(true);
        }
    };

    const handleAddTrade = () => {
        setSelectedTrade(null); // null = create mode
        setShowTradeModal(true);
    };


    return (
        <div className="space-y-4">
            <JournalEntryModal
                open={showTradeModal}
                onOpenChange={setShowTradeModal}
                entry={selectedTrade}
            />

            {/* Header Section */}
            <GreetingHeader userName={userName} currentAccountId={currentAccountId} />

            {/* AI Insight Banner */}
            {insight && <InsightBanner insight={insight} score={intelligenceScore} />}

            {/* Hero Stats Bar (4 columns) */}
            <DashboardHero 
                totalBalance={dashboardData.totalBalance} 
                periodPnL={dashboardData.periodPnL} 
                winRate={dashboardData.winRate} 
                tradeScore={tradeScore}
                isDark={isDark} 
            />


            {/* === Dashboard Grid: 12-col layout matching reference === */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

                {/* --- ROW 1: Period Growth (8) + Quick Stats & Distribution Sidebar (4) --- */}
                <div className="xl:col-span-8 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary h-auto xl:h-[420px] overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Period Growth</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Cumulative Net Profit</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Net Profit</p>
                                <p className={`text-sm font-bold ${(chartData[chartData.length - 1]?.balance || 0) >= 0 ? "text-primary" : "text-red-500"}`}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(chartData[chartData.length - 1]?.balance || 0)}
                                </p>
                            </div>
                        </div>
                        <BalanceGrowthChart data={chartData} />
                    </div>
                </div>
                <div className="xl:col-span-4 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-teal-500 h-auto xl:h-[420px] flex flex-col divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-500">
                                    <Gauge size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Quick Stats</h3>
                                    <p className="text-xs text-gray-500">Key Metrics & Distribution</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="px-5 py-4">
                            <div className="flex divide-x divide-gray-200 dark:divide-white/10">
                                <div className="text-center flex-1 px-2">
                                    <p className="text-2xl font-black text-blue-500">{dashboardData.profitFactor.toFixed(2)}</p>
                                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Profit Factor</p>
                                </div>
                                <div className="text-center flex-1 px-2">
                                    <p className="text-2xl font-black text-primary">${dashboardData.avgWin.toFixed(0)}</p>
                                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Avg Win</p>
                                </div>
                                <div className="text-center flex-1 px-2">
                                    <p className="text-2xl font-black text-red-500">${dashboardData.avgLoss.toFixed(0)}</p>
                                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Avg Loss</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <PieChartIcon size={14} className="text-blue-500" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Profit by Symbol</h4>
                                </div>
                                <span className={`text-xs font-black ${symbolPerformance.reduce((s, d) => s + d.value, 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                    ${Math.abs(symbolPerformance.reduce((s, d) => s + d.value, 0)).toFixed(0)}
                                </span>
                            </div>
                            <div className="space-y-2.5 overflow-y-auto flex-1 min-h-0">
                                {symbolPerformance.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-2">No data</p>
                                ) : (
                                    symbolPerformance.map((item, i) => {
                                        const maxAbs = Math.max(...symbolPerformance.map(d => Math.abs(d.value)), 1);
                                        const pct = (Math.abs(item.value) / maxAbs) * 100;
                                        const colors = ['hsl(var(--primary))', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];
                                        return (
                                            <div key={item.name} className="flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-16 truncate">{item.name}</span>
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                                                </div>
                                                <span className={`text-xs font-black min-w-[55px] text-right ${item.value >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                    {item.value >= 0 ? '+' : ''}{item.value.toFixed(0)}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-4 flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-orange-500" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Lot by Symbol</h4>
                                </div>
                                <span className="text-xs font-black text-gray-700 dark:text-gray-200">
                                    {lotDistribution.reduce((s, d) => s + d.value, 0).toFixed(2)} lots
                                </span>
                            </div>
                            <div className="space-y-2.5 overflow-y-auto flex-1 min-h-0">
                                {lotDistribution.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-2">No data</p>
                                ) : (
                                    lotDistribution.filter(d => d.value > 0).map((item, i) => {
                                        const totalLots = lotDistribution.reduce((s, d) => s + d.value, 0);
                                        const pct = totalLots > 0 ? (item.value / totalLots) * 100 : 0;
                                        const colors = ['hsl(var(--primary))', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];
                                        return (
                                            <div key={item.name} className="flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-16 truncate">{item.name}</span>
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                                                </div>
                                                <span className="text-xs font-black text-gray-600 dark:text-gray-300 min-w-[55px] text-right">
                                                    {item.value.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ROW 2: Daily Win Rate (12) — Full Width --- */}
                <div className="xl:col-span-12 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-green-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Daily Win Rate</h3>
                                    <p className="text-xs text-gray-600">Win % by Day</p>
                                </div>
                            </div>
                        </div>
                        <DailyWinRateChart data={dailyWinRates} height={250} />
                    </div>
                </div>

                {/* --- ROW 3: Trading Sessions (5) + Day of Week (7) --- */}
                <div className="xl:col-span-5 min-w-0">
                    <TradingSessionsCard data={sessionPerformance} />
                </div>
                <div className="xl:col-span-7 min-w-0">
                    <DayOfWeekCard data={dayOfWeekPerformance} />
                </div>

                {/* --- ROW 4: Recent Trades (5) + Symbol Performance (7) --- */}
                <div className="xl:col-span-5 min-w-0">
                    <RecentTradesMini trades={recentTrades} />
                </div>
                <div className="xl:col-span-7 min-w-0">
                    <SymbolPerformanceList data={symbolAnalytics} />
                </div>

                {/* --- ROW 5: Top Trades (5) + Monthly Analytics (7) --- */}
                <div className="xl:col-span-5 min-w-0">
                    <TopTradesList bestTrades={bestTrades} worstTrades={worstTrades} />
                </div>
                <div className="xl:col-span-7 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-purple-500 overflow-hidden h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <CalendarRange size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-700 dark:text-white text-sm">Monthly Analytics</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Net Profit by Month</p>
                            </div>
                        </div>
                        <MonthlyAnalyticsChart data={monthlyAnalytics} />
                    </div>
                </div>
            </div>
        </div>
    );
}
