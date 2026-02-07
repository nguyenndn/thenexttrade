"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, TrendingDown, DollarSign, Trophy, Flame, Activity, Sun, Moon, CloudSun, ArrowRight, PieChart, Layers, CalendarRange } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { MonthlyAnalyticsChart } from "@/components/dashboard/MonthlyAnalyticsChart";
import { DashboardGrid, DashboardMain, DashboardSide } from "@/components/dashboard/DashboardGrid";
import { BalanceGrowthChart } from "@/components/dashboard/BalanceGrowthChart";
import { ProfitDistributionChart } from "@/components/dashboard/ProfitDistributionChart";
import { LotDistributionChart } from "@/components/dashboard/LotDistributionChart";
import { StatsGrid } from "@/components/dashboard/StatsGrid";

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
    monthlyAnalytics
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
            change: "+0.0%", // Todo: Calculate change
            isPositive: true,
            icon: DollarSign,
            color: "text-[#00C888]",
            bg: "bg-[#00C888]/10"
        },
        {
            title: "Winrate (Range)",
            value: `${dashboardData.winRate.toFixed(1)}%`,
            change: "", // Removed negative indicator as requested
            isPositive: true,
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10"
        },
        {
            title: "Win Streak",
            value: `${dashboardData.streak}`,
            change: "Consecutive",
            isPositive: true,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-500/10"
        },
        {
            title: "Net Profit (Range)",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(dashboardData.periodPnL),
            change: "Filtered",
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpiCards.map((card, index) => {
                            const Icon = card.icon;
                            // Map colors for top border
                            const borderColor = index === 0 ? "border-t-[#00C888]" :
                                index === 1 ? "border-t-amber-500" :
                                    index === 2 ? "border-t-orange-500" :
                                        card.isPositive ? "border-t-[#00C888]" : "border-t-red-500";

                            return (
                                <div key={index} className={`bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 ${borderColor}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${card.bg}`}>
                                            <Icon size={20} className={card.color} />
                                        </div>
                                        {card.change && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.isPositive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                                {card.change}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</h3>
                                    <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
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
                    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-[#00C888]">
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
                </DashboardMain>

                <DashboardSide>
                    {/* Charts Row: Profit & Lot Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Profit Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-blue-500">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <PieChart size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Profit Distribution</h3>
                                    <p className="text-xs text-gray-500">By Symbol</p>
                                </div>
                            </div>
                            <ProfitDistributionChart data={symbolPerformance} height={235} />
                        </div>

                        {/* Lot Distribution */}
                        <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-orange-500">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Lot Distribution</h3>
                                    <p className="text-xs text-gray-500">By Volume</p>
                                </div>
                            </div>
                            <LotDistributionChart data={lotDistributionData} height={235} />
                        </div>
                    </div>

                    {/* Recent Activity -> Monthly Analytics */}
                    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex-1 border-t-4 border-t-purple-500">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <CalendarRange size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Monthly Analytics</h3>
                                    <p className="text-xs text-gray-500">Net Profit by Month</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <MonthlyAnalyticsChart data={monthlyAnalytics} />
                        </div>
                    </div>
                </DashboardSide>
            </DashboardGrid>
        </div>
    );
}
