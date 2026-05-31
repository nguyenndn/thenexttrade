import "server-only";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FirstSessionStep =
  | "CONNECT_ACCOUNT"
  | "CHOOSE_SYNC_METHOD"
  | "BRING_FIRST_DATA"
  | "REVIEW_DASHBOARD";

export type SyncMethod = "TNT_CONNECT" | "EA_SYNC" | "MANUAL";

export type FirstSessionWizardState = {
  currentStep?: FirstSessionStep;
  selectedAccountId?: string;
  selectedSyncMethod?: SyncMethod;
  startedAt?: string;
  lastShownAt?: string;
  dismissedUntil?: string;
  completedAt?: string;
  firstSyncCelebratedAt?: string;
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
    select: { settings: true },
  });
  const settings = (user?.settings as UserSettings) || {};
  const onboarding = (settings.onboarding as OnboardingSettings) || {};
  return { settings, onboarding };
}

// ---------------------------------------------------------------------------
// getFirstSessionState
// ---------------------------------------------------------------------------

export async function getFirstSessionState(
  userId: string
): Promise<FirstSessionComputedState> {
  const { onboarding } = await readSettings(userId);
  const firstSession = onboarding.firstSession || {};

  // Parallel data queries
  const [accountCount, tradeCount, accounts, reportCount] = await Promise.all([
    prisma.tradingAccount.count({ where: { userId } }),
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
    "TNT_CONNECT";

  // Determine current step
  let currentStep: FirstSessionStep;
  if (accountCount === 0) {
    currentStep = "CONNECT_ACCOUNT";
  } else if (!firstSession.selectedSyncMethod && !onboarding.preferredSyncMethod) {
    currentStep = "CHOOSE_SYNC_METHOD";
  } else if (tradeCount === 0) {
    currentStep = "BRING_FIRST_DATA";
  } else {
    currentStep = "REVIEW_DASHBOARD";
  }

  // Determine completed
  const isCompleted = tradeCount > 0 || !!firstSession.completedAt;

  // First sync success moment — show once when user gets first trade data
  const showFirstSyncSuccess =
    tradeCount > 0 &&
    !firstSession.firstSyncCelebratedAt &&
    !firstSession.completedAt;

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
    ? new Date(oldestAccount.createdAt).getTime() <= Date.now() - 24 * 60 * 60 * 1000
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
      // Defaults to TNT, but the wizard will show all options
      return {
        nextHref: `/dashboard/accounts?setup=sync&method=tnt&source=first-session`,
        nextLabel: "Set up TNT Connect",
      };

    case "BRING_FIRST_DATA":
      switch (method) {
        case "EA_SYNC":
          return {
            nextHref: "/dashboard/accounts?setup=sync&method=ea&source=first-session",
            nextLabel: "Open EA Setup",
          };
        case "MANUAL":
          return {
            nextHref: "/dashboard/journal?action=log-trade&source=first-session",
            nextLabel: "Log First Trade",
          };
        default: // TNT_CONNECT
          return {
            nextHref: "/dashboard/accounts?setup=sync&method=tnt&source=first-session",
            nextLabel: "Open Sync Setup",
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

export async function dismissFirstSessionWizard(
  userId: string
): Promise<void> {
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
