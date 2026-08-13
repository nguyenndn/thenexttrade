/**
 * Email notification preferences, stored in User.settings.emailPreferences.
 *
 * Every product / marketing email path must check these before sending
 * (see docs/EMAIL.md — "Product/marketing emails must respect user preferences").
 * Security / auth emails are out of scope of these toggles.
 */
export interface EmailPreferences {
    /** Weekly/monthly trading report emails + no-trades nudges */
    reports: boolean;
    /** Onboarding activation reminders (NO_ACCOUNT_24H, NO_FIRST_DATA_24H, ...) */
    activation: boolean;
    /** Product updates / feature announcements */
    marketing: boolean;
    /** Welcome sequence (D0 welcome email) */
    welcome: boolean;
    /** Master kill switch — suppresses every category above */
    unsubscribedAll: boolean;
}

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
    reports: true,
    activation: true,
    marketing: true,
    welcome: true,
    unsubscribedAll: false,
};

const PREFERENCE_KEYS = [
    "reports",
    "activation",
    "marketing",
    "welcome",
    "unsubscribedAll",
] as const;

/**
 * Read + validate email preferences from a raw User.settings value.
 * Unknown / malformed entries fall back to defaults so a corrupt settings blob
 * can never silently flip every email off (or back on) for a user.
 */
export function getEmailPreferences(settings: unknown): EmailPreferences {
    const raw =
        settings && typeof settings === "object"
            ? (settings as Record<string, unknown>).emailPreferences
            : undefined;
    if (!raw || typeof raw !== "object") {
        return { ...DEFAULT_EMAIL_PREFERENCES };
    }

    const prefs = raw as Record<string, unknown>;
    const result: EmailPreferences = { ...DEFAULT_EMAIL_PREFERENCES };
    for (const key of PREFERENCE_KEYS) {
        if (typeof prefs[key] === "boolean") {
            result[key] = prefs[key];
        }
    }
    return result;
}

export type EmailPreferenceCategory = keyof EmailPreferences;

/** Whether a given product/marketing email category is currently enabled. */
export function canSendEmailCategory(
    settings: unknown,
    category: EmailPreferenceCategory
): boolean {
    const prefs = getEmailPreferences(settings);
    if (prefs.unsubscribedAll) return false;
    return prefs[category];
}
