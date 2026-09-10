import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInvestorPasswordForAccount } from "./investor-password.server";
import { prisma } from "@/lib/prisma";
import * as cryptoModule from "@/lib/crypto";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccountCredential: {
            findUnique: vi.fn(),
        },
    },
}));

describe("getInvestorPasswordForAccount", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns NO_CREDENTIALS when credential record is null or missing password", async () => {
        vi.mocked(prisma.tradingAccountCredential.findUnique).mockResolvedValueOnce(null);

        const res1 = await getInvestorPasswordForAccount("acc-nonexistent");
        expect(res1).toEqual({ ok: false, reason: "NO_CREDENTIALS" });

        vi.mocked(prisma.tradingAccountCredential.findUnique).mockResolvedValueOnce({
            encryptedPassword: "",
            keyVersion: "plain",
        } as any);

        const res2 = await getInvestorPasswordForAccount("acc-empty");
        expect(res2).toEqual({ ok: false, reason: "NO_CREDENTIALS" });
    });

    it("returns raw password directly when keyVersion is 'plain'", async () => {
        vi.mocked(prisma.tradingAccountCredential.findUnique).mockResolvedValueOnce({
            encryptedPassword: "myPlainPassword123",
            keyVersion: "plain",
        } as any);

        const res = await getInvestorPasswordForAccount("acc-123");
        expect(res).toEqual({ ok: true, password: "myPlainPassword123" });
    });

    it("decrypts password using decryptPassword when keyVersion is 'v1'", async () => {
        const spyDecrypt = vi.spyOn(cryptoModule, "decryptPassword").mockReturnValueOnce("decryptedSecretPass");

        vi.mocked(prisma.tradingAccountCredential.findUnique).mockResolvedValueOnce({
            encryptedPassword: "iv:authTag:ciphertext",
            keyVersion: "v1",
        } as any);

        const res = await getInvestorPasswordForAccount("acc-v1");
        expect(spyDecrypt).toHaveBeenCalledWith("iv:authTag:ciphertext");
        expect(res).toEqual({ ok: true, password: "decryptedSecretPass" });
    });

    it("safely falls back to raw password if v1 decryption throws", async () => {
        vi.spyOn(cryptoModule, "decryptPassword").mockImplementationOnce(() => {
            throw new Error("Decryption failed: bad key");
        });

        vi.mocked(prisma.tradingAccountCredential.findUnique).mockResolvedValueOnce({
            encryptedPassword: "rawEncryptedFallback",
            keyVersion: "v1",
        } as any);

        const res = await getInvestorPasswordForAccount("acc-fallback");
        expect(res).toEqual({ ok: true, password: "rawEncryptedFallback" });
    });

    it("returns UNKNOWN reason when database query throws an error", async () => {
        vi.mocked(prisma.tradingAccountCredential.findUnique).mockRejectedValueOnce(
            new Error("Database connection lost")
        );

        const res = await getInvestorPasswordForAccount("acc-db-err");
        expect(res).toEqual({ ok: false, reason: "UNKNOWN" });
    });
});
