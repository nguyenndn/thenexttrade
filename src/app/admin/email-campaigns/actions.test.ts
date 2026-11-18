import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    dispatchEmailCampaignAction,
    getCampaignAudienceCounts,
    getCampaignHistory,
    sendCampaignTestEmailAction,
} from "./actions";
import { prisma } from "@/lib/prisma";
import { sendEmailWithDetails } from "@/lib/services/email.service";

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: { id: "admin-1", email: "admin@thenexttrade.app" },
                },
            }),
        },
    }),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: { findUnique: vi.fn() },
        user: { findMany: vi.fn() },
        systemSetting: { findUnique: vi.fn() },
        auditLog: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

vi.mock("@/lib/services/email.service", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/services/email.service")>();
    return {
        ...actual,
        sendEmailWithDetails: vi.fn().mockResolvedValue({
            success: true,
            messageId: "msg_ok",
        }),
    };
});

const SAMPLE_USERS = [
    {
        id: "u1",
        name: "Pro Connected",
        email: "pro@example.com",
        settings: { emailPreferences: { marketing: true, unsubscribedAll: false } },
        proEntitlements: [{ id: "pe1" }],
        _count: { tradingAccounts: 2 },
    },
    {
        id: "u2",
        name: "Free No MT5",
        email: "free@example.com",
        settings: null,
        proEntitlements: [],
        _count: { tradingAccounts: 0 },
    },
    {
        id: "u3",
        name: "Opted Out Free",
        email: "optout@example.com",
        settings: { emailPreferences: { marketing: false, unsubscribedAll: false, reports: true } },
        proEntitlements: [],
        _count: { tradingAccounts: 1 },
    },
];

describe("Admin Email Campaigns Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "ADMIN",
        } as never);
        vi.mocked(prisma.user.findMany).mockResolvedValue(SAMPLE_USERS as never);
        vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "log-1" } as never);
    });

    it("rejects non-admin callers across campaign actions", async () => {
        vi.mocked(prisma.profile.findUnique).mockResolvedValueOnce({
            role: "USER",
        } as never);

        const res = await getCampaignAudienceCounts();
        expect(res.success).toBe(false);
        expect(res.error).toBe("Unauthorized");
    });

    it("computes accurate opted-in and skipped counts for all 5 DB segments", async () => {
        const res = await getCampaignAudienceCounts();
        expect(res.success).toBe(true);
        expect(res.counts).toEqual({
            ALL_USERS: { total: 3, optedIn: 2, skipped: 1 },
            FREE_TRIAL: { total: 2, optedIn: 1, skipped: 1 },
            VIP_PRO: { total: 1, optedIn: 1, skipped: 0 },
            HAS_MT5: { total: 2, optedIn: 1, skipped: 1 },
            NO_MT5: { total: 1, optedIn: 1, skipped: 0 },
        });
    });

    it("sends a [TEST] prefixed preview email to the specified test inbox", async () => {
        const res = await sendCampaignTestEmailAction({
            subject: "Hello {{name}}",
            heading: "Protect your capital",
            bodyContent: "Check your hard stop-loss before London session.",
            segment: "ALL_USERS",
            testRecipient: "kee@thenexttrade.app",
        });

        expect(res.success).toBe(true);
        expect(sendEmailWithDetails).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "kee@thenexttrade.app",
                subject: "[TEST] Hello Test Trader",
            })
        );
    });

    it("dispatches only to opted-in recipients, skips unsubscribed users, and logs AuditLog", async () => {
        const res = await dispatchEmailCampaignAction({
            campaignTitle: "MT5 Activation",
            subject: "Hi {{name}}, sync MT5",
            heading: "Sync your MT5 account",
            bodyContent: "Zero password sharing required for Trade Manager EA.",
            segment: "FREE_TRIAL",
        });

        expect(res.success).toBe(true);
        expect(res.sentCount).toBe(1);
        expect(res.skippedOptOutCount).toBe(1);
        expect(sendEmailWithDetails).toHaveBeenCalledTimes(1);
        expect(sendEmailWithDetails).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "free@example.com",
                subject: "Hi Free No MT5, sync MT5",
            })
        );
        expect(prisma.auditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: "EMAIL_CAMPAIGN_SENT",
                    targetType: "EmailCampaign",
                }),
            })
        );
    });

    it("loads campaign history entries cleanly from AuditLog", async () => {
        vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([
            {
                id: "log-99",
                createdAt: new Date("2026-11-18T06:00:00.000Z"),
                admin: { name: "Kee", email: "keezimin@gmail.com" },
                details: {
                    campaignTitle: "Weekly Briefing",
                    subject: "New Week Risk Check",
                    heading: "Lock your risk",
                    bodyContent: "Body content",
                    segment: "ALL_USERS",
                    totalMatched: 10,
                    sentCount: 9,
                    failedCount: 0,
                    skippedOptOutCount: 1,
                },
            },
        ] as never);

        const history = await getCampaignHistory(10);
        expect(history).toHaveLength(1);
        expect(history[0]?.subject).toBe("New Week Risk Check");
        expect(history[0]?.sentCount).toBe(9);
        expect(history[0]?.sentBy).toBe("Kee");
    });

    it("enforces marketing opt-out in CUSTOM_LIST for both DB users (marketing: false) and external suppressed leads, and attaches List-Unsubscribe headers", async () => {
        vi.mocked(prisma.systemSetting.findUnique).mockResolvedValueOnce({
            value: { emails: ["unsub-external@lead.io"] },
        } as never);

        const res = await dispatchEmailCampaignAction({
            campaignTitle: "Custom VIP Outreach",
            subject: "Hi {{name}}, check our MT5 Risk Radar",
            heading: "Cold risk math for XAUUSD",
            bodyContent: "Track your live MT5 trade telemetry with zero master password.",
            segment: "CUSTOM_LIST",
            customEmailsRaw: [
                "pro@example.com",
                "optout@example.com",
                "unsub-external@lead.io",
                "fresh@lead.io",
            ].join("\n"),
        });

        expect(res.success).toBe(true);
        expect(res.sentCount).toBe(2);
        expect(res.skippedOptOutCount).toBe(2);
        expect(sendEmailWithDetails).toHaveBeenCalledTimes(2);

        expect(sendEmailWithDetails).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "pro@example.com",
                subject: "Hi Pro Connected, check our MT5 Risk Radar",
                headers: expect.objectContaining({
                    "List-Unsubscribe": expect.stringContaining("/api/email/unsubscribe?token="),
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                }),
            })
        );
        expect(sendEmailWithDetails).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "fresh@lead.io",
                subject: "Hi Trader, check our MT5 Risk Radar",
                html: expect.stringContaining("/unsubscribe?token="),
            })
        );
    });
});
