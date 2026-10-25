import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserProAccess } from "@/lib/pro-access";
import { notifyAdminsOfNewAccount } from "@/lib/admin/admin-notification.server";
import { createTradingAccount, deleteTradingAccount } from "./accounts";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
            Promise.all(operations)
        ),
        tradingAccount: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
            delete: vi.fn(),
            updateMany: vi.fn(),
        },
        profile: {
            updateMany: vi.fn(),
        },
        proEntitlement: {
            deleteMany: vi.fn(),
        },
        vipRequest: {
            updateMany: vi.fn(),
        },
        ibLead: {
            updateMany: vi.fn(),
        },
        importHistory: {
            updateMany: vi.fn(),
        },
        journalEntry: {
            updateMany: vi.fn(),
        },
        eALicense: {
            deleteMany: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/pro-access", () => ({
    getUserProAccess: vi.fn(),
}));

vi.mock("@/lib/admin/admin-notification.server", () => ({
    notifyAdminsOfNewAccount: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Trading Accounts Actions", () => {
    const mockUser = {
        id: "user-free-1",
        email: "free@example.com",
        name: "Free Trader",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getAuthUser as any).mockResolvedValue(mockUser);
    });

    describe("createTradingAccount Quota Limits", () => {
        it("blocks creating a 3rd Free account when user already has 2 accounts and is not Pro", async () => {
            (prisma.tradingAccount.count as any).mockResolvedValue(2);
            (getUserProAccess as any).mockResolvedValue({ isPro: false });

            const result = await createTradingAccount({
                name: "Third Account",
                broker: "IC Markets",
                server: "ICMarketsSC-Demo",
                accountNumber: "999888",
                balance: 1000,
                currency: "USD",
            });

            expect(result.error).toContain("Free tier is limited to 2 connected accounts");
            expect(prisma.tradingAccount.create).not.toHaveBeenCalled();
        });

        it("allows creating an account when user has less than 2 accounts", async () => {
            (prisma.tradingAccount.count as any).mockResolvedValue(1);
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);
            (prisma.user.findUnique as any).mockResolvedValue({ syncApiKey: "EXISTING-SYNC-KEY" });

            const createdAccount = {
                id: "acc-2",
                userId: mockUser.id,
                name: "Second Account",
                broker: "IC Markets",
                balance: 500,
                createdAt: new Date(),
            };
            (prisma.tradingAccount.create as any).mockResolvedValue(createdAccount);

            const result = await createTradingAccount({
                name: "Second Account",
                broker: "IC Markets",
                server: "ICMarketsSC-Demo",
                accountNumber: "999889",
                balance: 500,
                currency: "USD",
            });

            expect(result.success).toBe(true);
            expect(prisma.tradingAccount.create).toHaveBeenCalled();
            expect(notifyAdminsOfNewAccount).toHaveBeenCalledWith(
                expect.objectContaining({
                    accountId: "acc-2",
                    userId: mockUser.id,
                    accountNumber: "999889",
                })
            );
        });

        it("allows creating a 3rd account if user has Pro access", async () => {
            (prisma.tradingAccount.count as any).mockResolvedValue(2);
            (getUserProAccess as any).mockResolvedValue({ isPro: true });
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);
            (prisma.user.findUnique as any).mockResolvedValue({ syncApiKey: "EXISTING-SYNC-KEY" });

            const createdAccount = {
                id: "acc-3",
                userId: mockUser.id,
                name: "Third Account (Pro)",
                broker: "IC Markets",
                balance: 1000,
                createdAt: new Date(),
            };
            (prisma.tradingAccount.create as any).mockResolvedValue(createdAccount);

            const result = await createTradingAccount({
                name: "Third Account (Pro)",
                broker: "IC Markets",
                server: "ICMarketsSC-Demo",
                accountNumber: "999890",
                balance: 1000,
                currency: "USD",
            });

            expect(result.success).toBe(true);
            expect(prisma.tradingAccount.create).toHaveBeenCalled();
        });

        it("rejects creating an account when user is not authenticated", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const result = await createTradingAccount({
                name: "Unauth Account",
                balance: 1000,
                currency: "USD",
            });

            expect(result.error).toBe("Unauthorized");
            expect(prisma.tradingAccount.create).not.toHaveBeenCalled();
        });

        it("rejects duplicate account number for the same user", async () => {
            (prisma.tradingAccount.count as any).mockResolvedValue(1);
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({ id: "existing-acc" });

            const result = await createTradingAccount({
                name: "Duplicate Account",
                broker: "Exness",
                accountNumber: "123456",
                balance: 500,
                currency: "USD",
            });

            expect(result.error).toContain("An account with number 123456 already exists");
            expect(prisma.tradingAccount.create).not.toHaveBeenCalled();
        });

        it("creates a new syncApiKey on user profile if user has none", async () => {
            (prisma.tradingAccount.count as any).mockResolvedValue(0);
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);
            (prisma.user.findUnique as any).mockResolvedValue({ syncApiKey: null });
            (prisma.user.update as any).mockResolvedValue({ id: mockUser.id });

            (prisma.tradingAccount.create as any).mockResolvedValue({
                id: "first-acc",
                userId: mockUser.id,
                name: "First Account",
                broker: "Vantage",
                balance: 100,
                createdAt: new Date(),
            });

            const result = await createTradingAccount({
                name: "First Account",
                broker: "Vantage",
                accountNumber: "111222",
                balance: 100,
                currency: "USD",
            });

            expect(result.success).toBe(true);
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockUser.id },
                    data: expect.objectContaining({
                        syncApiKey: expect.any(String),
                    }),
                })
            );
        });
    });

    describe("deleteTradingAccount", () => {
        it("returns Unauthorized when user is not authenticated", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const result = await deleteTradingAccount("acc-1");
            expect(result.error).toBe("Unauthorized");
            expect(prisma.tradingAccount.delete).not.toHaveBeenCalled();
        });

        it("deletes account belonging to user and returns success", async () => {
            (prisma.tradingAccount.findUnique as any).mockResolvedValue({
                id: "acc-1",
                userId: mockUser.id,
            });
            (prisma.tradingAccount.delete as any).mockResolvedValue({ id: "acc-1" });

            const result = await deleteTradingAccount("acc-1");
            expect(result.success).toBe(true);
            expect(prisma.tradingAccount.delete).toHaveBeenCalledWith({
                where: { id: "acc-1", userId: mockUser.id },
            });
        });
    });
});
