import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { verifyTurnstile } from "@/lib/turnstile";
import { createPartnerProAccount, upgradeToPartnerPro } from "./account-pro";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        proEntitlement: {
            findFirst: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        vipRequest: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/turnstile", () => ({
    verifyTurnstile: vi.fn(),
}));

vi.mock("@/lib/admin/admin-notification.server", () => ({
    notifyAdminsOfNewAccount: vi.fn().mockResolvedValue(undefined),
    notifyAdminsOfVipRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/utils/api-key", () => ({
    generateApiKey: vi.fn().mockReturnValue("MOCK-API-KEY"),
}));

vi.mock("@/actions/ib-lead", () => ({
    linkIbLeadToVipRequest: vi.fn().mockResolvedValue(undefined),
}));

describe("Partner Pro Account Actions", () => {
    const mockUser = {
        id: "user-123",
        email: "trader@example.com",
        name: "Trader Test",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getAuthUser as any).mockResolvedValue(mockUser);
        (verifyTurnstile as any).mockResolvedValue({ success: true });
    });

    describe("createPartnerProAccount", () => {
        it("returns Unauthorized when user is not logged in", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const formData = new FormData();
            formData.set("broker", "ULTIMAMARKETS");
            formData.set("accountNumber", "924399");

            const result = await createPartnerProAccount(formData);
            expect(result.error).toBe("Unauthorized");
        });

        it("fails when Cloudflare Turnstile verification fails", async () => {
            (verifyTurnstile as any).mockResolvedValue({
                success: false,
                error: "Captcha failed",
            });

            const formData = new FormData();
            formData.set("broker", "ULTIMAMARKETS");
            formData.set("accountNumber", "924399");
            formData.set("cf-turnstile-response", "invalid-token");

            const result = await createPartnerProAccount(formData);
            expect(result.error).toContain("Captcha failed");
        });

        it("rejects if account number is already registered under another user", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "other-user-acc",
                userId: "other-user-999",
            });

            const formData = new FormData();
            formData.set("broker", "ULTIMAMARKETS");
            formData.set("accountNumber", "924399");
            formData.set("balance", "1000");
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("fullName", "Trader Test");
            formData.set("country", "VN");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await createPartnerProAccount(formData);
            expect(result.error).toContain("already registered by another user");
        });

        it("allows creating a new Partner Pro account when user has an unlinked Pro for a DIFFERENT account", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);
            (prisma.proEntitlement.findFirst as any).mockResolvedValue(null);
            (prisma.vipRequest.findFirst as any).mockResolvedValue(null);

            (prisma.tradingAccount.create as any).mockResolvedValue({
                id: "new-account-id",
                userId: mockUser.id,
                broker: "ULTIMAMARKETS",
                accountNumber: "924399",
                createdAt: new Date(),
            });

            (prisma.vipRequest.create as any).mockResolvedValue({
                id: "vip-req-id",
            });

            const formData = new FormData();
            formData.set("broker", "ULTIMAMARKETS");
            formData.set("accountNumber", "924399");
            formData.set("balance", "100000");
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("fullName", "Trader Test");
            formData.set("country", "VN");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await createPartnerProAccount(formData);

            expect(result.error).toBeUndefined();
            expect(result.success).toBe(true);
            expect(result.accountId).toBe("new-account-id");
            expect(prisma.vipRequest.create).toHaveBeenCalled();
        });

        it("auto-links entitlement immediately when adding an account matching an unlinked approved Pro record", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);

            (prisma.proEntitlement.findFirst as any).mockResolvedValue({
                id: "unlinked-pro-ent-id",
                status: "ACTIVE",
                broker: "ULTIMAMARKETS",
                accountNumber: "924399",
            });
            (prisma.vipRequest.findFirst as any).mockResolvedValue(null);

            (prisma.tradingAccount.create as any).mockResolvedValue({
                id: "created-acc-id",
                userId: mockUser.id,
                broker: "ULTIMAMARKETS",
                accountNumber: "924399",
            });

            (prisma.proEntitlement.update as any).mockResolvedValue({
                id: "unlinked-pro-ent-id",
                tradingAccountId: "created-acc-id",
            });

            const formData = new FormData();
            formData.set("broker", "ULTIMAMARKETS");
            formData.set("accountNumber", "924399");
            formData.set("balance", "50000");
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("fullName", "Trader Test");
            formData.set("country", "VN");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await createPartnerProAccount(formData);

            expect(result.success).toBe(true);
            expect(result.accountId).toBe("created-acc-id");
            expect(prisma.vipRequest.create).not.toHaveBeenCalled();
            expect(prisma.proEntitlement.update).toHaveBeenCalledWith({
                where: { id: "unlinked-pro-ent-id" },
                data: { tradingAccountId: "created-acc-id" },
            });
        });

        it("blocks duplicate pending VipRequest for the same broker & account number", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);
            (prisma.proEntitlement.findFirst as any).mockResolvedValue(null);

            (prisma.vipRequest.findFirst as any).mockResolvedValue({
                id: "existing-pending-id",
                status: "PENDING",
            });

            const formData = new FormData();
            formData.set("broker", "ULTIMAMARKETS");
            formData.set("accountNumber", "924399");
            formData.set("balance", "50000");
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("fullName", "Trader Test");
            formData.set("country", "VN");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await createPartnerProAccount(formData);

            expect(result.error).toContain("pending verification request");
        });
    });

    describe("upgradeToPartnerPro", () => {
        it("returns Unauthorized when user is not logged in", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const formData = new FormData();
            const result = await upgradeToPartnerPro("acc-1", formData);
            expect(result.error).toBe("Unauthorized");
        });

        it("returns error when target trading account does not exist", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);

            const formData = new FormData();
            formData.set("cf-turnstile-response", "mock-token");

            const result = await upgradeToPartnerPro("non-existent-acc", formData);
            expect(result.error).toBe("Account not found");
        });

        it("returns error when target trading account is missing a supported broker", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-missing-info",
                broker: null,
                accountNumber: null,
            });

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await upgradeToPartnerPro("acc-missing-info", formData);
            expect(result.error).toContain("missing a supported broker");
        });

        it("returns error when target account already has active Partner Pro access", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "acc-already-pro",
                broker: "Exness",
                accountNumber: "257342963",
            });

            (prisma.proEntitlement.findFirst as any).mockResolvedValueOnce({
                id: "existing-active-ent",
                status: "ACTIVE",
            });

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await upgradeToPartnerPro("acc-already-pro", formData);
            expect(result.error).toContain("already has active Pro access");
        });

        it("auto-links unlinked Pro record when upgrading an account", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "existing-free-acc-id",
                broker: "Vantage",
                accountNumber: "12345678",
                balance: 500,
            });

            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null) // existingPro check
                .mockResolvedValueOnce({
                    id: "unlinked-ent-1",
                    status: "ACTIVE",
                    broker: "VANTAGE",
                    accountNumber: "12345678",
                }); // unlinkedPro check

            (prisma.proEntitlement.update as any).mockResolvedValue({
                id: "unlinked-ent-1",
                tradingAccountId: "existing-free-acc-id",
            });

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await upgradeToPartnerPro("existing-free-acc-id", formData);

            expect(result.success).toBe(true);
            expect(result.accountId).toBe("existing-free-acc-id");
            expect(prisma.vipRequest.create).not.toHaveBeenCalled();
            expect(prisma.proEntitlement.update).toHaveBeenCalledWith({
                where: { id: "unlinked-ent-1" },
                data: { tradingAccountId: "existing-free-acc-id" },
            });
        });

        it("creates a new VIP request when upgrading an account with no pre-existing entitlement", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({
                id: "free-acc-upgrade",
                broker: "Exness",
                accountNumber: "998877",
                balance: 1000,
            });

            (prisma.proEntitlement.findFirst as any)
                .mockResolvedValueOnce(null) // existingPro check
                .mockResolvedValueOnce(null); // unlinkedPro check

            (prisma.vipRequest.findFirst as any).mockResolvedValue(null);

            (prisma.vipRequest.create as any).mockResolvedValue({
                id: "new-vip-request-id",
            });

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("telegramId", "@trader123");
            formData.set("cf-turnstile-response", "mock-token");

            const result = await upgradeToPartnerPro("free-acc-upgrade", formData);

            expect(result.success).toBe(true);
            expect(result.accountId).toBe("free-acc-upgrade");
            expect(prisma.vipRequest.create).toHaveBeenCalled();
        });
    });
});
