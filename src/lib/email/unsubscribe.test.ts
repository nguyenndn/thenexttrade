import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    buildMarketingUnsubscribeUrls,
    createMarketingUnsubscribeToken,
    getSuppressedMarketingEmails,
    MARKETING_SUPPRESSION_SETTING_KEY,
    resubscribeEmailToMarketing,
    unsubscribeEmailFromMarketing,
    verifyMarketingUnsubscribeToken,
} from "./unsubscribe";
import { canSendEmailCategory } from "./preferences";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        systemSetting: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe("Marketing Unsubscribe Token & Suppression", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as never);
    });

    it("creates and verifies HMAC-signed marketing unsubscribe tokens and rejects tampering", () => {
        const token = createMarketingUnsubscribeToken("  Trader@Example.com ");
        expect(verifyMarketingUnsubscribeToken(token)).toBe("trader@example.com");

        const tampered = `${token.slice(0, -3)}xyz`;
        expect(verifyMarketingUnsubscribeToken(tampered)).toBeNull();
        expect(verifyMarketingUnsubscribeToken("invalid-token")).toBeNull();
        expect(verifyMarketingUnsubscribeToken("")).toBeNull();
    });

    it("builds page and RFC 8058 one-click API URLs cleanly", () => {
        const urls = buildMarketingUnsubscribeUrls(
            "lead@example.com",
            "https://thenexttrade.app/"
        );
        expect(urls.pageUrl).toMatch(
            /^https:\/\/thenexttrade\.app\/unsubscribe\?token=/
        );
        expect(urls.oneClickApiUrl).toMatch(
            /^https:\/\/thenexttrade\.app\/api\/email\/unsubscribe\?token=/
        );
    });

    it("opts a registered user out of marketing ONLY while keeping reports, activation, and system emails intact", async () => {
        vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
            id: "user-42",
            settings: {
                theme: "dark",
                emailPreferences: {
                    reports: true,
                    activation: true,
                    marketing: true,
                    welcome: true,
                    unsubscribedAll: false,
                },
            },
        } as never);

        const result = await unsubscribeEmailFromMarketing("User42@Example.com");
        expect(result).toEqual({
            email: "user42@example.com",
            updatedUser: true,
        });

        expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: MARKETING_SUPPRESSION_SETTING_KEY },
                update: { value: { emails: ["user42@example.com"] } },
            })
        );

        const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
        const savedSettings = updateCall.data.settings as Record<string, unknown>;
        expect(savedSettings.theme).toBe("dark");

        // Marketing is OFF, while reports/activation remain ON and unsubscribedAll stays false
        expect(canSendEmailCategory(savedSettings, "marketing")).toBe(false);
        expect(canSendEmailCategory(savedSettings, "reports")).toBe(true);
        expect(canSendEmailCategory(savedSettings, "activation")).toBe(true);
    });

    it("suppresses external Custom List emails even without a registered User account", async () => {
        vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

        const result = await unsubscribeEmailFromMarketing("external@lead.io");
        expect(result).toEqual({
            email: "external@lead.io",
            updatedUser: false,
        });
        expect(prisma.user.update).not.toHaveBeenCalled();

        vi.mocked(prisma.systemSetting.findUnique).mockResolvedValueOnce({
            value: { emails: ["external@lead.io"] },
        } as never);

        const set = await getSuppressedMarketingEmails();
        expect(set.has("external@lead.io")).toBe(true);
    });

    it("resubscribes an email by removing it from suppression list and re-enabling marketing", async () => {
        vi.mocked(prisma.systemSetting.findUnique).mockResolvedValueOnce({
            value: { emails: ["user42@example.com", "other@lead.io"] },
        } as never);
        vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
            id: "user-42",
            settings: {
                emailPreferences: {
                    reports: true,
                    activation: true,
                    marketing: false,
                    welcome: true,
                    unsubscribedAll: false,
                },
            },
        } as never);

        await resubscribeEmailToMarketing("user42@example.com");

        expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: MARKETING_SUPPRESSION_SETTING_KEY },
                update: { value: { emails: ["other@lead.io"] } },
            })
        );
        expect(prisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "user-42" },
            })
        );
    });
});
