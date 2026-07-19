import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveExecutionPlan, resolveModelsToTry } from "./execution-resolver";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { getAdapter } from "./provider-registry";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        aiRoutingPolicy: { findUnique: vi.fn(), findFirst: vi.fn() },
        aiProviderCredential: { findFirst: vi.fn() },
        aiModel: { findFirst: vi.fn(), findMany: vi.fn() },
    },
}));

vi.mock("@/lib/encryption", () => ({
    decrypt: vi.fn(),
}));

vi.mock("./provider-registry", () => ({
    getAdapter: vi.fn(),
}));

describe("Execution Resolver", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("resolves FIXED policy correctly", async () => {
        (prisma.aiRoutingPolicy.findFirst as any).mockResolvedValue({
            id: "pol1",
            mode: "FIXED",
            primaryModelId: "mod1",
        });

        const res = await resolveModelsToTry();
        expect(res.policy).not.toBeNull();
        if (res.policy) {
            expect(res.policy.mode).toBe("FIXED");
            expect(res.modelsToTry.length).toBe(1);
            expect(res.modelsToTry[0]).toBe("mod1");
        }
    });

    it("resolves AUTO_FAILOVER policy correctly", async () => {
        (prisma.aiRoutingPolicy.findFirst as any).mockResolvedValue({
            id: "pol2",
            mode: "AUTO_FAILOVER",
            primaryModelId: "mod1",
            fallbackConfigJson: ["mod2"],
        });

        const res = await resolveModelsToTry();
        expect(res.policy).not.toBeNull();
        if (res.policy) {
            expect(res.modelsToTry.length).toBe(2);
            expect(res.modelsToTry[0]).toBe("mod1");
            expect(res.modelsToTry[1]).toBe("mod2");
        }
    });

    it("returns false if no active policy is found", async () => {
        (prisma.aiRoutingPolicy.findFirst as any).mockResolvedValue(null);
        const res = await resolveModelsToTry();
        expect(res.policy).toBeNull();
    });

    it("returns a candidate only when provider, credential and adapter are ready", async () => {
        const adapter = {
            providerCode: "deepseek",
            execute: vi.fn(),
            testCredential: vi.fn(),
        };
        (prisma.aiRoutingPolicy.findFirst as any).mockResolvedValue({
            id: "pol-ready",
            mode: "FIXED",
            primaryModelId: "mod-ready",
            maxAttempts: 1,
        });
        (prisma.aiModel.findMany as any).mockResolvedValue([
            {
                id: "mod-ready",
                modelCode: "deepseek-chat",
                enabled: true,
                provider: {
                    id: "provider-ready",
                    providerCode: "deepseek",
                    enabled: true,
                    healthStatus: "HEALTHY",
                    baseUrl: "https://api.deepseek.com/chat/completions",
                    credentials: [
                        {
                            id: "credential-ready",
                            encryptedSecret: "ciphertext",
                            testedAt: new Date(),
                            activatedAt: new Date(),
                        },
                    ],
                },
            },
        ]);
        (decrypt as any).mockReturnValue("secret");
        (getAdapter as any).mockReturnValue(adapter);

        const plan = await resolveExecutionPlan();

        expect(plan.steps).toHaveLength(1);
        expect(plan.steps[0].kind).toBe("candidate");
        if (plan.steps[0].kind === "candidate") {
            expect(plan.steps[0].candidate.decryptedSecret).toBe("secret");
            expect(plan.steps[0].candidate.adapter).toBe(adapter);
        }
    });

    it("skips an active credential that cannot be decrypted", async () => {
        (prisma.aiRoutingPolicy.findFirst as any).mockResolvedValue({
            id: "pol-broken",
            mode: "FIXED",
            primaryModelId: "mod-broken",
            maxAttempts: 1,
        });
        (prisma.aiModel.findMany as any).mockResolvedValue([
            {
                id: "mod-broken",
                enabled: true,
                provider: {
                    id: "provider-broken",
                    providerCode: "deepseek",
                    enabled: true,
                    healthStatus: "HEALTHY",
                    baseUrl: "https://api.deepseek.com/chat/completions",
                    credentials: [
                        {
                            id: "credential-broken",
                            encryptedSecret: "broken",
                            testedAt: new Date(),
                            activatedAt: new Date(),
                        },
                    ],
                },
            },
        ]);
        (getAdapter as any).mockReturnValue({ providerCode: "deepseek" });
        (decrypt as any).mockImplementation(() => {
            throw new Error("bad ciphertext");
        });

        const plan = await resolveExecutionPlan();

        expect(plan.steps).toHaveLength(1);
        expect(plan.steps[0].kind).toBe("skipped");
        if (plan.steps[0].kind === "skipped") {
            expect(plan.steps[0].diagnostic).toMatchObject({
                modelId: "mod-broken",
                credentialId: "credential-broken",
                errorCode: "PROVIDER_CREDENTIAL_INVALID",
            });
        }
        expect(JSON.stringify(plan)).not.toContain("bad ciphertext");
    });
});
