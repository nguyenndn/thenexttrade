import { prisma } from "@/lib/prisma";

/**
 * Onboarding state stored in User.settings.onboarding
 */
export interface OnboardingState {
 /** Which step the user has reached (1-4) */
 lastCompletedStep?: number;
 /** Trading goal chosen in step 2 */
 tradingGoal?: string;
 /** Preferred sync method chosen in step 3 */
 preferredSyncMethod?: "TNT_CONNECT" | "EA_SYNC" | "MANUAL";
 /** When onboarding was completed */
 completedAt?: string;
 /** When onboarding was skipped */
 skippedAt?: string;
}

/**
 * Read onboarding state from User.settings.onboarding
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });
 
 const settings = (user?.settings as Record<string, unknown>) || {};
 return (settings.onboarding as OnboardingState) || {};
}

/**
 * Merge a patch into User.settings.onboarding
 * Preserves all existing settings (e.g. adminNotes)
 */
export async function updateOnboardingSettings(
 userId: string,
 patch: Partial<OnboardingState>
): Promise<void> {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });

 const existingSettings = (user?.settings as Record<string, unknown>) || {};
 const existingOnboarding = (existingSettings.onboarding as OnboardingState) || {};

 await prisma.user.update({
 where: { id: userId },
 data: {
 settings: {
 ...existingSettings,
 onboarding: {
 ...existingOnboarding,
 ...patch,
 },
 },
 },
 });
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(userId: string): Promise<void> {
 await updateOnboardingSettings(userId, {
 completedAt: new Date().toISOString(),
 lastCompletedStep: 4,
 });

 // Create welcome notification so the bell is never empty for new users
 await prisma.notification.create({
 data: {
 userId,
 type: "FEATURE_UPDATE",
 title: "Welcome to TheNextTrade! 🎉",
 message: "Your trading command center is ready. Connect your MT5 account to start syncing trades automatically, or explore Academy to sharpen your edge.",
 link: "/dashboard/accounts",
 icon: "Rocket",
 priority: "NORMAL",
 },
 });
}

/**
 * Mark onboarding as skipped
 */
export async function skipOnboarding(userId: string): Promise<void> {
 await updateOnboardingSettings(userId, {
 skippedAt: new Date().toISOString(),
 });
}

/**
 * Check if onboarding is completed or skipped
 */
export async function isOnboardingDone(userId: string): Promise<boolean> {
 const state = await getOnboardingState(userId);
 return !!(state.completedAt || state.skippedAt);
}
