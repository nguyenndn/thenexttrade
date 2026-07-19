import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAiGateway } from "./provider-router";
import { resolveExecutionPlan } from "./execution-resolver";

vi.mock("./execution-resolver", () => ({
    resolveExecutionPlan: vi.fn(),
}));

const validResult = {
    action: "WAIT",
    confidence: 55,
    market_analysis: "Range",
    short_term_trend: "Neutral",
    price_forecast: "No forecast",
    reason: "Waiting for confirmation",
    invalidation: "None",
    risk_note: "Do not enter",
    entry: 0,
    sl: 0,
    tp1: 0,
    tp2: 0,
    tp3: 0,
    rr: 0,
    reference_action: "WAIT",
    reference_order_type: "WAIT",
    reference_trigger: "Confirmation required",
    reference_entry: 0,
    reference_sl: 0,
    reference_tp1: 0,
    reference_tp2: 0,
    reference_tp3: 0,
    reference_rr: 0,
};

function candidate(id: string, execute: ReturnType<typeof vi.fn>) {
    return {
        model: { id: `model-${id}`, modelCode: `model-code-${id}` },
        provider: {
            id: `provider-${id}`,
            providerCode: id,
            baseUrl: `https://api.${id}.test`,
            timeoutMs: 30000,
        },
        credential: { id: `credential-${id}` },
        decryptedSecret: `secret-${id}`,
        adapter: { providerCode: id, execute, testCredential: vi.fn() },
    };
}

describe("AI gateway provider router", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fails over when the primary provider returns an invalid schema", async () => {
        const primaryExecute = vi
            .fn()
            .mockResolvedValue({ ok: true, data: { action: "SELL" } });
        const fallbackExecute = vi
            .fn()
            .mockResolvedValue({ ok: true, data: validResult });
        (resolveExecutionPlan as any).mockResolvedValue({
            policy: { id: "policy-1", version: 3, timeoutMs: 30000 },
            steps: [
                {
                    kind: "candidate",
                    candidate: candidate("primary", primaryExecute),
                },
                {
                    kind: "candidate",
                    candidate: candidate("fallback", fallbackExecute),
                },
            ],
        });

        const result = await executeAiGateway({
            requestId: "request-1",
            snapshot: {},
            systemPrompt: "Analyze",
        });

        expect(result.ok).toBe(true);
        expect(result.selectedProviderId).toBe("provider-fallback");
        expect(result.attempts).toHaveLength(2);
        expect(result.attempts[0].error_code).toBe("MODEL_RESPONSE_INVALID");
        expect(fallbackExecute).toHaveBeenCalledOnce();
    });

    it("redacts a credential if an adapter includes it in an error", async () => {
        const execute = vi.fn().mockResolvedValue({
            ok: false,
            error_code: "PROVIDER_REQUEST_FAILED",
            message: "authorization: secret-primary",
        });
        (resolveExecutionPlan as any).mockResolvedValue({
            policy: { id: "policy-2", version: 1, timeoutMs: 30000 },
            steps: [
                { kind: "candidate", candidate: candidate("primary", execute) },
            ],
        });

        const result = await executeAiGateway({
            requestId: "request-2",
            snapshot: {},
            systemPrompt: "Analyze",
        });

        expect(result.ok).toBe(false);
        expect(result.message).not.toContain("secret-primary");
        expect(result.attempts[0].errorMessageRedacted).not.toContain(
            "secret-primary"
        );
    });

    it("records an adapter exception without exposing its raw message", async () => {
        const execute = vi
            .fn()
            .mockRejectedValue(new Error("network failed with secret-primary"));
        (resolveExecutionPlan as any).mockResolvedValue({
            policy: { id: "policy-3", version: 1, timeoutMs: 30000 },
            steps: [
                { kind: "candidate", candidate: candidate("primary", execute) },
            ],
        });

        const result = await executeAiGateway({
            requestId: "request-3",
            snapshot: {},
            systemPrompt: "Analyze",
        });

        expect(result.error_code).toBe("PROVIDER_CONNECTION_ERROR");
        expect(result.message).toBe("Provider adapter failed unexpectedly.");
        expect(result.attempts[0].errorMessageRedacted).not.toContain(
            "secret-primary"
        );
    });
});
