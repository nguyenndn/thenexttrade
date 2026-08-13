import "server-only";
import { prisma } from "@/lib/prisma";
import { getFirstInsightPayload } from "./first-insight.server";
import { FIRST_SESSION_ROLLOUT_AT } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FirstSessionStep =
    | "CONNECT_ACCOUNT"
    | "CHOOSE_SYNC_METHOD"
    | "BRING_FIRST_DATA"
    | "REVIEW_DASHBOARD";

export type SyncMethod = "EA_SYNC" | "MANUAL";

export type FirstSessionWizardState = {
    currentStep?: FirstSessionStep;
    selectedAccountId?: string;
    selectedSyncMethod?: SyncMethod;
    startedAt?: string;
    lastShownAt?: string;
    dismissedUntil?: string;
    completedAt?: string;
    firstSyncCelebratedAt?: string;
    firstInsightViewedAt?: string;
    helpViewedAt?: string;
    firstDataReminderDismissedUntil?: string;
};

export type FirstSessionComputedState = {
    shouldAutoOpen: boolean;
    isCompleted: boolean;
    currentStep: FirstSessionStep;
    preferredSyncMethod: SyncMethod;
    accountCount: number;
    tradeCount: number;
    hasSyncActivity: boolean;
    selectedAccountId?: string;
    nextHref: string;
    nextLabel: string;
    showFirstSyncSuccess: boolean;
    hasReports: boolean;
    showFirstDataReminder: boolean;
    firstAccountCreatedAt?: string;
    firstInsight?: {
        shouldShow: boolean;
        facts: string[];
        primaryCta: string;
        secondaryCta: string;
    };
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type UserSettings = Record<string, unknown>;
type OnboardingSettings = {
    preferredSyncMethod?: SyncMethod;
    firstSession?: FirstSessionWizardState;
    [key: string]: unknown;
};

async function readSettings(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true, createdAt: true },
    });
    const settings = (user?.settings as UserSettings) || {};
    const onboarding = (settings.onboarding as OnboardingSettings) || {};
    return { settings, onboarding, userCreatedAt: user?.createdAt };
}

// ---------------------------------------------------------------------------
// getFirstSessionState
// ---------------------------------------------------------------------------

export async function getFirstSessionState(
    userId: string
): Promise<FirstSessionComputedState> {
    const { onboarding, userCreatedAt } = await readSettings(userId);
    const firstSession = onboarding.firstSession || {};

    // Parallel data queries
    const [journalTradeCount, accounts, reportCount] = await Promise.all([
        prisma.journalEntry.count({ where: { userId } }),
        prisma.tradingAccount.findMany({
            where: { userId },
            select: {
                id: true,
                lastSync: true,
                lastHeartbeat: true,
                appLastHeartbeat: true,
                syncSource: true,
                totalTrades: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma.tradingReport.count({ where: { userId } }),
    ]);

    const accountCount = accounts.length;
    const accountTradeCount = accounts.reduce(
        (sum, account) => sum + Math.max(0, account.totalTrades || 0),
        0
    );
    const tradeCount = Math.max(journalTradeCount, accountTradeCount);

    // Determine sync activity
    const hasSyncActivity = accounts.some(
        (a) =>
            a.lastSync !== null ||
            a.lastHeartbeat !== null ||
            a.appLastHeartbeat !== null ||
            a.totalTrades > 0
    );

    // Resolve preferred sync method
    const preferredSyncMethod: SyncMethod =
        firstSession.selectedSyncMethod ||
        onboarding.preferredSyncMethod ||
        "EA_SYNC";

    // Determine current step
    let currentStep: FirstSessionStep;
    if (accountCount === 0) {
        currentStep = "CONNECT_ACCOUNT";
    } else if (
        !firstSession.selectedSyncMethod &&
        !onboarding.preferredSyncMethod
    ) {
        currentStep = "CHOOSE_SYNC_METHOD";
    } else if (tradeCount === 0) {
        currentStep = "BRING_FIRST_DATA";
    } else {
        currentStep = "REVIEW_DASHBOARD";
    }

    // Determine completed. A user who skipped onboarding explicitly opted out of
    // the guided wizard — treat that as completed so it does not auto-open again
    // right after the skip (skipOnboarding only writes skippedAt).
    const isCompleted =
        tradeCount > 0 || !!firstSession.completedAt || !!onboarding.skippedAt;
    const isLegacyUser = userCreatedAt
        ? userCreatedAt < FIRST_SESSION_ROLLOUT_AT
        : true;
    const hasFirstSessionIntent = Boolean(
        firstSession.startedAt ||
        firstSession.selectedAccountId ||
        firstSession.selectedSyncMethod ||
        firstSession.dismissedUntil ||
        firstSession.completedAt ||
        firstSession.firstSyncCelebratedAt ||
        firstSession.firstInsightViewedAt ||
        onboarding.preferredSyncMethod ||
        onboarding.tradingGoal ||
        onboarding.completedAt
    );
    const isLegacyActiveUser = isLegacyUser && tradeCount > 0;

    // First sync success moment — show once when user gets first trade data
    const showFirstSyncSuccess =
        tradeCount > 0 &&
        !isLegacyActiveUser &&
        (hasFirstSessionIntent || !isLegacyUser) &&
        !firstSession.firstInsightViewedAt &&
        !firstSession.firstSyncCelebratedAt &&
        !firstSession.completedAt;

    const firstInsight = showFirstSyncSuccess
        ? await getFirstInsightPayload(userId)
        : {
              shouldShow: false,
              facts: [],
              primaryCta: "/dashboard",
              secondaryCta: "/dashboard",
          };

    // Auto-open logic
    const isDismissed =
        firstSession.dismissedUntil &&
        new Date(firstSession.dismissedUntil) > new Date();

    const shouldAutoOpen = !isCompleted && !isDismissed;

    // Selected account — use main or first
    const selectedAccountId =
        firstSession.selectedAccountId || accounts[0]?.id || undefined;

    // CTA routing
    const { nextHref, nextLabel } = computeCtaForStep(
        currentStep,
        preferredSyncMethod
    );

    // 24h reminder: account exists > 24h, no trades, not completed, not dismissed
    const oldestAccount = accounts[0]; // ordered by createdAt asc
    const firstAccountCreatedAt = oldestAccount?.createdAt?.toISOString();
    const isReminderDismissed =
        firstSession.firstDataReminderDismissedUntil &&
        new Date(firstSession.firstDataReminderDismissedUntil) > new Date();
    const accountOlderThan24h = oldestAccount?.createdAt
        ? new Date(oldestAccount.createdAt).getTime() <=
          Date.now() - 24 * 60 * 60 * 1000
        : false;
    const showFirstDataReminder =
        accountCount > 0 &&
        tradeCount === 0 &&
        accountOlderThan24h &&
        !firstSession.completedAt &&
        !isReminderDismissed;

    return {
        shouldAutoOpen,
        isCompleted,
        currentStep,
        preferredSyncMethod,
        accountCount,
        tradeCount,
        hasSyncActivity,
        selectedAccountId,
        nextHref,
        nextLabel,
        showFirstSyncSuccess,
        hasReports: reportCount > 0,
        showFirstDataReminder,
        firstAccountCreatedAt,
        firstInsight,
    };
}

// ---------------------------------------------------------------------------
// CTA routing per step
// ---------------------------------------------------------------------------

function computeCtaForStep(
    step: FirstSessionStep,
    method: SyncMethod
): { nextHref: string; nextLabel: string } {
    switch (step) {
        case "CONNECT_ACCOUNT":
            return {
                nextHref: "/dashboard/accounts?action=add&source=first-session",
                nextLabel: "Add Account",
            };

        case "CHOOSE_SYNC_METHOD":
            // Defaults to Trade Manager
            return {
                nextHref: `/dashboard/accounts?setup=sync&method=ea&source=first-session`,
                nextLabel: "Set up Trade Manager",
            };

        case "BRING_FIRST_DATA":
            switch (method) {
                case "EA_SYNC":
                    return {
                        nextHref:
                            "/dashboard/accounts?setup=sync&method=ea&source=first-session",
                        nextLabel: "Open EA Setup",
                    };
                case "MANUAL":
                    return {
                        nextHref:
                            "/dashboard/journal?action=log-trade&source=first-session",
                        nextLabel: "Log First Trade",
                    };
            }

        case "REVIEW_DASHBOARD":
            return {
                nextHref: "/dashboard",
                nextLabel: "Open Dashboard",
            };
    }
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

export async function updateFirstSessionSettings(
    userId: string,
    patch: Partial<FirstSessionWizardState>
): Promise<void> {
    const { settings, onboarding } = await readSettings(userId);
    const existing = onboarding.firstSession || {};

    await prisma.user.update({
        where: { id: userId },
        data: {
            settings: {
                ...settings,
                onboarding: {
                    ...onboarding,
                    firstSession: {
                        ...existing,
                        ...patch,
                    },
                },
            },
        },
    });
}

export async function dismissFirstSessionWizard(userId: string): Promise<void> {
    const dismissedUntil = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();
    await updateFirstSessionSettings(userId, { dismissedUntil });
}

export async function completeFirstSessionWizard(
    userId: string
): Promise<void> {
    await updateFirstSessionSettings(userId, {
        completedAt: new Date().toISOString(),
    });
}
