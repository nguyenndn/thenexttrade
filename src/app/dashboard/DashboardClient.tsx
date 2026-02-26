"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, Trophy, PieChart, Layers, CalendarRange } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { MonthlyAnalyticsChart } from "@/components/dashboard/MonthlyAnalyticsChart";
// Grid layout is now inline in this file (no longer using DashboardGrid wrapper)
import { BalanceGrowthChart } from "@/components/dashboard/BalanceGrowthChart";
import { ProfitDistributionChart } from "@/components/dashboard/ProfitDistributionChart";
import { LotDistributionChart } from "@/components/dashboard/LotDistributionChart";
import { DailyWinRateChart } from "@/components/dashboard/DailyWinRateChart";
import { TopTradesList } from "@/components/dashboard/TopTradesList";
import { SymbolPerformanceList } from "@/components/dashboard/SymbolPerformanceList";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentTradesMini } from "@/components/dashboard/RecentTradesMini";
import { WinLossDistribution } from "@/components/dashboard/WinLossDistribution";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

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

            {/* Hero Stats Bar */}
            <DashboardHero 
                totalBalance={dashboardData.totalBalance} 
                periodPnL={dashboardData.periodPnL} 
                winRate={dashboardData.winRate} 
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
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Period Growth</h3>
                                    <p className="text-xs text-gray-500">Cumulative Net Profit</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Net Profit</p>
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
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500 flex flex-col overflow-hidden flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <PieChart size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Profit Distribution</h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ProfitDistributionChart data={symbolPerformance} height={110} innerRadius={22} outerRadius={36} />
                            </div>
                        </div>

                        {/* Lot Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-orange-500 flex flex-col overflow-hidden flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                    <Layers size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Lot Distribution</h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                <LotDistributionChart data={lotDistribution} height={110} innerRadius={22} outerRadius={36} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ROW 2: Daily Win Rate (8) + Win/Loss Distribution (4) --- */}
                <div className="xl:col-span-8 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-green-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Daily Win Rate</h3>
                                    <p className="text-xs text-gray-500">Win % by Day</p>
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
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-purple-500 overflow-hidden h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <CalendarRange size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Monthly Analytics</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Net Profit by Month</p>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyAnalytics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload, label }: any) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl">
                                                        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                                                        <p className="text-base font-bold text-gray-900 dark:text-white">
                                                            Net Profit: <span className="text-primary">${Number(payload[0].value).toFixed(2)}</span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="hsl(var(--primary))"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
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
