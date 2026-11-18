import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getEmailPreferences } from "./preferences";

export const MARKETING_SUPPRESSION_SETTING_KEY =
    "marketing_email_suppression_list";

function getUnsubscribeSigningKey(): Buffer {
    const rawSecret =
        process.env.ENCRYPTION_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.CRON_SECRET ||
        "thenexttrade-marketing-unsubscribe-hmac-v1";

    return crypto
        .createHash("sha256")
        .update(`email-marketing-unsubscribe:v1:${rawSecret}`)
        .digest();
}

export function normalizeEmailAddress(rawEmail: string): string {
    return rawEmail.trim().toLowerCase();
}

/**
 * Generates an HMAC-SHA256 signed token scoped strictly to `marketing` opt-out
 * for a single recipient email address.
 */
export function createMarketingUnsubscribeToken(rawEmail: string): string {
    const email = normalizeEmailAddress(rawEmail);
    const payload = Buffer.from(
        JSON.stringify({ e: email, c: "marketing" }),
        "utf8"
    ).toString("base64url");

    const sig = crypto
        .createHmac("sha256", getUnsubscribeSigningKey())
        .update(payload)
        .digest("base64url");

    return `${payload}.${sig}`;
}

/**
 * Verifies an HMAC-signed marketing unsubscribe token using constant-time comparison.
 * Returns the normalized email address when valid, or `null` if tampered/malformed.
 */
export function verifyMarketingUnsubscribeToken(
    token: string | null | undefined
): string | null {
    if (!token || typeof token !== "string") return null;

    const dotIdx = token.indexOf(".");
    if (dotIdx <= 0 || dotIdx === token.length - 1) return null;

    const payload = token.slice(0, dotIdx);
    const providedSig = token.slice(dotIdx + 1);

    const expectedSig = crypto
        .createHmac("sha256", getUnsubscribeSigningKey())
        .update(payload)
        .digest("base64url");

    const providedBuf = Buffer.from(providedSig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");

    if (
        providedBuf.length !== expectedBuf.length ||
        !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
        return null;
    }

    try {
        const decoded = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8")
        ) as { e?: unknown; c?: unknown };

        if (
            typeof decoded.e !== "string" ||
            !decoded.e.includes("@") ||
            decoded.c !== "marketing"
        ) {
            return null;
        }

        return normalizeEmailAddress(decoded.e);
    } catch {
        return null;
    }
}

export function buildMarketingUnsubscribeUrls(
    rawEmail: string,
    rawAppUrl?: string
): {
    pageUrl: string;
    oneClickApiUrl: string;
} {
    const baseUrl = (
        rawAppUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.app"
    ).replace(/\/+$/, "");

    const token = encodeURIComponent(createMarketingUnsubscribeToken(rawEmail));

    return {
        pageUrl: `${baseUrl}/unsubscribe?token=${token}`,
        oneClickApiUrl: `${baseUrl}/api/email/unsubscribe?token=${token}`,
    };
}

function extractSuppressionEmails(value: unknown): string[] {
    if (!value || typeof value !== "object") return [];
    const rawList = (value as { emails?: unknown }).emails;
    if (!Array.isArray(rawList)) return [];
    return rawList
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => normalizeEmailAddress(entry))
        .filter((entry) => entry.includes("@"));
}

/**
 * Returns the normalized Set of email addresses that opted out of marketing
 * (covers both registered users and external Custom List leads).
 */
export async function getSuppressedMarketingEmails(): Promise<Set<string>> {
    try {
        const row = await prisma.systemSetting.findUnique({
            where: { key: MARKETING_SUPPRESSION_SETTING_KEY },
            select: { value: true },
        });
        return new Set(extractSuppressionEmails(row?.value));
    } catch {
        return new Set();
    }
}

async function persistSuppressedMarketingEmails(
    emails: Iterable<string>
): Promise<void> {
    const uniqueSorted = Array.from(
        new Set(
            Array.from(emails)
                .map((e) => normalizeEmailAddress(e))
                .filter((e) => e.includes("@"))
        )
    ).sort();

    await prisma.systemSetting.upsert({
        where: { key: MARKETING_SUPPRESSION_SETTING_KEY },
        create: {
            key: MARKETING_SUPPRESSION_SETTING_KEY,
            value: { emails: uniqueSorted },
        },
        update: {
            value: { emails: uniqueSorted },
        },
    });
}

/**
 * Opts an email address out of MARKETING emails ONLY.
 * - Registered users: sets `emailPreferences.marketing = false` while preserving
 *   system/transactional emails, security alerts, trading reports, and activation reminders.
 * - External Custom List leads: adds email to `marketing_email_suppression_list`.
 */
export async function unsubscribeEmailFromMarketing(
    rawEmail: string
): Promise<{ email: string; updatedUser: boolean }> {
    const email = normalizeEmailAddress(rawEmail);

    const suppressed = await getSuppressedMarketingEmails();
    suppressed.add(email);
    await persistSuppressedMarketingEmails(suppressed);

    const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, settings: true },
    });

    if (existingUser) {
        const currentSettings =
            existingUser.settings && typeof existingUser.settings === "object"
                ? (existingUser.settings as Record<string, unknown>)
                : {};
        const currentPrefs = getEmailPreferences(existingUser.settings);

        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                settings: {
                    ...currentSettings,
                    emailPreferences: {
                        ...currentPrefs,
                        marketing: false,
                    },
                },
            },
        });
    }

    return {
        email,
        updatedUser: Boolean(existingUser),
    };
}

/**
 * Re-enables marketing emails for a recipient who previously clicked Unsubscribe.
 */
export async function resubscribeEmailToMarketing(
    rawEmail: string
): Promise<{ email: string; updatedUser: boolean }> {
    const email = normalizeEmailAddress(rawEmail);

    const suppressed = await getSuppressedMarketingEmails();
    if (suppressed.delete(email)) {
        await persistSuppressedMarketingEmails(suppressed);
    }

    const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, settings: true },
    });

    if (existingUser) {
        const currentSettings =
            existingUser.settings && typeof existingUser.settings === "object"
                ? (existingUser.settings as Record<string, unknown>)
                : {};
        const currentPrefs = getEmailPreferences(existingUser.settings);

        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                settings: {
                    ...currentSettings,
                    emailPreferences: {
                        ...currentPrefs,
                        marketing: true,
                        unsubscribedAll: false,
                    },
                },
            },
        });
    }

    return {
        email,
        updatedUser: Boolean(existingUser),
    };
}

/**
 * Keeps `marketing_email_suppression_list` synchronized when a logged-in user
 * toggles their Marketing preference inside `/dashboard/settings`.
 */
export async function syncMarketingSuppressionForUserEmail(
    rawEmail: string | null | undefined,
    marketingAllowed: boolean
): Promise<void> {
    if (!rawEmail || !rawEmail.includes("@")) return;
    const email = normalizeEmailAddress(rawEmail);
    const suppressed = await getSuppressedMarketingEmails();

    if (marketingAllowed) {
        if (suppressed.delete(email)) {
            await persistSuppressedMarketingEmails(suppressed);
        }
    } else if (!suppressed.has(email)) {
        suppressed.add(email);
        await persistSuppressedMarketingEmails(suppressed);
    }
}
