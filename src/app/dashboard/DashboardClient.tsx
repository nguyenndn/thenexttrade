"use client";

import { useState, useEffect } from "react";
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
import { MilestoneToaster } from "@/components/dashboard/MilestoneToaster";
import { markFirstInsightViewedAction } from "@/actions/first-session-onboarding";
import { useSampleMode } from "@/components/providers/SampleModeProvider";
import { SAMPLE_DASHBOARD_DATA } from "@/lib/sample-data/mock-sample-data";
import { SampleModeBanner } from "@/components/dashboard/SampleModeBanner";
import type { DashboardPageData } from "./dashboard-data.server";

export default function DashboardClient(data: DashboardPageData) {
    const { isSampleMode } = useSampleMode();
    const effectiveData: DashboardPageData = isSampleMode
        ? {
              ...SAMPLE_DASHBOARD_DATA,
              userName: data.userName || "Trader",
          }
        : data;

    const {
        userName = "Trader",
        hasGlobalTrades,
        recentTrades,
        currentAccountId,
        activationState,
        nextBestAction,
        coachPlan,
        learningRecommendations,
        firstSessionState,
        tradingGoal,
        weeklyReviewEligibility,
        suppress,
        initialDashboards,
    } = effectiveData;

    // Use canonical growthViewModel.nextAction as single source for coach action
    const actualNextBestAction =
        effectiveData.growthViewModel?.nextAction || nextBestAction;

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

    const handleTradeClick = (id: string) => {
        const trade = (recentTrades || []).find((t: any) => t.id === id);
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

    // Detect "brand new user" — no trades at all globally in database (unless in sample mode)
    const hasNoData = isSampleMode ? false : !hasGlobalTrades;


    const shouldHideActivationChecklistForPrimaryReview =
        weeklyReviewEligibility?.ready &&
        activationState.nextStep?.id === "GENERATE_WEEKLY_REVIEW" &&
        !reportNudgeDismissed &&
        !suppress?.reportNudge;

    const showFirstSessionLauncher = Boolean(
        firstSessionState && !firstSessionState.isCompleted
    );

    const showActivationChecklist =
        !hasNoData &&
        activationState.completedCount < activationState.totalCount &&
        !suppress?.activationChecklist &&
        !shouldHideActivationChecklistForPrimaryReview;

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

            {/* DATA_BUILDING milestone celebrations (5/10/15 trades) */}
            {effectiveData.growthViewModel?.maturity && (
                <MilestoneToaster
                    tradeCount={
                        effectiveData.growthViewModel.maturity
                            .usableClosedTradeCount
                    }
                    maturityStage={
                        effectiveData.growthViewModel.maturity.stage
                    }
                />
            )}

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
                {/* Sample Mode Active Banner */}
                <SampleModeBanner />

                {/* Active Experiment Banner */}
                {effectiveData.growthViewModel?.activeExperiment && (
                    <div className="mb-4">
                        <ExperimentProgress
                            experiment={
                                effectiveData.growthViewModel.activeExperiment
                            }
                        />
                    </div>
                )}

                {/* Completed Experiment Result Card */}
                {!effectiveData.growthViewModel?.activeExperiment &&
                    effectiveData.growthViewModel?.completedExperiment && (
                        <div className="mb-4">
                            <ExperimentResult
                                experiment={
                                    effectiveData.growthViewModel
                                        .completedExperiment
                                }
                            />
                        </div>
                    )}

                {/* Mobile Pro Status Banner — suppress the Free-Plan nudge when onboarding
                    or activation banners are already visible so mobile users don't get stacked CTAs.
                    Real Pro statuses (ACTIVE/GRACE/REVOKED/EXPIRED) still render. */}
                <MobileProStatusBanner
                    hideFreeNudge={
                        hasNoData ||
                        showFirstSessionLauncher ||
                        showActivationChecklist
                    }
                />

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
                {showFirstSessionLauncher && firstSessionState && (
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
                        {showActivationChecklist && (
                            <div data-tour="dashboard-action-center">
                                <ActivationChecklist state={activationState} />
                            </div>
                        )}

                        <DashboardManager
                            initialDashboards={initialDashboards}
                            data={effectiveData}
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
