import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    validateImmediatePlan,
    validateReferencePlan,
} from "./safety-validator";
import {
    AiTradingResultSchema,
    API_RESPONSE_SCHEMA_VERSION,
    SNAPSHOT_SCHEMA_VERSION,
    CLIENT_REQUEST_SCHEMA_VERSION,
} from "./result-schema";
import { buildSystemPrompt } from "./prompt-builder";

// Mocks for DB and Adapters can be added here if needed for integration tests
// For now, testing pure functions first

describe("AI Gateway - Safety Validator", () => {
    it("rejects BUY if TP2 <= TP1", () => {
        const res = validateImmediatePlan(
            {
                action: "BUY",
                entry: 100,
                sl: 90,
                tp1: 110,
                tp2: 105,
                tp3: 0,
                rr: 1,
                confidence: 90,
                market_analysis: "",
                short_term_trend: "",
                price_forecast: "",
                reason: "",
                invalidation: "",
                risk_note: "",
                reference_action: "WAIT",
                reference_order_type: "WAIT",
                reference_trigger: "",
                reference_entry: 0,
                reference_sl: 0,
                reference_tp1: 0,
                reference_tp2: 0,
                reference_tp3: 0,
                reference_rr: 0,
            },
            99
        );
        expect(res.ok).toBe(false);
    });

    it("rejects SELL if TP2 >= TP1", () => {
        const res = validateImmediatePlan(
            {
                action: "SELL",
                entry: 100,
                sl: 110,
                tp1: 90,
                tp2: 95,
                tp3: 0,
                rr: 1,
                confidence: 90,
                market_analysis: "",
                short_term_trend: "",
                price_forecast: "",
                reason: "",
                invalidation: "",
                risk_note: "",
                reference_action: "WAIT",
                reference_order_type: "WAIT",
                reference_trigger: "",
                reference_entry: 0,
                reference_sl: 0,
                reference_tp1: 0,
                reference_tp2: 0,
                reference_tp3: 0,
                reference_rr: 0,
            },
            101
        );
        expect(res.ok).toBe(false);
    });

    it("enforces WAIT prices = 0", () => {
        const res = validateImmediatePlan(
            {
                action: "WAIT",
                entry: 100,
                sl: 0,
                tp1: 0,
                tp2: 0,
                tp3: 0,
                rr: 0,
                confidence: 90,
                market_analysis: "",
                short_term_trend: "",
                price_forecast: "",
                reason: "",
                invalidation: "",
                risk_note: "",
                reference_action: "WAIT",
                reference_order_type: "WAIT",
                reference_trigger: "",
                reference_entry: 0,
                reference_sl: 0,
                reference_tp1: 0,
                reference_tp2: 0,
                reference_tp3: 0,
                reference_rr: 0,
            },
            100
        );
        expect(res.ok).toBe(false);
    });

    it("validates Reference WAIT prices = 0", () => {
        const res = validateReferencePlan(
            {
                action: "WAIT",
                entry: 0,
                sl: 0,
                tp1: 0,
                tp2: 0,
                tp3: 0,
                rr: 0,
                confidence: 90,
                market_analysis: "",
                short_term_trend: "",
                price_forecast: "",
                reason: "",
                invalidation: "",
                risk_note: "",
                reference_action: "WAIT",
                reference_order_type: "WAIT",
                reference_trigger: "",
                reference_entry: 100,
                reference_sl: 0,
                reference_tp1: 0,
                reference_tp2: 0,
                reference_tp3: 0,
                reference_rr: 0,
            },
            100
        );
        expect(res.ok).toBe(false);
    });
});

describe("AI Gateway - Result Schema", () => {
    it("exposes correct schema versions", () => {
        expect(API_RESPONSE_SCHEMA_VERSION).toBe("1.0");
        expect(SNAPSHOT_SCHEMA_VERSION).toBe("1.1");
        expect(CLIENT_REQUEST_SCHEMA_VERSION).toBe("1.1");
    });

    it("validates a valid response payload", () => {
        const raw = {
            action: "BUY",
            confidence: 85,
            market_analysis: "test",
            short_term_trend: "test",
            price_forecast: "test",
            reason: "test",
            invalidation: "test",
            risk_note: "test",
            entry: 100,
            sl: 90,
            tp1: 110,
            tp2: 120,
            tp3: 0,
            rr: 1,
            reference_action: "WAIT",
            reference_order_type: "WAIT",
            reference_trigger: "test",
            reference_entry: 0,
            reference_sl: 0,
            reference_tp1: 0,
            reference_tp2: 0,
            reference_tp3: 0,
            reference_rr: 0,
        };
        const parsed = AiTradingResultSchema.safeParse(raw);
        expect(parsed.success).toBe(true);
    });
});

describe("AI Gateway - Prompt Builder", () => {
    it("builds system prompt with version", () => {
        const prompt = buildSystemPrompt();
        expect(prompt).toContain(
            "You are an elite, no-nonsense GoldScalperNinja AI Analyst for MT5"
        );
    });
});
