import { describe, it, expect } from "vitest";
import { z } from "zod";
import { RULE_CATEGORIES, RULE_SEVERITIES } from "@/lib/strategies/playbook-presets";

const strategyRuleItemSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3).max(140),
    description: z.string().max(1000).optional().nullable(),
    category: z.enum(RULE_CATEGORIES).default("ENTRY"),
    severity: z.enum(RULE_SEVERITIES).default("HIGH"),
    isActive: z.boolean().optional().default(true),
});

// Test the Zod schema validation rules for strategies and playbooks
const strategySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional().nullable(),
    rules: z.string().optional().nullable(),
    ruleItems: z.array(strategyRuleItemSchema).max(30).optional(),
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

    it("validates structured ruleItems attached directly to a strategy", () => {
        const result = strategySchema.safeParse({
            name: "NY Killzone Sweep",
            color: "#00C888",
            isPlaybook: true,
            ruleItems: [
                {
                    title: "Sweep of London high/low before 09:30 NY",
                    category: "SESSION",
                    severity: "HIGH",
                },
                {
                    title: "Hard stop-loss beyond sweep candle extreme",
                    category: "RISK",
                    severity: "HIGH",
                },
            ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.ruleItems).toHaveLength(2);
            expect(result.data.ruleItems?.[0].category).toBe("SESSION");
        }
    });
});
