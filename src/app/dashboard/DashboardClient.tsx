"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, TrendingDown, DollarSign, Trophy, Flame, Activity, Sun, Moon, CloudSun } from "lucide-react";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";

const DashboardCharts = dynamic(() => import('@/components/dashboard/DashboardCharts'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />
});

const SymbolPieChart = dynamic(() => import('@/components/dashboard/SymbolPieChart').then(mod => ({ default: mod.SymbolPieChart })), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />
});

import { AccountSelector } from "@/components/dashboard/AccountSelector";

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
        winRateChange: number; // Placeholder/Calculated
        streak: number;
        todayPnL: number;
        // Pro Metrics
        profitFactor: number;
        avgWin: number;
        avgLoss: number;
    };
    chartData: { name: string; balance: number }[];
    recentActivity: {
        id: string;
        symbol: string;
        type: string; // "TP" | "SL" | "CLOSE"
        title: string;
        timeAgo: string;
    }[];
    recentTrades: any[]; // Full trade objects
    symbolPerformance: { name: string; value: number }[];
    currentAccountId?: string;
}

import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";

export default function DashboardClient({
    userData,
    allBadges = [],
    userName = "Trader",
    dashboardData,
    chartData,
    recentActivity,
    recentTrades,
    symbolPerformance,
    currentAccountId
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
            title: "Winrate (Month)",
            value: `${dashboardData.winRate.toFixed(1)}%`,
            change: "", // Removed negative indicator as requested
            isPositive: true,
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10"
        },
        {
            title: "Login Streak",
            value: `${dashboardData.streak} Days`,
            change: "Keep it up!",
            isPositive: true,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-500/10"
        },
        {
            title: "Today's P/L",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(dashboardData.todayPnL),
            change: "Live",
            isPositive: dashboardData.todayPnL >= 0,
            icon: Activity,
            color: dashboardData.todayPnL >= 0 ? "text-[#00C888]" : "text-red-500",
            bg: dashboardData.todayPnL >= 0 ? "bg-[#00C888]/10" : "bg-red-50 dark:bg-red-500/10"
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
                    <AccountSelector currentAccountId={currentAccountId} />

                    {/* Market Sentiment Widget */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#0B0E14] rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Market Sentiment</span>
                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm">
                            <TrendingUp size={16} />
                            Bullish
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
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

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Capital Growth</h3>
                            <p className="text-xs text-gray-500">Equity curve performance</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Total Growth</p>
                                <p className="text-sm font-bold text-[#00C888]">+{(dashboardData.totalBalance > 0 ? ((chartData[chartData.length - 1]?.balance - chartData[0]?.balance) / chartData[0]?.balance * 100) : 0).toFixed(2)}%</p>
                            </div>
                            <div className="h-8 w-[1px] bg-gray-100 dark:bg-white/10"></div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Today</p>
                                <p className={`text-sm font-bold ${dashboardData.todayPnL >= 0 ? "text-[#00C888]" : "text-red-500"}`}>
                                    {dashboardData.todayPnL >= 0 ? "+" : ""}{dashboardData.todayPnL !== 0 ? ((dashboardData.todayPnL / (dashboardData.totalBalance - dashboardData.todayPnL)) * 100).toFixed(2) : "0.00"}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <DashboardCharts data={chartData} />
                    </div>
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <SymbolPieChart data={symbolPerformance} />

                    {/* Recent Activity - Styled to match Symbols Traded */}
                    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                                <p className="text-xs text-gray-500">Latest trading actions</p>
                            </div>
                            <Link href="/dashboard/journal" className="text-xs font-medium text-[#00C888] hover:text-[#00b078]">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentActivity.slice(0, 4).map((activity) => (
                                <div
                                    key={activity.id}
                                    onClick={() => handleTradeClick(activity.id)}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${activity.type === 'TP'
                                            ? 'bg-green-100 text-green-600 dark:bg-green-500/20'
                                            : activity.type === 'SL'
                                                ? 'bg-red-100 text-red-600 dark:bg-red-500/20'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                                            }`}>
                                            {activity.type}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#00C888] transition-colors">{activity.title}</p>
                                            <p className="text-[10px] text-gray-400">{activity.timeAgo}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-gray-300 group-hover:text-[#00C888] transition-colors" />
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <div className="text-center py-4 text-gray-400 text-xs">
                                    No activity
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Remove bottom Recent Activity */}
        </div>
    );
}

