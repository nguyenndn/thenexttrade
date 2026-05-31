"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp, Trophy, PieChart as PieChartIcon, Layers, CalendarRange, Gauge, HelpCircle, X } from "lucide-react";
import { MetricHelp } from "@/components/metrics/MetricHelp";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { InsightBanner } from "@/components/dashboard/InsightBanner";
import { MobileProStatusBanner } from "@/components/dashboard/MobileProStatusBanner";
import { ActivationChecklist } from "@/components/dashboard/ActivationChecklist";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { DashboardCoachNudge } from "@/components/coach/DashboardCoachNudge";
import { FirstSessionWizard } from "@/components/onboarding/FirstSessionWizard";
import { FirstSessionLauncher } from "@/components/onboarding/FirstSessionLauncher";
import { FirstSyncSuccessModal } from "@/components/onboarding/FirstSyncSuccessModal";
import { FirstDataReminderBanner } from "@/components/onboarding/FirstDataReminderBanner";
import { celebrateFirstSyncAction } from "@/actions/first-session-onboarding";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
// Static imports for above-fold charts (always visible — no skeleton needed)
import { BalanceGrowthChart } from "@/components/dashboard/BalanceGrowthChart";
import { DailyWinRateChart } from "@/components/dashboard/DailyWinRateChart";

// Lazy load below-fold chart components — only loaded when user scrolls to them
const ChartSkeleton = () => <div className="h-[280px] bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl" />;
const ProfitDistributionChart = dynamic(() => import("@/components/dashboard/ProfitDistributionChart").then(m => m.ProfitDistributionChart), { loading: () => <ChartSkeleton /> });
const LotDistributionChart = dynamic(() => import("@/components/dashboard/LotDistributionChart").then(m => m.LotDistributionChart), { loading: () => <ChartSkeleton /> });
const MonthlyAnalyticsChart = dynamic(() => import("@/components/dashboard/MonthlyAnalyticsChart").then(m => m.MonthlyAnalyticsChart), { loading: () => <ChartSkeleton /> });
const TopTradesList = dynamic(() => import("@/components/dashboard/TopTradesList").then(m => m.TopTradesList), { loading: () => <ChartSkeleton /> });
const SymbolPerformanceList = dynamic(() => import("@/components/dashboard/SymbolPerformanceList").then(m => m.SymbolPerformanceList), { loading: () => <ChartSkeleton /> });
const RecentTradesMini = dynamic(() => import("@/components/dashboard/RecentTradesMini").then(m => m.RecentTradesMini), { loading: () => <ChartSkeleton /> });
const TradingSessionsCard = dynamic(() => import("@/components/dashboard/TradingSessionsCard").then(m => m.TradingSessionsCard), { loading: () => <ChartSkeleton /> });
const DayOfWeekCard = dynamic(() => import("@/components/dashboard/DayOfWeekCard").then(m => m.DayOfWeekCard), { loading: () => <ChartSkeleton /> });

function HelpTooltip({ content }: { content: string }) {
    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        aria-label="Explain this metric"
                    >
                        <HelpCircle size={13} />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-[260px] bg-gray-950 px-3 py-2 text-xs leading-relaxed text-white shadow-xl dark:bg-white dark:text-gray-950"
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

import type { DashboardPageData } from "./dashboard-data.server";

export default function DashboardClient(data: DashboardPageData) {
    const {
        userName = "Trader",
        dashboardData,
        chartData,
        recentTrades,
        symbolPerformance,
        currentAccountId,
        monthlyAnalytics,
        dailyWinRates,
        selectedDates,
        bestTrades,
        worstTrades,
        symbolAnalytics,
        lotDistribution,
        tradeScore,
        insight,
        intelligenceScore,
        sessionPerformance,
        dayOfWeekPerformance,
        activationState,
        daysSinceLastReport,
        nextBestAction,
        learningRecommendations,
        firstSessionState,
        tradingGoal,
    } = data;
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Modal State
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [showTradeModal, setShowTradeModal] = useState(false);

    // Report Nudge dismiss state with localStorage + date key
    const [reportNudgeDismissed, setReportNudgeDismissed] = useState(false);
    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(`dismissed_report_nudge_${today}`) === "1") {
            setReportNudgeDismissed(true);
        }
    }, []);
    const handleDismissReportNudge = () => {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`dismissed_report_nudge_${today}`, "1");
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith("dismissed_report_nudge_") && k !== `dismissed_report_nudge_${today}`) {
                localStorage.removeItem(k);
            }
        });
        setReportNudgeDismissed(true);
    };

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

    // First Session Wizard State
    const [showFirstSession, setShowFirstSession] = useState(false);

    // Auto-open first session wizard on mount or when ?firstSession=1
    useEffect(() => {
        if (!firstSessionState) return;
        const params = new URLSearchParams(window.location.search);
        const forceOpen = params.get("firstSession") === "1" || params.get("onboarding") === "1";
        if ((firstSessionState.shouldAutoOpen || forceOpen) && !firstSessionState.isCompleted) {
            setShowFirstSession(true);
        }
    }, [firstSessionState]);

    // Detect "brand new user" — no trades at all
    const hasNoData = dashboardData.winCount === 0 && dashboardData.lossCount === 0 && recentTrades.length === 0;

    const shouldSuppressCoachNudge =
        hasNoData ||
        (nextBestAction?.id === "NO_ACCOUNT" &&
        firstSessionState &&
        !firstSessionState.isCompleted &&
        firstSessionState.accountCount === 0);

    // First Sync Success Modal state
    const [showSyncSuccess, setShowSyncSuccess] = useState(
        () => !!firstSessionState?.showFirstSyncSuccess
    );
    const handleCelebrate = async () => {
        setShowSyncSuccess(false);
        await celebrateFirstSyncAction();
    };

    return (
        <div className="w-full relative min-h-screen">
            <JournalEntryModal
                open={showTradeModal}
                onOpenChange={setShowTradeModal}
                entry={selectedTrade}
            />

            {/* First Sync Success Modal */}
            <FirstSyncSuccessModal
                open={showSyncSuccess}
                onClose={handleCelebrate}
                hasReports={firstSessionState?.hasReports ?? false}
            />

            {/* Header Section */}
            <GreetingHeader
                userName={userName}
                currentAccountId={currentAccountId}
                hideFilters={hasNoData}
            />

            <div className="mt-4 space-y-4 lg:mt-5 lg:space-y-5">
            {/* Mobile Pro Status Banner — suppress for brand-new users */}
            {!hasNoData && <MobileProStatusBanner />}

            {/* Coach & Next Action Engine Unified Nudge Bar */}
            {nextBestAction && !shouldSuppressCoachNudge && (
                <DashboardCoachNudge 
                    nextBestAction={nextBestAction} 
                    learningRecommendations={learningRecommendations || []} 
                />
            )}

            {/* First Session Onboarding Wizard & Launcher */}
            {firstSessionState && !firstSessionState.isCompleted && (
                <>
                    <FirstSessionLauncher
                        currentStep={firstSessionState.currentStep}
                        onOpen={() => setShowFirstSession(true)}
                    />
                    <FirstSessionWizard
                        state={firstSessionState}
                        open={showFirstSession}
                        onOpenChange={setShowFirstSession}
                    />
                </>
            )}

            {/* 24h Reminder: account connected but no trade data */}
            {firstSessionState?.showFirstDataReminder && (
                <FirstDataReminderBanner
                    preferredSyncMethod={firstSessionState.preferredSyncMethod}
                    firstAccountCreatedAt={firstSessionState.firstAccountCreatedAt}
                />
            )}

            {/* Welcome Hero — replaces empty charts for new users */}
            {hasNoData ? (
                <WelcomeHero userName={userName} activationState={activationState} tradingGoal={tradingGoal} />
            ) : (
            <>
            {/* Activation Checklist — shown for in-progress users */}
            {activationState.completedCount < activationState.totalCount && (
                <ActivationChecklist state={activationState} />
            )}

            {/* AI Insight Banner */}
            {insight && <InsightBanner insight={insight} score={intelligenceScore} />}

            {/* Report Nudge Card */}
            {!reportNudgeDismissed && (daysSinceLastReport === undefined || daysSinceLastReport === null || daysSinceLastReport >= 7) && dashboardData.totalBalance > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-500/15">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/15 rounded-lg shrink-0">
                        <PieChartIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 truncate">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Your weekly review is ready</span>
                        <span className="text-sm text-gray-600 dark:text-gray-500 ml-2 hidden sm:inline">— It's been {daysSinceLastReport == null ? "a while" : `${daysSinceLastReport} days`} since your last report. Generate one to uncover new insights.</span>
                    </div>
                    <a href="/dashboard/reports" className="shrink-0 bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors text-center">
                        Generate Report →
                    </a>
                    <button
                        onClick={handleDismissReportNudge}
                        className="p-1 rounded-md shrink-0 transition-colors text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 dark:text-emerald-500 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/15"
                        aria-label="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

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
                <div id="onborda-chart" className="xl:col-span-8 min-w-0">
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
                <div id="onborda-quickstats" className="xl:col-span-4 min-w-0">
                    <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-teal-500 h-auto xl:h-[420px] flex flex-col divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-500">
                                    <Gauge size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-bold text-gray-700 dark:text-white text-sm">Quick Stats</h3>
                                        <HelpTooltip content="A compact view of your trade efficiency for the selected account and date range." />
                                    </div>
                                    <p className="text-xs text-gray-500">Key Metrics & Distribution</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="px-5 py-4">
                            <div className="flex divide-x divide-gray-200 dark:divide-white/10">
                                <div className="text-center flex-1 px-2">
                                    <p className="text-2xl font-black text-blue-500">
                                        {!isFinite(dashboardData.profitFactor) ? "∞" : dashboardData.profitFactor.toFixed(2)}
                                    </p>
                                    <div className="mt-0.5 flex items-center justify-center gap-1">
                                        <p className="text-[11px] text-gray-500 font-semibold">Profit Factor</p>
                                        <MetricHelp metricId="profitFactor" compact />
                                    </div>
                                </div>
                                <div className="text-center flex-1 px-2">
                                    <p className="text-2xl font-black text-primary">${dashboardData.avgWin.toFixed(0)}</p>
                                    <div className="mt-0.5 flex items-center justify-center gap-1">
                                        <p className="text-[11px] text-gray-500 font-semibold">Avg Win</p>
                                        <MetricHelp metricId="avgWin" compact />
                                    </div>
                                </div>
                                <div className="text-center flex-1 px-2">
                                    <p className="text-2xl font-black text-red-500">${dashboardData.avgLoss.toFixed(0)}</p>
                                    <div className="mt-0.5 flex items-center justify-center gap-1">
                                        <p className="text-[11px] text-gray-500 font-semibold">Avg Loss</p>
                                        <MetricHelp metricId="avgLoss" compact />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <PieChartIcon size={14} className="text-blue-500" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Profit by Symbol</h4>
                                    <HelpTooltip content="Net profit grouped by symbol for the selected account and date range." />
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
                                    <HelpTooltip content="Total lot size grouped by symbol. This helps show where your exposure is concentrated." />
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
                                    <p className="text-xs text-gray-600">Last 7 Days • Selected period highlighted</p>
                                </div>
                            </div>
                        </div>
                        <DailyWinRateChart data={dailyWinRates} height={250} selectedDates={selectedDates} />
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
            </>
            )}
            </div>
        </div>
    );
}
