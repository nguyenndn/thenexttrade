import { describe, it, expect, vi, beforeEach } from "vitest";
import { revealTradingAccountPassword } from "./cloud-sync";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { encryptPassword } from "@/lib/crypto";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findUnique: vi.fn(),
        },
        profile: {
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

describe("revealTradingAccountPassword", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects unauthenticated requests", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(null);

        const res = await revealTradingAccountPassword("acc-1");
        expect(res).toEqual({ success: false, error: "Unauthorized" });
    });

    it("allows the account owner to decrypt an AES-256-GCM (v1) saved password", async () => {
        const encrypted = encryptPassword("Investor#2026!");
        vi.mocked(getAuthUser).mockResolvedValue({ id: "owner-1" } as never);
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acc-1",
            userId: "owner-1",
            credential: {
                encryptedPassword: encrypted,
                keyVersion: "v1",
            },
        } as never);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "USER",
        } as never);

        const res = await revealTradingAccountPassword("acc-1");
        expect(res).toEqual({
            success: true,
            password: "Investor#2026!",
        });
    });

    it("allows an ADMIN to decrypt another user's MT5 password", async () => {
        const encrypted = encryptPassword("TraderPass@99");
        vi.mocked(getAuthUser).mockResolvedValue({ id: "admin-1" } as never);
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acc-2",
            userId: "trader-99",
            credential: {
                encryptedPassword: encrypted,
                keyVersion: "v1",
            },
        } as never);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "ADMIN",
        } as never);

        const res = await revealTradingAccountPassword("acc-2");
        expect(res).toEqual({
            success: true,
            password: "TraderPass@99",
        });
    });

    it("blocks a non-admin user from revealing another user's MT5 password", async () => {
        const encrypted = encryptPassword("SecretPass");
        vi.mocked(getAuthUser).mockResolvedValue({ id: "attacker-1" } as never);
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acc-3",
            userId: "victim-1",
            credential: {
                encryptedPassword: encrypted,
                keyVersion: "v1",
            },
        } as never);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "USER",
        } as never);

        const res = await revealTradingAccountPassword("acc-3");
        expect(res).toEqual({ success: false, error: "Forbidden." });
    });

    it("supports legacy plain credentials and rejects corrupted v1 ciphertext", async () => {
        vi.mocked(getAuthUser).mockResolvedValue({ id: "owner-2" } as never);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "USER",
        } as never);

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValueOnce({
            id: "acc-legacy",
            userId: "owner-2",
            credential: {
                encryptedPassword: "LegacyPlainPassword",
                keyVersion: "plain",
            },
        } as never);

        const legacyRes = await revealTradingAccountPassword("acc-legacy");
        expect(legacyRes).toEqual({
            success: true,
            password: "LegacyPlainPassword",
        });

        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValueOnce({
            id: "acc-corrupt",
            userId: "owner-2",
            credential: {
                encryptedPassword: "corrupted-payload",
                keyVersion: "v1",
            },
        } as never);

        const corruptRes = await revealTradingAccountPassword("acc-corrupt");
        expect(corruptRes).toEqual({
            success: false,
            error: "Saved password could not be decrypted. Please re-enter it.",
        });
    });
});

