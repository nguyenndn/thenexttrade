import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { setMainAccount, getMainAccountId } from "./main-account";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
        },
        profile: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Main Account Actions", () => {
    const mockUser = {
        id: "user-test-main",
        email: "main@example.com",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getAuthUser as any).mockResolvedValue(mockUser);
    });

    describe("setMainAccount", () => {
        it("returns Unauthorized when user is not logged in", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const result = await setMainAccount("acc-123");
            expect(result.error).toBe("Unauthorized");
            expect(prisma.profile.upsert).not.toHaveBeenCalled();
        });

        it("returns Account not found when account does not belong to user", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);

            const result = await setMainAccount("acc-foreign");
            expect(result.error).toBe("Account not found");
            expect(prisma.profile.upsert).not.toHaveBeenCalled();
        });

        it("updates profile with mainTradingAccountId when account belongs to user", async () => {
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({ id: "acc-own-1" });
            (prisma.profile.upsert as any).mockResolvedValue({
                id: "profile-1",
                mainTradingAccountId: "acc-own-1",
            });

            const result = await setMainAccount("acc-own-1");
            expect(result.success).toBe(true);
            expect(prisma.profile.upsert).toHaveBeenCalledWith({
                where: { userId: mockUser.id },
                create: {
                    userId: mockUser.id,
                    mainTradingAccountId: "acc-own-1",
                },
                update: {
                    mainTradingAccountId: "acc-own-1",
                },
            });
        });

        it("allows clearing main account by passing null", async () => {
            (prisma.profile.upsert as any).mockResolvedValue({
                id: "profile-1",
                mainTradingAccountId: null,
            });

            const result = await setMainAccount(null);
            expect(result.success).toBe(true);
            expect(prisma.tradingAccount.findFirst).not.toHaveBeenCalled();
            expect(prisma.profile.upsert).toHaveBeenCalledWith({
                where: { userId: mockUser.id },
                create: {
                    userId: mockUser.id,
                    mainTradingAccountId: null,
                },
                update: {
                    mainTradingAccountId: null,
                },
            });
        });
    });

    describe("getMainAccountId", () => {
        it("returns null if user is not logged in", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const result = await getMainAccountId();
            expect(result).toBeNull();
        });

        it("returns main account id from user profile", async () => {
            (prisma.profile.findUnique as any).mockResolvedValue({
                mainTradingAccountId: "acc-main-456",
            });

            const result = await getMainAccountId();
            expect(result).toBe("acc-main-456");
        });

        it("returns null if profile does not have mainTradingAccountId set", async () => {
            (prisma.profile.findUnique as any).mockResolvedValue({
                mainTradingAccountId: null,
            });

            const result = await getMainAccountId();
            expect(result).toBeNull();
        });
    });
});
