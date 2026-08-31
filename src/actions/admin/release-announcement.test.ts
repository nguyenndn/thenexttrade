import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    previewReleaseAnnouncement,
    getReleaseAudienceSummary,
    sendReleaseAnnouncementBroadcast,
} from "@/app/admin/trading-systems/actions";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: { findUnique: vi.fn() },
        eAProduct: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        eALicense: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
        user: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: "admin-uuid", email: "admin@thenexttrade.com" } },
            }),
            mfa: {
                getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
                    data: { currentLevel: "aal1", nextLevel: "aal1" },
                }),
            },
        },
    }),
}));

vi.mock("@/lib/services/email.service", () => ({
    buildEAUpdateEmailHtml: vi.fn((data) => `<html>Update ${data.eaName} ${data.version}</html>`),
    sendEmailWithDetails: vi.fn().mockResolvedValue({ success: true, messageId: "msg_123" }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Release Announcement Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "ADMIN",
        } as any);
    });

    it("previews release announcement HTML correctly", async () => {
        vi.mocked(prisma.eAProduct.findUnique).mockResolvedValue({
            id: "goldscalperninja",
            name: "GoldScalperNinja Pro",
            version: "2.5.0",
            slug: "goldscalperninja",
        } as any);

        const result = await previewReleaseAnnouncement({
            productId: "goldscalperninja",
            version: "2.5.0",
            releaseNotes: ["Feature 1", "Feature 2"],
        });

        expect(result.success).toBe(true);
        expect(result.html).toContain("GoldScalperNinja Pro");
    });

    it("returns audience summary counts for a product", async () => {
        vi.mocked(prisma.eALicense.count).mockResolvedValue(15);
        vi.mocked(prisma.user.count)
            .mockResolvedValueOnce(8) // pro users
            .mockResolvedValueOnce(120); // total users

        const result = await getReleaseAudienceSummary("goldscalperninja");

        expect(result.success).toBe(true);
        expect(result.counts).toEqual({
            ACTIVE_HOLDERS: 15,
            PRO_TRADERS: 8,
            ALL_USERS: 120,
        });
    });

    it("sends test release email without broadcasting to users", async () => {
        vi.mocked(prisma.eAProduct.findUnique).mockResolvedValue({
            id: "goldscalperninja",
            name: "GoldScalperNinja Pro",
            version: "2.5.0",
            slug: "goldscalperninja",
        } as any);

        const result = await sendReleaseAnnouncementBroadcast({
            productId: "goldscalperninja",
            version: "2.5.0",
            releaseNotes: ["Feature 1"],
            targetAudience: "ACTIVE_HOLDERS",
            isTest: true,
            testRecipient: "test@example.com",
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(1);
    });

    it("broadcasts release email to active holders and creates audit log", async () => {
        vi.mocked(prisma.eAProduct.findUnique).mockResolvedValue({
            id: "goldscalperninja",
            name: "GoldScalperNinja Pro",
            version: "2.5.0",
            slug: "goldscalperninja",
        } as any);

        vi.mocked(prisma.eALicense.findMany).mockResolvedValue([
            {
                user: { id: "u1", name: "Trader 1", email: "trader1@example.com" },
            },
            {
                user: { id: "u2", name: "Trader 2", email: "trader2@example.com" },
            },
        ] as any);

        const result = await sendReleaseAnnouncementBroadcast({
            productId: "goldscalperninja",
            version: "2.5.0",
            releaseNotes: ["Smart Trailing Stop v2"],
            targetAudience: "ACTIVE_HOLDERS",
            isTest: false,
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);
        expect(prisma.auditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: "RELEASE_BROADCAST_SENT",
                }),
            })
        );
    });
});
