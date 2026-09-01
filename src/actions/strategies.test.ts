import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Test the Zod schema validation rules for strategies and playbooks
const strategySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional().nullable(),
    rules: z.string().optional().nullable(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
        .optional(),
    isPlaybook: z.boolean().optional(),
    setupType: z.string().max(50).optional().nullable(),
    timeframes: z.array(z.string()).optional(),
    pairs: z.array(z.string()).optional(),
    idealEntry: z.string().optional().nullable(),
    idealStopLoss: z.string().optional().nullable(),
    idealTakeProfit: z.string().optional().nullable(),
    riskRewardMin: z.number().min(0).max(100).optional().nullable(),
    referenceImages: z.array(z.string().url()).max(3).optional(),
});

describe("Strategy & Playbook Schema Validation", () => {
    it("validates a standard strategy", () => {
        const result = strategySchema.safeParse({
            name: "Trend Following",
            description: "Standard pullback strategy",
            color: "#6366F1",
            isPlaybook: false,
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Trend Following");
            expect(result.data.isPlaybook).toBe(false);
        }
    });

    it("validates a complete Playbook setup", () => {
        const playbookData = {
            name: "London Liquidity Sweep",
            description: "Sweep of Asian session high/low followed by M15 FVG retest",
            rules: "1. Asian range formed\n2. London sweeps high\n3. M15 MSS confirmation",
            color: "#00C888",
            isPlaybook: true,
            setupType: "Reversal",
            timeframes: ["H4", "M15"],
            pairs: ["XAUUSD", "EURUSD"],
            idealEntry: "50% FVG after MSS",
            idealStopLoss: "Above sweep candle high + 3 pips",
            idealTakeProfit: "Asian session low",
            riskRewardMin: 3.0,
            referenceImages: [
                "https://pub-6af523b315884a09addb7f94658798ac.r2.dev/playbook/chart1.png",
                "https://pub-6af523b315884a09addb7f94658798ac.r2.dev/playbook/chart2.png",
            ],
        };

        const result = strategySchema.safeParse(playbookData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.isPlaybook).toBe(true);
            expect(result.data.setupType).toBe("Reversal");
            expect(result.data.timeframes).toEqual(["H4", "M15"]);
            expect(result.data.pairs).toEqual(["XAUUSD", "EURUSD"]);
            expect(result.data.riskRewardMin).toBe(3.0);
            expect(result.data.referenceImages?.length).toBe(2);
        }
    });

    it("rejects more than 3 reference images", () => {
        const invalidData = {
            name: "Too Many Images Setup",
            isPlaybook: true,
            referenceImages: [
                "https://pub.dev/img1.png",
                "https://pub.dev/img2.png",
                "https://pub.dev/img3.png",
                "https://pub.dev/img4.png",
            ],
        };

        const result = strategySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it("rejects invalid color hex code", () => {
        const invalidColor = {
            name: "Invalid Color",
            color: "not-a-hex",
        };

        const result = strategySchema.safeParse(invalidColor);
        expect(result.success).toBe(false);
    });
});
