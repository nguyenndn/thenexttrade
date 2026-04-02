"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, Trophy, PieChart, Layers, CalendarRange } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
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
const WinLossDistribution = dynamic(() => import("@/components/dashboard/WinLossDistribution").then(m => m.WinLossDistribution), { loading: () => <ChartSkeleton /> });

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
            {insight && <InsightBanner insight={insight} />}

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

                {/* --- ROW 1: Stats vertical (3) + Period Growth (6) + Distributions (3) --- */}
                <div className="xl:col-span-3 min-w-0">
                    <StatsGrid data={{
                        profitFactor: dashboardData.profitFactor,
                        avgWin: dashboardData.avgWin,
                        avgLoss: dashboardData.avgLoss
                    }} vertical />
                </div>
                <div className="xl:col-span-6 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Period Growth</h3>
                                    <p className="text-xs text-gray-600">Cumulative Net Profit</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600">Net Profit</p>
                                <p className={`text-sm font-bold ${(chartData[chartData.length - 1]?.balance || 0) >= 0 ? "text-primary" : "text-red-500"}`}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(chartData[chartData.length - 1]?.balance || 0)}
                                </p>
                            </div>
                        </div>
                        <BalanceGrowthChart data={chartData} />
                    </div>
                </div>
                <div className="xl:col-span-3 min-w-0">
                    <div className="flex flex-col gap-4 h-full">
                        {/* Profit Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500 flex flex-col overflow-hidden flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <PieChart size={20} />
                                </div>
                                <h3 className="font-bold text-gray-700 dark:text-white text-sm">Profit Distribution</h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ProfitDistributionChart data={symbolPerformance} height={110} innerRadius={22} outerRadius={36} />
                            </div>
                        </div>

                        {/* Lot Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-orange-500 flex flex-col overflow-hidden flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                    <Layers size={20} />
                                </div>
                                <h3 className="font-bold text-gray-700 dark:text-white text-sm">Lot Distribution</h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                <LotDistributionChart data={lotDistribution} height={110} innerRadius={22} outerRadius={36} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ROW 2: Daily Win Rate (8) + Win/Loss Distribution (4) --- */}
                <div className="xl:col-span-8 min-w-0">
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
                <div className="xl:col-span-4 min-w-0">
                     <WinLossDistribution 
                        wins={dashboardData.winCount} 
                        losses={dashboardData.lossCount} 
                        breakEvens={dashboardData.breakEvenCount} 
                        winRate={dashboardData.winRate} 
                     />
                </div>

                {/* --- ROW 3: Top Trades (5) + Monthly Analytics (7) --- */}
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

                {/* --- ROW 4: Recent Trades (5) + Symbol Performance (7) --- */}
                <div className="xl:col-span-5 min-w-0">
                    <RecentTradesMini trades={recentTrades} />
                </div>
                <div className="xl:col-span-7 min-w-0">
                    <SymbolPerformanceList data={symbolAnalytics} />
                </div>
            </div>
        </div>
    );
}
