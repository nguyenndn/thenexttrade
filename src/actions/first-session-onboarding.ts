"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  updateFirstSessionSettings,
  dismissFirstSessionWizard,
  completeFirstSessionWizard,
} from "@/lib/onboarding/first-session.server";
import type { SyncMethod } from "@/lib/onboarding/first-session.server";
import { sendEmail } from "@/lib/services/email.service";
import {
  buildActivationEmailSubject,
  buildActivationEmailHtml,
} from "@/lib/emails/activation-reminders";

export interface MobileSyncFallbackState {
  method: "TNT_CONNECT" | "EA_SYNC";
  firstSeenAt: string;
  lastSeenAt: string;
  desktopLinkSentAt?: string;
  manualFallbackClickedAt?: string;
  continuedAnywayAt?: string;
}

/**
 * Helper to update mobile sync fallback settings.
 */
async function updateMobileSyncFallback(
  userId: string,
  method: "TNT_CONNECT" | "EA_SYNC",
  patch: Partial<MobileSyncFallbackState>
): Promise<void> {
  const freshUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });
  const settings = (freshUser?.settings as Record<string, any>) || {};
  const onboarding = (settings.onboarding || {}) as Record<string, any>;
  const existing = (onboarding.mobileSyncFallback || {}) as Record<string, any>;

  const now = new Date().toISOString();
  await prisma.user.update({
    where: { id: userId },
    data: {
      settings: {
        ...settings,
        onboarding: {
          ...onboarding,
          mobileSyncFallback: {
            method,
            firstSeenAt: existing.firstSeenAt || now,
            lastSeenAt: now,
            ...existing,
            ...patch,
          },
        },
      },
    },
  });
}

/**
 * Save the user's chosen sync method for the first-session wizard.
 * Persists both `firstSession.selectedSyncMethod` AND top-level
 * `onboarding.preferredSyncMethod` so activation checklist stays in sync.
 */
export async function saveFirstSessionSyncMethodAction(method: SyncMethod) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Save inside firstSession
  await updateFirstSessionSettings(user.id, {
    selectedSyncMethod: method,
  });

  // 2. Also persist at top-level onboarding.preferredSyncMethod
  //    (getActivationState reads this field, not firstSession.selectedSyncMethod)
  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { settings: true },
  });
  const settings = (freshUser?.settings as Record<string, unknown>) || {};
  const onboarding = (settings.onboarding as Record<string, unknown>) || {};

  await prisma.user.update({
    where: { id: user.id },
    data: {
      settings: {
        ...settings,
        onboarding: {
          ...onboarding,
          preferredSyncMethod: method,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/journal");
  return { success: true };
}

/**
 * Dismiss the first-session wizard for 24 hours.
 */
export async function dismissFirstSessionWizardAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  await dismissFirstSessionWizard(user.id);

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Mark the first-session wizard as permanently completed.
 */
export async function completeFirstSessionWizardAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  await completeFirstSessionWizard(user.id);

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Celebrate the first sync — marks firstSyncCelebratedAt and completedAt.
 * Called when user dismisses the FirstSyncSuccessModal.
 */
export async function celebrateFirstSyncAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  await updateFirstSessionSettings(user.id, {
    firstSyncCelebratedAt: now,
    completedAt: now,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Dismiss the 24h first-data reminder for another 24 hours.
 */
export async function dismissFirstDataReminderAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const dismissedUntil = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();
  await updateFirstSessionSettings(user.id, {
    firstDataReminderDismissedUntil: dismissedUntil,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Mark the first insight as permanently viewed.
 * Persists both firstInsightViewedAt AND completedAt.
 */
export async function markFirstInsightViewedAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  await updateFirstSessionSettings(user.id, {
    firstInsightViewedAt: now,
    completedAt: now,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Record that a mobile fallback warning has been viewed.
 */
export async function recordMobileSyncFallbackViewedAction(method: "TNT_CONNECT" | "EA_SYNC") {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  await updateMobileSyncFallback(user.id, method, {});

  await prisma.analyticsEvent.create({
    data: {
      name: "mobile_sync_fallback_viewed",
      userId: user.id,
      sessionId: "",
      data: { method },
    },
  });

  return { success: true };
}

/**
 * Send the desktop setup link to the user's email and track action.
 */
export async function sendDesktopSetupLinkAction(method: "TNT_CONNECT" | "EA_SYNC") {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true },
  });
  if (!freshUser || !freshUser.email) return { error: "User email not found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";
  const pathMethod = method === "EA_SYNC" ? "ea" : "tnt";
  const link = `${baseUrl}/dashboard/accounts?setup=sync&method=${pathMethod}&source=desktop-link`;

  const subject = buildActivationEmailSubject("MOBILE_SYNC_FALLBACK");
  const html = buildActivationEmailHtml("MOBILE_SYNC_FALLBACK", freshUser.name, method === "EA_SYNC" ? "EA_SYNC" : "TNT_CONNECT", link);

  const emailSent = await sendEmail({
    to: freshUser.email,
    subject,
    html,
  });

  if (!emailSent) {
    return { error: "Failed to send email" };
  }

  const now = new Date().toISOString();
  await updateMobileSyncFallback(user.id, method, {
    desktopLinkSentAt: now,
  });

  await prisma.analyticsEvent.create({
    data: {
      name: "mobile_sync_desktop_link_sent",
      userId: user.id,
      sessionId: "",
      data: { method },
    },
  });

  return { success: true };
}

/**
 * Record that a mobile user chose the manual fallback flow.
 */
export async function recordMobileSyncManualFallbackAction(method: "TNT_CONNECT" | "EA_SYNC") {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  await updateMobileSyncFallback(user.id, method, {
    manualFallbackClickedAt: now,
  });

  await prisma.analyticsEvent.create({
    data: {
      name: "mobile_sync_manual_fallback_clicked",
      userId: user.id,
      sessionId: "",
      data: { method },
    },
  });

  return { success: true };
}

/**
 * Record that a mobile user clicked "Continue Anyway".
 */
export async function recordMobileSyncContinueAnywayAction(method: "TNT_CONNECT" | "EA_SYNC") {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  await updateMobileSyncFallback(user.id, method, {
    continuedAnywayAt: now,
  });

  await prisma.analyticsEvent.create({
    data: {
      name: "mobile_sync_continue_anyway_clicked",
      userId: user.id,
      sessionId: "",
      data: { method },
    },
  });

  return { success: true };
}

