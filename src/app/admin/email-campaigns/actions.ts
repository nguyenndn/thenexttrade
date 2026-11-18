"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { canSendEmailCategory } from "@/lib/email/preferences";
import {
    buildMarketingUnsubscribeUrls,
    getSuppressedMarketingEmails,
} from "@/lib/email/unsubscribe";
import { sendEmailWithDetails } from "@/lib/services/email.service";
import {
    type AudienceCountsMap,
    buildMarketingCampaignEmail,
    campaignComposeSchema,
    type CampaignComposeInput,
    type CampaignSegmentId,
    parseCustomRecipientList,
    parseHighlightItems,
} from "@/lib/emails/marketing-campaign";

export interface CampaignHistoryEntry {
    id: string;
    campaignTitle: string;
    subject: string;
    preheader: string;
    badgeText: string;
    heading: string;
    bodyContent: string;
    highlightTitle: string;
    highlightItemsRaw: string;
    ctaLabel: string;
    ctaUrl: string;
    secondaryCtaLabel: string;
    secondaryCtaUrl: string;
    footerNote: string;
    segment: CampaignSegmentId;
    totalMatched: number;
    sentCount: number;
    failedCount: number;
    skippedOptOutCount: number;
    sentBy: string;
    createdAtIso: string;
}

interface AuthorizedAdmin {
    id: string;
    email: string;
}

async function requireStrictAdmin(): Promise<AuthorizedAdmin | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") return null;

    return {
        id: user.id,
        email: user.email || "",
    };
}

interface RawSegmentUser {
    id: string;
    name: string | null;
    email: string | null;
    settings: unknown;
    hasActivePro: boolean;
    hasMt5Account: boolean;
}

async function loadAllEmailUsers(): Promise<RawSegmentUser[]> {
    const rows = await prisma.user.findMany({
        where: {
            email: { not: null },
        },
        select: {
            id: true,
            name: true,
            email: true,
            settings: true,
            proEntitlements: {
                where: { status: "ACTIVE" },
                select: { id: true },
                take: 1,
            },
            _count: {
                select: { tradingAccounts: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return rows
        .filter((r) => Boolean(r.email && r.email.trim().includes("@")))
        .map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email ? r.email.trim().toLowerCase() : null,
            settings: r.settings,
            hasActivePro: r.proEntitlements.length > 0,
            hasMt5Account: r._count.tradingAccounts > 0,
        }));
}

function matchesDbSegment(
    user: RawSegmentUser,
    segment: Exclude<CampaignSegmentId, "CUSTOM_LIST">
): boolean {
    switch (segment) {
        case "ALL_USERS":
            return true;
        case "FREE_TRIAL":
            return !user.hasActivePro;
        case "VIP_PRO":
            return user.hasActivePro;
        case "HAS_MT5":
            return user.hasMt5Account;
        case "NO_MT5":
            return !user.hasMt5Account;
    }
}

function isEligibleForMarketing(
    user: RawSegmentUser,
    suppressedEmails: Set<string>
): boolean {
    if (!user.email) return false;
    if (suppressedEmails.has(user.email)) return false;
    return canSendEmailCategory(user.settings, "marketing");
}

export async function getCampaignAudienceCounts(): Promise<{
    success: boolean;
    counts?: AudienceCountsMap;
    error?: string;
}> {
    const admin = await requireStrictAdmin();
    if (!admin) {
        return { success: false, error: "Unauthorized" };
    }

    const [users, suppressedEmails] = await Promise.all([
        loadAllEmailUsers(),
        getSuppressedMarketingEmails(),
    ]);
    const dbSegments: Exclude<CampaignSegmentId, "CUSTOM_LIST">[] = [
        "ALL_USERS",
        "FREE_TRIAL",
        "VIP_PRO",
        "HAS_MT5",
        "NO_MT5",
    ];

    const counts = {} as AudienceCountsMap;
    for (const seg of dbSegments) {
        const matched = users.filter((u) => matchesDbSegment(u, seg));
        const optedIn = matched.filter((u) =>
            isEligibleForMarketing(u, suppressedEmails)
        ).length;
        counts[seg] = {
            total: matched.length,
            optedIn,
            skipped: matched.length - optedIn,
        };
    }

    return { success: true, counts };
}

export async function renderCampaignPreviewAction(
    input: Partial<CampaignComposeInput>
): Promise<{
    success: boolean;
    subject?: string;
    html?: string;
    error?: string;
}> {
    const admin = await requireStrictAdmin();
    if (!admin) {
        return { success: false, error: "Unauthorized" };
    }

    const built = buildMarketingCampaignEmail({
        subject: input.subject || "Campaign Subject Preview",
        preheader: input.preheader,
        badgeText: input.badgeText,
        heading: input.heading || "Campaign Headline",
        bodyContent:
            input.bodyContent ||
            "Hi {{name}},\n\nWrite your campaign message on the left to preview how traders will see it.",
        highlightTitle: input.highlightTitle,
        highlightItems: parseHighlightItems(input.highlightItemsRaw),
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
        secondaryCtaLabel: input.secondaryCtaLabel,
        secondaryCtaUrl: input.secondaryCtaUrl,
        footerNote: input.footerNote,
        recipientName: "Alex Mercer",
    });

    return {
        success: true,
        subject: built.subject,
        html: built.html,
    };
}

const sendTestSchema = campaignComposeSchema.extend({
    testRecipient: z.string().trim().email("Invalid test recipient email"),
});

export async function sendCampaignTestEmailAction(
    input: CampaignComposeInput & { testRecipient: string }
): Promise<{
    success: boolean;
    message: string;
}> {
    const admin = await requireStrictAdmin();
    if (!admin) {
        return { success: false, message: "Unauthorized" };
    }

    const parsed = sendTestSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: parsed.error.issues[0]?.message || "Invalid campaign fields",
        };
    }

    const data = parsed.data;
    const testUnsub = buildMarketingUnsubscribeUrls(data.testRecipient);
    const built = buildMarketingCampaignEmail({
        subject: `[TEST] ${data.subject}`,
        preheader: data.preheader,
        badgeText: data.badgeText,
        heading: data.heading,
        bodyContent: data.bodyContent,
        highlightTitle: data.highlightTitle,
        highlightItems: parseHighlightItems(data.highlightItemsRaw),
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        secondaryCtaLabel: data.secondaryCtaLabel,
        secondaryCtaUrl: data.secondaryCtaUrl,
        footerNote: data.footerNote,
        recipientName: "Test Trader",
        unsubscribeUrl: testUnsub.pageUrl,
    });

    const result = await sendEmailWithDetails({
        to: data.testRecipient,
        subject: built.subject,
        html: built.html,
        text: built.text,
        headers: {
            "List-Unsubscribe": `<${testUnsub.oneClickApiUrl}>, <${testUnsub.pageUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    });

    if (!result.success) {
        return {
            success: false,
            message: result.error || "Failed to send test email via SMTP",
        };
    }

    return {
        success: true,
        message: `Test email sent to ${data.testRecipient}.`,
    };
}

const MAX_RECIPIENTS_PER_DISPATCH = 1000;
const BATCH_CONCURRENCY = 8;
const BATCH_DELAY_MS = 150;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function dispatchEmailCampaignAction(
    rawInput: CampaignComposeInput
): Promise<{
    success: boolean;
    sentCount?: number;
    failedCount?: number;
    skippedOptOutCount?: number;
    message: string;
}> {
    const admin = await requireStrictAdmin();
    if (!admin) {
        return { success: false, message: "Unauthorized" };
    }

    const parsed = campaignComposeSchema.safeParse(rawInput);
    if (!parsed.success) {
        return {
            success: false,
            message: parsed.error.issues[0]?.message || "Invalid campaign input",
        };
    }

    const data = parsed.data;
    const [allUsers, suppressedEmails] = await Promise.all([
        loadAllEmailUsers(),
        getSuppressedMarketingEmails(),
    ]);

    interface TargetRecipient {
        email: string;
        name: string | null;
    }

    let totalMatched = 0;
    let skippedOptOutCount = 0;
    let recipients: TargetRecipient[] = [];

    if (data.segment === "CUSTOM_LIST") {
        const customParsed = parseCustomRecipientList(data.customEmailsRaw);
        if (customParsed.validEmails.length === 0) {
            return {
                success: false,
                message: "Please provide at least one valid email address in Custom List.",
            };
        }

        const userByEmail = new Map<string, RawSegmentUser>();
        for (const u of allUsers) {
            if (u.email) userByEmail.set(u.email, u);
        }

        totalMatched = customParsed.validEmails.length;
        for (const email of customParsed.validEmails) {
            const existing = userByEmail.get(email);
            const optedOutInSystem = existing
                ? !canSendEmailCategory(existing.settings, "marketing")
                : false;

            if (suppressedEmails.has(email) || optedOutInSystem) {
                skippedOptOutCount++;
                continue;
            }
            recipients.push({
                email,
                name: existing?.name || null,
            });
        }
    } else {
        const segmentId = data.segment;
        const matched = allUsers.filter((u) => matchesDbSegment(u, segmentId));
        totalMatched = matched.length;
        const eligible = matched.filter((u) =>
            isEligibleForMarketing(u, suppressedEmails)
        );
        skippedOptOutCount = totalMatched - eligible.length;
        recipients = eligible
            .filter((u): u is RawSegmentUser & { email: string } => Boolean(u.email))
            .map((u) => ({
                email: u.email,
                name: u.name,
            }));
    }

    if (recipients.length === 0) {
        return {
            success: false,
            message:
                "No opted-in recipients available for the selected audience segment.",
        };
    }

    const cappedRecipients = recipients.slice(0, MAX_RECIPIENTS_PER_DISPATCH);
    const highlightItems = parseHighlightItems(data.highlightItemsRaw);

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < cappedRecipients.length; i += BATCH_CONCURRENCY) {
        const chunk = cappedRecipients.slice(i, i + BATCH_CONCURRENCY);
        const settled = await Promise.allSettled(
            chunk.map(async (recipient) => {
                const unsubUrls = buildMarketingUnsubscribeUrls(
                    recipient.email
                );
                const built = buildMarketingCampaignEmail({
                    subject: data.subject,
                    preheader: data.preheader,
                    badgeText: data.badgeText,
                    heading: data.heading,
                    bodyContent: data.bodyContent,
                    highlightTitle: data.highlightTitle,
                    highlightItems,
                    ctaLabel: data.ctaLabel,
                    ctaUrl: data.ctaUrl,
                    secondaryCtaLabel: data.secondaryCtaLabel,
                    secondaryCtaUrl: data.secondaryCtaUrl,
                    footerNote: data.footerNote,
                    recipientName: recipient.name,
                    unsubscribeUrl: unsubUrls.pageUrl,
                });

                return sendEmailWithDetails({
                    to: recipient.email,
                    subject: built.subject,
                    html: built.html,
                    text: built.text,
                    headers: {
                        "List-Unsubscribe": `<${unsubUrls.oneClickApiUrl}>, <${unsubUrls.pageUrl}>`,
                        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                });
            })
        );

        for (const res of settled) {
            if (res.status === "fulfilled" && res.value.success) {
                sentCount++;
            } else {
                failedCount++;
            }
        }

        if (i + BATCH_CONCURRENCY < cappedRecipients.length) {
            await sleep(BATCH_DELAY_MS);
        }
    }

    const campaignId = randomUUID();
    await prisma.auditLog.create({
        data: {
            adminId: admin.id,
            action: "EMAIL_CAMPAIGN_SENT",
            targetType: "EmailCampaign",
            targetId: campaignId,
            details: {
                campaignTitle: data.campaignTitle?.trim() || data.subject,
                subject: data.subject,
                preheader: data.preheader || "",
                badgeText: data.badgeText || "",
                heading: data.heading,
                bodyContent: data.bodyContent,
                highlightTitle: data.highlightTitle || "",
                highlightItemsRaw: data.highlightItemsRaw || "",
                ctaLabel: data.ctaLabel || "",
                ctaUrl: data.ctaUrl || "",
                secondaryCtaLabel: data.secondaryCtaLabel || "",
                secondaryCtaUrl: data.secondaryCtaUrl || "",
                footerNote: data.footerNote || "",
                segment: data.segment,
                totalMatched,
                sentCount,
                failedCount,
                skippedOptOutCount,
            },
        },
    });

    revalidatePath("/admin/email-campaigns");

    return {
        success: sentCount > 0,
        sentCount,
        failedCount,
        skippedOptOutCount,
        message:
            sentCount > 0
                ? `Campaign sent to ${sentCount} recipients${failedCount > 0 ? ` (${failedCount} failed)` : ""}${skippedOptOutCount > 0 ? ` · ${skippedOptOutCount} unsubscribed skipped` : ""}.`
                : `Campaign failed to send (${failedCount} failed). Verify SMTP configuration.`,
    };
}

function readStringField(
    obj: Record<string, unknown>,
    key: string,
    fallback = ""
): string {
    const val = obj[key];
    return typeof val === "string" ? val : fallback;
}

function readNumberField(
    obj: Record<string, unknown>,
    key: string,
    fallback = 0
): number {
    const val = obj[key];
    return typeof val === "number" && Number.isFinite(val) ? val : fallback;
}

export async function getCampaignHistory(
    limit = 30
): Promise<CampaignHistoryEntry[]> {
    const admin = await requireStrictAdmin();
    if (!admin) return [];

    const logs = await prisma.auditLog.findMany({
        where: {
            action: "EMAIL_CAMPAIGN_SENT",
            targetType: "EmailCampaign",
        },
        include: {
            admin: {
                select: { name: true, email: true },
            },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
    });

    return logs.map((log) => {
        const raw =
            log.details && typeof log.details === "object"
                ? (log.details as Record<string, unknown>)
                : {};
        const segRaw = readStringField(raw, "segment", "ALL_USERS");
        const validSeg: CampaignSegmentId =
            segRaw === "FREE_TRIAL" ||
            segRaw === "VIP_PRO" ||
            segRaw === "HAS_MT5" ||
            segRaw === "NO_MT5" ||
            segRaw === "CUSTOM_LIST"
                ? segRaw
                : "ALL_USERS";

        const subject = readStringField(raw, "subject", "Untitled Campaign");

        return {
            id: log.id,
            campaignTitle: readStringField(raw, "campaignTitle", subject),
            subject,
            preheader: readStringField(raw, "preheader"),
            badgeText: readStringField(raw, "badgeText"),
            heading: readStringField(raw, "heading", subject),
            bodyContent: readStringField(raw, "bodyContent"),
            highlightTitle: readStringField(raw, "highlightTitle"),
            highlightItemsRaw: readStringField(raw, "highlightItemsRaw"),
            ctaLabel: readStringField(raw, "ctaLabel"),
            ctaUrl: readStringField(raw, "ctaUrl"),
            secondaryCtaLabel: readStringField(raw, "secondaryCtaLabel"),
            secondaryCtaUrl: readStringField(raw, "secondaryCtaUrl"),
            footerNote: readStringField(raw, "footerNote"),
            segment: validSeg,
            totalMatched: readNumberField(raw, "totalMatched"),
            sentCount: readNumberField(raw, "sentCount"),
            failedCount: readNumberField(raw, "failedCount"),
            skippedOptOutCount: readNumberField(raw, "skippedOptOutCount"),
            sentBy: log.admin?.name || log.admin?.email || "Admin",
            createdAtIso: log.createdAt.toISOString(),
        };
    });
}
