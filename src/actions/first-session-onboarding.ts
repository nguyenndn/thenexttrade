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
