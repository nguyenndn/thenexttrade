"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, TrendingDown, DollarSign, Trophy, Flame, Activity, Sun, Moon, CloudSun, ArrowRight, PieChart, Layers, CalendarRange, Target } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { MonthlyAnalyticsChart } from "@/components/dashboard/MonthlyAnalyticsChart";
import { DashboardGrid, DashboardMain, DashboardSide } from "@/components/dashboard/DashboardGrid";
import { BalanceGrowthChart } from "@/components/dashboard/BalanceGrowthChart";
import { ProfitDistributionChart } from "@/components/dashboard/ProfitDistributionChart";
import { LotDistributionChart } from "@/components/dashboard/LotDistributionChart";
import { DailyWinRateChart } from "@/components/dashboard/DailyWinRateChart";
import { TopTradesList } from "@/components/dashboard/TopTradesList";
import { SymbolPerformanceList } from "@/components/dashboard/SymbolPerformanceList";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

interface DashboardClientProps {
    userData?: {
        xp: number;
        level: number;
        badges: any[];
    };
    allBadges?: any[];
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
    };
    chartData: { date: string; balance: number }[];
    recentActivity: any[]; // Deprecated
    recentTrades: any[]; // Full trade objects
    symbolPerformance: { name: string; value: number }[];
    currentAccountId?: string;
    monthlyAnalytics: { date: string; value: number }[];
    dailyWinRates: { date: string; winRate: number; trades: number; wins: number }[];
    bestTrades: any[];
    worstTrades: any[];
    symbolAnalytics: any[];
}

export default function DashboardClient({
    userData,
    allBadges = [],
    userName = "Trader",
    dashboardData,
    chartData,
    recentActivity, // Unused
    recentTrades,
    symbolPerformance,
    currentAccountId,
    monthlyAnalytics,
    dailyWinRates,
    bestTrades,
    worstTrades,
    symbolAnalytics
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

    const [greeting, setGreeting] = useState({
        text: "Welcome back",
        icon: <span className="text-2xl">👋</span>
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting({ text: "Good morning", icon: <Sun className="text-yellow-500" size={32} /> });
        } else if (hour >= 12 && hour < 18) {
            setGreeting({ text: "Good afternoon", icon: <CloudSun className="text-orange-500" size={32} /> });
        } else {
            setGreeting({ text: "Good evening", icon: <Moon className="text-blue-500" size={32} /> });
        }
    }, []);

    // Calculate Lot Distribution
    const lotStats = recentTrades.reduce((acc: { [key: string]: number }, trade: any) => {
        const symbol = trade.symbol || "Unknown";
        const volume = Number(trade.lotSize) || 0;
        if (!acc[symbol]) acc[symbol] = 0;
        acc[symbol] += volume;
        return acc;
    }, {});

    const lotDistributionData = Object.entries(lotStats)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    const kpiCards = [
        {
            title: "Total Balance",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardData.totalBalance),
            description: "Live + Funded",
            isPositive: true,
            icon: DollarSign,
            color: "text-[#00C888]",
            bg: "bg-[#00C888]/10"
        },
        {
            title: "Winrate (Range)",
            value: `${dashboardData.winRate.toFixed(1)}%`,
            description: "Winning trades / Total",
            isPositive: true,
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10"
        },
        {
            title: "Net Profit (Range)",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(dashboardData.periodPnL),
            description: "Realized P&L",
            isPositive: dashboardData.periodPnL >= 0,
            icon: Activity,
            color: dashboardData.periodPnL >= 0 ? "text-[#00C888]" : "text-red-500",
            bg: dashboardData.periodPnL >= 0 ? "bg-[#00C888]/10" : "bg-red-50 dark:bg-red-500/10"
        }
    ];

    return (
        <div className="space-y-6">
            <JournalEntryModal
                open={showTradeModal}
                onOpenChange={setShowTradeModal}
                entry={selectedTrade}
            />

            {/* Header Section */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {greeting.icon}
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {greeting.text}, <span className="text-[#00C888] uppercase">{userName}</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium italic border-l-2 border-[#00C888] pl-3">
                        "The goal of a successful trader is to make the best trades. Money is secondary."
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DashboardFilter currentAccountId={currentAccountId} />
                </div>
            </div>

            <DashboardGrid>
                <DashboardMain>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kpiCards.map((card, index) => {
                            const Icon = card.icon;
                            // Map colors for top border
                            const borderColor = index === 0 ? "border-t-[#00C888]" :
                                index === 1 ? "border-t-amber-500" :
                                    index === 2 ? "border-t-orange-500" :
                                        card.isPositive ? "border-t-[#00C888]" : "border-t-red-500";

                            const colSpanClass = index === 2 ? "sm:col-span-2 lg:col-span-1" : "";

                            return (
                                <div key={index} className={`bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 ${borderColor} ${colSpanClass}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-3 rounded-xl ${card.bg}`}>
                                            <Icon size={20} className={card.color} />
                                        </div>
                                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{card.title}</h3>
                                    </div>
                                    <p className={`text-lg font-black ${card.color}`}>{card.value}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-1">{card.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pro Stats Grid */}
                    <StatsGrid data={{
                        profitFactor: dashboardData.profitFactor,
                        avgWin: dashboardData.avgWin,
                        avgLoss: dashboardData.avgLoss
                    }} />

                    {/* Balance Growth Chart */}
                    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-[#00C888]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#00C888]/10 rounded-lg text-[#00C888]">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Period Growth</h3>
                                    <p className="text-xs text-gray-500">Cumulative Net Profit</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Net Profit</p>
                                <p className={`text-sm font-bold ${(chartData[chartData.length - 1]?.balance || 0) >= 0 ? "text-[#00C888]" : "text-red-500"}`}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(chartData[chartData.length - 1]?.balance || 0)}
                                </p>
                            </div>
                        </div>
                        <BalanceGrowthChart data={chartData} />
                    </div>

                    {/* Bottom Row: Daily Win Rate & Top Trades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Daily Win Rate Chart */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-green-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Daily Win Rate</h3>
                                        <p className="text-xs text-gray-500">Win % by Day</p>
                                    </div>
                                </div>
                            </div>
                            <DailyWinRateChart data={dailyWinRates} height={250} />
                        </div>

                        {/* Top Trades */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-cyan-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Top Trades</h3>
                                        <p className="text-xs text-gray-500">Best & Worst Performance</p>
                                    </div>
                                </div>
                            </div>
                            <TopTradesList bestTrades={bestTrades} worstTrades={worstTrades} />
                        </div>
                    </div>
                </DashboardMain>

                <DashboardSide>
                    {/* Charts Row: Profit & Lot Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 md:col-span-2 xl:col-span-1">
                        {/* Profit Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-blue-500 h-[324px] flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <PieChart size={20} />
                                </div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Profit Distribution</h3>
                            </div>
                            <ProfitDistributionChart data={symbolPerformance} height={210} innerRadius={60} outerRadius={80} />
                        </div>

                        {/* Lot Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-orange-500 h-[324px] flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                    <Layers size={20} />
                                </div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Lot Distribution</h3>
                            </div>
                            <LotDistributionChart data={lotDistributionData} height={210} innerRadius={60} outerRadius={80} />
                        </div>
                    </div>

                    {/* Monthly Analytics */}
                    <div className="md:col-span-2 xl:col-span-1 bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-purple-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <CalendarRange size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Monthly Analytics</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Net Profit by Month</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
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
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#F9FAFB'
                                        }}
                                        formatter={(value?: number) => [`$${value || 0}`, 'Net Profit']}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#00C888"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Symbol Performance List */}
                    <div className="md:col-span-2 xl:col-span-1">
                        <SymbolPerformanceList data={symbolAnalytics} />
                    </div>
                </DashboardSide>
            </DashboardGrid>
        </div>
    );
}
