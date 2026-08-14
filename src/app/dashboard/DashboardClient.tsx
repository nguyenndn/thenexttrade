"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import {
    TrendingUp,
    Trophy,
    PieChart as PieChartIcon,
    Layers,
    CalendarRange,
    Gauge,
    HelpCircle,
    X,
} from "lucide-react";
import { MetricHelp } from "@/components/metrics/MetricHelp";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { DashboardManager } from "@/components/dashboard/grid/DashboardManager";
import { MobileProStatusBanner } from "@/components/dashboard/MobileProStatusBanner";
import { ActivationChecklist } from "@/components/dashboard/ActivationChecklist";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { DashboardCoachNudge } from "@/components/coach/DashboardCoachNudge";
import { FirstSessionWizard } from "@/components/onboarding/FirstSessionWizard";
import { FirstSessionLauncher } from "@/components/onboarding/FirstSessionLauncher";
import { FirstSyncSuccessModal } from "@/components/onboarding/FirstSyncSuccessModal";
import { ExperimentResult } from "@/components/experiments/ExperimentResult";
import { ExperimentProgress } from "@/components/experiments/ExperimentProgress";
import {
    celebrateFirstSyncAction,
    markFirstInsightViewedAction,
} from "@/actions/first-session-onboarding";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// Static imports for above-fold charts (always visible — no skeleton needed)
import { BalanceGrowthChart } from "@/components/dashboard/BalanceGrowthChart";
import { DailyWinRateChart } from "@/components/dashboard/DailyWinRateChart";

// Lazy load below-fold chart components — only loaded when user scrolls to them
const ChartSkeleton = () => (
    <div className="h-[280px] bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl" />
);
const ProfitDistributionChart = dynamic(
    () =>
        import("@/components/dashboard/ProfitDistributionChart").then(
            (m) => m.ProfitDistributionChart
        ),
    { loading: () => <ChartSkeleton /> }
);
const LotDistributionChart = dynamic(
    () =>
        import("@/components/dashboard/LotDistributionChart").then(
            (m) => m.LotDistributionChart
        ),
    { loading: () => <ChartSkeleton /> }
);
const MonthlyAnalyticsChart = dynamic(
    () =>
        import("@/components/dashboard/MonthlyAnalyticsChart").then(
            (m) => m.MonthlyAnalyticsChart
        ),
    { loading: () => <ChartSkeleton /> }
);
const TopTradesList = dynamic(
    () =>
        import("@/components/dashboard/TopTradesList").then(
            (m) => m.TopTradesList
        ),
    { loading: () => <ChartSkeleton /> }
);
const SymbolPerformanceList = dynamic(
    () =>
        import("@/components/dashboard/SymbolPerformanceList").then(
            (m) => m.SymbolPerformanceList
        ),
    { loading: () => <ChartSkeleton /> }
);
const RecentTradesMini = dynamic(
    () =>
        import("@/components/dashboard/RecentTradesMini").then(
            (m) => m.RecentTradesMini
        ),
    { loading: () => <ChartSkeleton /> }
);
const TradingSessionsCard = dynamic(
    () =>
        import("@/components/dashboard/TradingSessionsCard").then(
            (m) => m.TradingSessionsCard
        ),
    { loading: () => <ChartSkeleton /> }
);
const DayOfWeekCard = dynamic(
    () =>
        import("@/components/dashboard/DayOfWeekCard").then(
            (m) => m.DayOfWeekCard
        ),
    { loading: () => <ChartSkeleton /> }
);

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
        hasGlobalTrades,
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
        coachPlan,
        learningRecommendations,
        firstSessionState,
        tradingGoal,
        weeklyReviewEligibility,
        suppress,
        initialDashboards,
    } = data;
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Use canonical growthViewModel.nextAction as single source for coach action
    const actualNextBestAction = data.growthViewModel?.nextAction || nextBestAction;

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
        Object.keys(localStorage).forEach((k) => {
            if (
                k.startsWith("dismissed_report_nudge_") &&
                k !== `dismissed_report_nudge_${today}`
            ) {
                localStorage.removeItem(k);
            }
        });
        setReportNudgeDismissed(true);
    };

    const handleTradeClick = (id: string) => {
        const trade = recentTrades.find((t) => t.id === id);
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
        const forceOpen =
            params.get("firstSession") === "1" ||
            params.get("onboarding") === "1";
        if (
            (firstSessionState.shouldAutoOpen || forceOpen) &&
            !firstSessionState.isCompleted
        ) {
            setShowFirstSession(true);
        }
    }, [firstSessionState]);

    // Detect "brand new user" — no trades at all globally in database
    const hasNoData = !hasGlobalTrades;

    // The old `NO_ACCOUNT` branch was dead: getNextBestAction returns id
    // "connect_account" for that stage, and hasNoData already suppresses the
    // nudge for any user with no trades at all.
    const shouldSuppressCoachNudge = hasNoData;

    const shouldHideActivationChecklistForPrimaryReview =
        weeklyReviewEligibility?.ready &&
        activationState.nextStep?.id === "GENERATE_WEEKLY_REVIEW" &&
        !reportNudgeDismissed &&
        !suppress?.reportNudge;

    // First Sync Success Modal state
    const [showSyncSuccess, setShowSyncSuccess] = useState(
        () => !!firstSessionState?.showFirstSyncSuccess
    );
    const handleCelebrate = async () => {
        setShowSyncSuccess(false);
        await markFirstInsightViewedAction();
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
                firstInsight={firstSessionState?.firstInsight}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <GreetingHeader
                    userName={userName}
                    currentAccountId={currentAccountId}
                    hideFilters={hasNoData}
                />
            </div>

            <div className="mt-4 space-y-4 lg:mt-5 lg:space-y-5">
                {/* Active Experiment Banner */}
                {data.growthViewModel?.activeExperiment && (
                    <div className="mb-4">
                        <ExperimentProgress experiment={data.growthViewModel.activeExperiment} />
                    </div>
                )}

                {/* Completed Experiment Result Card */}
                {!data.growthViewModel?.activeExperiment && data.growthViewModel?.completedExperiment && (
                    <div className="mb-4">
                        <ExperimentResult experiment={data.growthViewModel.completedExperiment} />
                    </div>
                )}

                {/* Mobile Pro Status Banner — hide only the Free-Plan nudge for brand-new
                    users (no trade data). Real Pro statuses (ACTIVE/GRACE/REVOKED/EXPIRED)
                    still render so a freshly approved user sees their status on mobile,
                    where the sidebar widget is hidden. */}
                <MobileProStatusBanner hideFreeNudge={hasNoData} />

                {/* Coach Plan Modal (Trigger bar hidden from dashboard UI, accessible via Notification Bell) */}
                {actualNextBestAction && (
                    <DashboardCoachNudge
                        nextBestAction={actualNextBestAction}
                        learningRecommendations={
                            learningRecommendations || []
                        }
                        coachPlan={coachPlan}
                        hideTrigger={true}
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

                {/* Welcome Hero — replaces empty charts for new users */}
                {hasNoData ? (
                    <WelcomeHero
                        userName={userName}
                        activationState={activationState}
                        tradingGoal={tradingGoal}
                    />
                ) : (
                    <>
                        {/* Activation Checklist — shown for in-progress users */}
                        {activationState.completedCount <
                            activationState.totalCount &&
                            !suppress?.activationChecklist &&
                            !shouldHideActivationChecklistForPrimaryReview && (
                                <ActivationChecklist state={activationState} />
                            )}

                        <DashboardManager
                            initialDashboards={initialDashboards}
                            data={data}
                            onTradeClick={handleTradeClick}
                            onAddTrade={handleAddTrade}
                            currentAccountId={currentAccountId}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
