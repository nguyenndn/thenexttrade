import { describe, it, expect } from "vitest";
import { getStageForLevel, AdminLevel } from "./types";

describe("Academy Dashboard Helpers & Types", () => {
    it("should correctly map stage names and styles based on level order", () => {
        expect(getStageForLevel(1).name).toBe("The Initiate");
        expect(getStageForLevel(2).name).toBe("The Initiate");
        expect(getStageForLevel(3).name).toBe("The Analyst");
        expect(getStageForLevel(5).name).toBe("The Analyst");
        expect(getStageForLevel(6).name).toBe("The Strategist");
        expect(getStageForLevel(7).name).toBe("The Operator");
        expect(getStageForLevel(8).name).toBe("The Strategist");
        expect(getStageForLevel(9).name).toBe("The Operator");
        expect(getStageForLevel(10).name).toBe("The Operator");
        expect(getStageForLevel(11).name).toBe("The Master");
        expect(getStageForLevel(12).name).toBe("The Master");
    });

    const mockLevels: AdminLevel[] = [
        {
            id: "lvl-1",
            title: "Level 1: Market Foundations",
            description: "Learn the core basics of forex and risk.",
            order: 1,
            accessLevel: "PUBLIC",
            _count: { modules: 2 },
            modules: [
                {
                    id: "mod-1",
                    title: "Trading Concepts",
                    order: 1,
                    quiz: { id: "q-1" },
                    _count: { lessons: 2 },
                    lessons: [
                        {
                            id: "les-1",
                            title: "Pips and Lots",
                            slug: "pips-and-lots",
                            order: 1,
                            status: "published",
                        },
                        {
                            id: "les-2",
                            title: "Spread and Slippage",
                            slug: "spread-slippage",
                            order: 2,
                            status: "published",
                        },
                    ],
                },
                {
                    id: "mod-2",
                    title: "Order Types",
                    order: 2,
                    quiz: null,
                    _count: { lessons: 1 },
                    lessons: [
                        {
                            id: "les-3",
                            title: "Market Orders vs Limit Orders",
                            slug: "market-vs-limit",
                            order: 1,
                            status: "published",
                        },
                    ],
                },
            ],
        },
        {
            id: "lvl-4",
            title: "Level 4: Systematic Scalping",
            description: "Advanced scalping tactics and risk formulas.",
            order: 4,
            accessLevel: "MEMBER",
            _count: { modules: 1 },
            modules: [
                {
                    id: "mod-3",
                    title: "Gold Scalping Core",
                    order: 1,
                    quiz: { id: "q-2" },
                    _count: { lessons: 3 },
                    lessons: [
                        {
                            id: "les-4",
                            title: "Session Open Liquidity",
                            slug: "session-open-liquidity",
                            order: 1,
                            status: "published",
                        },
                        {
                            id: "les-5",
                            title: "Order Flow Delta",
                            slug: "order-flow-delta",
                            order: 2,
                            status: "published",
                        },
                        {
                            id: "les-6",
                            title: "Hard Stop Loss Execution",
                            slug: "hard-sl-execution",
                            order: 3,
                            status: "published",
                        },
                    ],
                },
            ],
        },
    ];

    it("should filter levels by search query across levels, modules, and lessons", () => {
        // Query matching lesson title
        const query1 = "pips".toLowerCase();
        const results1 = mockLevels.filter((l) =>
            l.modules.some((m) =>
                m.lessons.some((les) => les.title.toLowerCase().includes(query1))
            )
        );
        expect(results1.length).toBe(1);
        expect(results1[0].id).toBe("lvl-1");

        // Query matching module title
        const query2 = "scalping".toLowerCase();
        const results2 = mockLevels.filter(
            (l) =>
                l.title.toLowerCase().includes(query2) ||
                l.modules.some((m) => m.title.toLowerCase().includes(query2))
        );
        expect(results2.length).toBe(1);
        expect(results2[0].id).toBe("lvl-4");
    });

    it("should filter levels by access level correctly", () => {
        const publicOnly = mockLevels.filter(
            (l) => (l.accessLevel || "PUBLIC").toUpperCase() === "PUBLIC"
        );
        expect(publicOnly.length).toBe(1);
        expect(publicOnly[0].id).toBe("lvl-1");

        const memberOnly = mockLevels.filter(
            (l) => (l.accessLevel || "PUBLIC").toUpperCase() !== "PUBLIC"
        );
        expect(memberOnly.length).toBe(1);
        expect(memberOnly[0].id).toBe("lvl-4");
    });

    it("should calculate aggregate stats accurately", () => {
        let totalLessons = 0;
        let totalQuizzes = 0;
        mockLevels.forEach((l) => {
            l.modules.forEach((m) => {
                totalLessons += m.lessons.length;
                if (m.quiz?.id) totalQuizzes += 1;
            });
        });
        expect(totalLessons).toBe(6);
        expect(totalQuizzes).toBe(2);
    });
});
