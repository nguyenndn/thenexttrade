"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, TrendingDown, DollarSign, Trophy, Activity, Sun, Moon, CloudSun, PieChart, Layers, CalendarRange, Target, Wallet, BarChart2, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { AnimatedMorningIcon, AnimatedAfternoonIcon, AnimatedEveningIcon } from "@/components/dashboard/GreetingIcons";
import { tradingQuotes } from "@/config/quotes";
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
    recentActivity: any[]; // Deprecated
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
    recentActivity, // Unused
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

    const [greeting, setGreeting] = useState({
        text: "Welcome back",
        icon: <AnimatedMorningIcon size={32} />
    });
    
    // Default quote or empty until mounted
    const [quote, setQuote] = useState("The goal of a successful trader is to make the best trades. Money is secondary.");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting({ text: "Good morning", icon: <AnimatedMorningIcon size={32} /> });
        } else if (hour >= 12 && hour < 18) {
            setGreeting({ text: "Good afternoon", icon: <AnimatedAfternoonIcon size={32} /> });
        } else {
            setGreeting({ text: "Good evening", icon: <AnimatedEveningIcon size={32} /> });
        }
        
        // Pick random quote
        const randomQuote = tradingQuotes[Math.floor(Math.random() * tradingQuotes.length)];
        setQuote(randomQuote);
    }, []);



    const kpiCards = [
        {
            title: "Total Balance",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardData.totalBalance),
            description: "Live + Funded",
            isPositive: true,
            icon: DollarSign,
            color: "text-primary",
            bg: "bg-primary/10"
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
            color: dashboardData.periodPnL >= 0 ? "text-primary" : "text-red-500",
            bg: dashboardData.periodPnL >= 0 ? "bg-primary/10" : "bg-red-50 dark:bg-red-500/10"
        }
    ];

    return (
        <div className="space-y-4">
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
                            {greeting.text}, <span className="text-primary uppercase">{userName}</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium italic border-l-2 border-primary pl-3">
                        &quot;{quote}&quot;
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DashboardFilter currentAccountId={currentAccountId} />
                </div>
            </div>

            {/* Hero Stats Bar */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white to-gray-50 dark:from-[#0B0E14] dark:to-[#131720] border border-gray-200 dark:border-white/5 p-6 shadow-lg">
                {/* Glow effects */}
                <div className="absolute top-0 left-1/4 w-40 h-40 bg-primary/10 dark:bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Balance */}
                    <div className="text-center sm:text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Total Balance</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardData.totalBalance)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Live + Funded</p>
                    </div>

                    {/* Period P&L */}
                    <div className="text-center border-l-0 sm:border-l border-gray-200 dark:border-white/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Period P&L</p>
                        <div className="flex items-center justify-center gap-2">
                            {dashboardData.periodPnL >= 0
                                ? <TrendingUp size={20} className="text-primary" />
                                : <TrendingDown size={20} className="text-red-500" />
                            }
                            <p className={`text-3xl font-black tracking-tight ${
                                dashboardData.periodPnL >= 0 ? 'text-primary' : 'text-red-500'
                            }`}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(dashboardData.periodPnL)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Realized P&L</p>
                    </div>

                    {/* Win Rate */}
                    <div className="text-center sm:text-right border-l-0 sm:border-l border-gray-200 dark:border-white/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Win Rate</p>
                        <div className="flex items-center justify-center sm:justify-end gap-3">
                            <div className="relative w-14 h-14">
                                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                    <circle cx="28" cy="28" r="24" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="4" fill="none" />
                                    <circle
                                        cx="28" cy="28" r="24"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(dashboardData.winRate / 100) * 150.8} 150.8`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900 dark:text-white">
                                    {dashboardData.winRate.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Winning trades</p>
                    </div>
                </div>
            </div>


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
