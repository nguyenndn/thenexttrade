import { prisma } from "@/lib/prisma";

export interface ActivationReminderSend {
 type: "NO_ACCOUNT_24H" | "NO_FIRST_DATA_24H" | "STILL_NO_FIRST_VALUE_72H" | "MOBILE_SYNC_FALLBACK";
 sentAt: string;
 channel: "in_app" | "email";
 idempotencyKey: string;
}

export interface ActivationReminderState {
 sent?: ActivationReminderSend[];
 dismissedUntil?: string;
 lastEmailSentAt?: string;
}

/**
 * Read activation reminders state from User.settings.onboarding.activationReminders
 */
export async function getActivationReminderState(userId: string): Promise<ActivationReminderState> {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });

 const settings = (user?.settings as Record<string, any>) || {};
 const onboarding = (settings.onboarding as Record<string, any>) || {};
 return (onboarding.activationReminders as ActivationReminderState) || {};
}

/**
 * Append a reminder send log into User.settings.onboarding.activationReminders
 * Preserves all other user settings.
 */
export async function appendActivationReminderSend(
 userId: string,
 send: ActivationReminderSend
): Promise<void> {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });

 const existingSettings = (user?.settings as Record<string, any>) || {};
 const existingOnboarding = (existingSettings.onboarding as Record<string, any>) || {};
 const existingReminders = (existingOnboarding.activationReminders as ActivationReminderState) || {};
 
 const sentList = existingReminders.sent || [];
 const updatedSent = [...sentList, send];

 const patch: ActivationReminderState = {
 ...existingReminders,
 sent: updatedSent,
 };

 if (send.channel === "email") {
 patch.lastEmailSentAt = send.sentAt;
 }

 await prisma.user.update({
 where: { id: userId },
 data: {
 settings: {
 ...existingSettings,
 onboarding: {
 ...existingOnboarding,
 activationReminders: patch,
 },
 } as any,
 },
 });
}

/**
 * Set a snooze/dismissedUntil date for reminders
 */
export async function dismissActivationReminder(userId: string, until: string): Promise<void> {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });

 const existingSettings = (user?.settings as Record<string, any>) || {};
 const existingOnboarding = (existingSettings.onboarding as Record<string, any>) || {};
 const existingReminders = (existingOnboarding.activationReminders as ActivationReminderState) || {};

 const patch: ActivationReminderState = {
 ...existingReminders,
 dismissedUntil: until,
 };

 await prisma.user.update({
 where: { id: userId },
 data: {
 settings: {
 ...existingSettings,
 onboarding: {
 ...existingOnboarding,
 activationReminders: patch,
 },
 } as any,
 },
 });
}
