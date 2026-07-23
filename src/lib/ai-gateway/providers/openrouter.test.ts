import { describe, expect, it, vi } from "vitest";
import { OpenRouterAdapter } from "./openrouter";

describe("OpenRouter provider adapter", () => {
    it("handles successful execution and parses response content", async () => {
        const mockResponse = {
            id: "gen-12345",
            choices: [
                {
                    message: {
                        content: '{"action":"BUY","entry":2000,"sl":1990,"tp1":2020}',
                    },
                    finish_reason: "stop",
                },
            ],
            usage: {
                prompt_tokens: 150,
                completion_tokens: 45,
            },
        };

        const globalFetch = global.fetch;
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify(mockResponse),
        } as Response);

        const result = await OpenRouterAdapter.execute({
            requestId: "req-test-1",
            baseUrl: "https://openrouter.ai/api/v1/chat/completions",
            decryptedSecret: "test-secret-key",
            systemPrompt: "You are an expert forex trader AI.",
            snapshot: { symbol: "XAUUSD" },
            modelId: "deepseek/deepseek-chat",
            timeoutMs: 5000,
        });

        expect(result.ok).toBe(true);
        expect(result.data).toEqual({
            action: "BUY",
            entry: 2000,
            sl: 1990,
            tp1: 2020,
        });
        expect(result.inputTokens).toBe(150);
        expect(result.outputTokens).toBe(45);
        expect(result.providerRequestId).toBe("gen-12345");

        global.fetch = globalFetch;
    });

    it("handles HTTP 429 Rate Limit error gracefully", async () => {
        const globalFetch = global.fetch;
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            text: async () => "Rate limit exceeded",
        } as Response);

        const result = await OpenRouterAdapter.execute({
            requestId: "req-test-2",
            baseUrl: "https://openrouter.ai/api/v1/chat/completions",
            decryptedSecret: "test-secret-key",
            systemPrompt: "System prompt",
            snapshot: {},
            modelId: "deepseek/deepseek-chat",
            timeoutMs: 5000,
        });

        expect(result.ok).toBe(false);
        expect(result.error_code).toBe("PROVIDER_RATE_LIMIT");

        global.fetch = globalFetch;
    });

    it("handles HTTP 401 Auth Error gracefully", async () => {
        const globalFetch = global.fetch;
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => "Unauthorized API key",
        } as Response);

        const result = await OpenRouterAdapter.execute({
            requestId: "req-test-3",
            baseUrl: "https://openrouter.ai/api/v1/chat/completions",
            decryptedSecret: "invalid-key",
            systemPrompt: "System prompt",
            snapshot: {},
            modelId: "deepseek/deepseek-chat",
            timeoutMs: 5000,
        });

        expect(result.ok).toBe(false);
        expect(result.error_code).toBe("PROVIDER_AUTH_ERROR");

        global.fetch = globalFetch;
    });
});
