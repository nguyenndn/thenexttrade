import { describe, it, expect, vi } from "vitest";
import { generateWeeklyActionPlan } from "./weekly-action-plan.server";

// Mock the AI Engine
vi.mock("./ai-coach-engine.server", () => ({
    generateWeeklyAIReview: vi.fn().mockResolvedValue({
        keepDoing: "Focusing on A+ setups in London session",
        fixNext: "Moving stop loss to break even too early",
        nextActions: [
            {
                label: "Wait for candle close before touching SL",
                detail: "Detail",
            },
            {
                label: "Wait for candle close before touching SL",
                detail: "Detail",
            },
            { label: "AI Action 3", detail: "Detail" },
            { label: "AI Action 4", detail: "Detail" },
        ],
    }),
}));

vi.mock("./lesson-recommendations.server", () => ({
    getLearningRecommendations: vi.fn().mockResolvedValue([]),
}));

vi.mock("./signal-engine.server", () => ({
    computeTraderSignals: vi.fn().mockResolvedValue([]),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: vi.fn().mockImplementation(async (cb) => {
            return await cb({
                coachActionPlan: {
                    upsert: vi.fn().mockImplementation((args) =>
                        Promise.resolve({
                            id: "mock-plan-id",
                            ...args.create,
                        })
                    ),
                },
                coachActionPlanItem: {
                    findMany: vi.fn().mockResolvedValue([]),
                    upsert: vi.fn(),
                    deleteMany: vi.fn(),
                },
            });
        }),
        journalEntry: {
            findMany: vi.fn().mockResolvedValue([
                { pnl: 50, status: "CLOSED", mistakes: ["Moved SL too early"] },
                { pnl: -20, status: "CLOSED", mistakes: [] },
            ]),
            count: vi.fn().mockResolvedValue(2),
        },
        tradingReport: {
            // generateWeeklyActionPlan scopes the report lookup by ownership
            // (findFirst with { id, userId }), so the mock must stub findFirst.
            findFirst: vi.fn().mockResolvedValue({
                id: "acc-1",
                type: "WEEKLY",
                netPnL: 30,
                totalTrades: 2,
                winRate: 50,
                profitFactor: 1.5,
            }),
        },
        tradingAccount: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        userProgress: {
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
        },
        tradingRule: {
            count: vi.fn().mockResolvedValue(0),
        },
        tradeRuleCheck: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        tradePlan: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        coachActionPlan: {
            upsert: vi.fn(),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
    },
}));

describe("Weekly Action Plan Generator", () => {
    it("should generate a plan and integrate AI insights with a limit of 3 actions", async () => {
        const plan = await generateWeeklyActionPlan("user-1", "acc-1");

        expect(plan.keepDoing).toContain(
            "Focusing on A+ setups in London session"
        );
        expect(plan.fixNext).toContain(
            "Moving stop loss to break even too early"
        );

        // Test action limit (max 3)
        const nextActions = plan.nextActions as any[];
        expect(nextActions.length).toBeLessThanOrEqual(3);
        expect(nextActions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "Wait for candle close before touching SL",
                }),
            ])
        );
        expect(
            new Set(
                nextActions.map((action) => `${action.label}|${action.detail}`)
            ).size
        ).toBe(nextActions.length);
        expect(plan.status).toBe("ACTIVE");
    });
});
