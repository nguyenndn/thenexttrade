import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import * as executionResolver from "@/lib/ai-gateway/execution-resolver";
import { requireAdmin } from "@/lib/api-auth";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    },
}));

vi.mock("@/lib/ai-gateway/execution-resolver", () => ({
    resolveExecutionPlan: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
    requireAdmin: vi.fn(),
}));

describe("GET /api/v1/ai/health", () => {
    beforeEach(async () => {
        vi.resetAllMocks();
        const { prisma } = await import("@/lib/prisma");
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);
        vi.mocked(requireAdmin).mockResolvedValue(
            NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );
    });

    it("returns minimal public degraded status without leaking internal fields for unauthenticated callers", async () => {
        vi.mocked(executionResolver.resolveExecutionPlan).mockResolvedValue({
            policy: null,
            modelIds: [],
            steps: [
                {
                    kind: "skipped",
                    diagnostic: {
                        modelId: "gemini-pro",
                        errorCode: "MISSING_API_KEY",
                        reason: "API key missing",
                    },
                },
            ],
        } as never);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ status: "degraded" });
        expect(body.routing).toBeUndefined();
        expect(body.provider).toBeUndefined();
        expect(body.database).toBeUndefined();
    });

    it("returns minimal public ok status without skipped_models for unauthenticated callers", async () => {
        vi.mocked(executionResolver.resolveExecutionPlan).mockResolvedValue({
            policy: { id: "p1" },
            modelIds: ["model"],
            steps: [
                {
                    kind: "candidate",
                    candidate: {
                        provider: "mock",
                        credential: { id: "1", decryptedSecret: "secret" },
                        modelCode: "model",
                    },
                },
                {
                    kind: "skipped",
                    diagnostic: {
                        modelId: "skipped_model",
                        errorCode: "TEST_SKIP",
                        reason: "Reason skipped",
                    },
                },
            ],
        } as never);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ status: "ok" });
        expect(body.routing).toBeUndefined();
    });

    it("returns 503 minimal degraded status if DB throws for unauthenticated callers", async () => {
        const { prisma } = await import("@/lib/prisma");
        vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
            new Error("DB Connection failed")
        );

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(503);
        expect(body).toEqual({ status: "degraded" });
    });

    it("returns full routing diagnostics only when requireAdmin succeeds", async () => {
        vi.mocked(requireAdmin).mockResolvedValue({
            user: {
                id: "admin-1",
                email: "admin@thenexttrade.com",
                role: "ADMIN",
            },
        });

        vi.mocked(executionResolver.resolveExecutionPlan).mockResolvedValue({
            policy: { id: "p1" },
            modelIds: ["model"],
            steps: [
                {
                    kind: "candidate",
                    candidate: {
                        provider: "mock",
                        credential: { id: "1", decryptedSecret: "secret" },
                        modelCode: "model",
                    },
                },
                {
                    kind: "skipped",
                    diagnostic: {
                        modelId: "skipped_model",
                        errorCode: "TEST_SKIP",
                        reason: "Reason skipped",
                    },
                },
            ],
        } as never);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe("ok");
        expect(body.provider).toBe("online");
        expect(body.routing.policy_configured).toBe(true);
        expect(body.routing.routable_models).toBe(1);
        expect(body.routing.skipped_models).toHaveLength(1);
        expect(body.routing.skipped_models[0].code).toBe("TEST_SKIP");

        // Ensure raw decrypted secret is never leaked even to admins
        const bodyString = JSON.stringify(body);
        expect(bodyString).not.toContain("secret");
    });
});
