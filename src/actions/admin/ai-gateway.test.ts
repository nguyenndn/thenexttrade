import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    addAiCredential,
    testAiCredential,
    activateAiCredential,
} from "./ai-gateway";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { encrypt, decrypt } from "@/lib/encryption";
import { getAdapter } from "@/lib/ai-gateway/provider-registry";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: { findUnique: vi.fn() },
        aiProviderCredential: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        aiProvider: { update: vi.fn() },
        adminAuditLog: { create: vi.fn() },
        $transaction: vi.fn((cb) => cb(prisma)),
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/encryption", () => ({
    encrypt: vi.fn((s) => `encrypted_${s}`),
    decrypt: vi.fn((s) => s.replace("encrypted_", "")),
}));

vi.mock("@/lib/ai-gateway/provider-registry", () => ({
    getAdapter: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("AI Gateway Admin Actions - Credential Lifecycle", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue({ id: "admin_1" } as any);
        vi.mocked(prisma.profile.findUnique).mockResolvedValue({
            role: "ADMIN",
        } as any);
    });

    it("adds a new credential in DRAFT status", async () => {
        vi.mocked(prisma.aiProviderCredential.create).mockResolvedValue({
            id: "cred_1",
        } as any);

        const res = await addAiCredential("provider_1", "My Key", "sk_1234");

        expect(res.success).toBe(true);
        expect(prisma.aiProviderCredential.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: "DRAFT",
                    lastFour: "1234",
                    encryptedSecret: "encrypted_sk_1234",
                }),
            })
        );
        expect(prisma.adminAuditLog.create).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/admin/ai/providers");
    });

    it("tests a credential and moves it to TESTED if successful", async () => {
        vi.mocked(prisma.aiProviderCredential.findUnique).mockResolvedValue({
            id: "cred_1",
            providerId: "provider_1",
            status: "DRAFT",
            encryptedSecret: "encrypted_sk_1234",
            provider: { providerCode: "deepseek" },
        } as any);

        const mockTest = vi.fn().mockResolvedValue({ ok: true });
        vi.mocked(getAdapter).mockReturnValue({
            testCredential: mockTest,
        } as any);

        const res = await testAiCredential("cred_1");
        expect(res.success).toBe(true);
        expect(mockTest).toHaveBeenCalledWith(
            expect.objectContaining({ decryptedSecret: "sk_1234" })
        );

        expect(prisma.aiProviderCredential.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "cred_1" },
                data: expect.objectContaining({ status: "TESTED" }),
            })
        );
    });

    it("moves a credential to INVALID if test fails", async () => {
        vi.mocked(prisma.aiProviderCredential.findUnique).mockResolvedValue({
            id: "cred_1",
            providerId: "provider_1",
            status: "DRAFT",
            encryptedSecret: "encrypted_sk_1234",
            provider: { providerCode: "deepseek" },
        } as any);

        const mockTest = vi
            .fn()
            .mockResolvedValue({ ok: false, message: "Invalid key" });
        vi.mocked(getAdapter).mockReturnValue({
            testCredential: mockTest,
        } as any);

        await expect(testAiCredential("cred_1")).rejects.toThrow();

        expect(prisma.aiProviderCredential.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "cred_1" },
                data: expect.objectContaining({ status: "INVALID" }),
            })
        );
    });

    it("activates a TESTED credential and revokes others", async () => {
        vi.mocked(prisma.aiProviderCredential.findUnique).mockResolvedValue({
            id: "cred_2",
            providerId: "provider_1",
            status: "TESTED",
        } as any);

        const res = await activateAiCredential("cred_2");

        expect(res.success).toBe(true);

        // Revokes others
        expect(prisma.aiProviderCredential.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: "ACTIVE",
                    id: { not: "cred_2" },
                }),
                data: expect.objectContaining({ status: "REVOKED" }),
            })
        );

        // Activates new one
        expect(prisma.aiProviderCredential.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "cred_2" },
                data: expect.objectContaining({ status: "ACTIVE" }),
            })
        );
    });

    it("throws if trying to activate a non-TESTED credential", async () => {
        vi.mocked(prisma.aiProviderCredential.findUnique).mockResolvedValue({
            id: "cred_3",
            providerId: "provider_1",
            status: "DRAFT",
        } as any);

        await expect(activateAiCredential("cred_3")).rejects.toThrow(
            "Credential must be TESTED before activation"
        );
    });
});
