import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerCoachNotifications } from "./coach-notifications.server";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        traderSignal: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
        traderInsightSnapshot: {
            findFirst: vi.fn(),
        },
        improvementExperiment: {
            findMany: vi.fn(),
        },
        notification: {
            upsert: vi.fn(),
        },
    },
}));

describe("triggerCoachNotifications", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should dispatch notification for active trader signals and set actionType to OPEN_COACH_PLAN", async () => {
        const mockUserId = "user-123";
        (prisma.traderSignal.findMany as any).mockResolvedValue([
            {
                id: "sig-1",
                signalType: "LOSS_STREAK",
                title: "3-Trade Loss Streak Detected",
                summary: "You recently hit a streak of 3 consecutive losses.",
                severity: "HIGH",
                actionHref: "/dashboard/academy",
                metadata: {},
            },
        ]);
        (prisma.traderInsightSnapshot.findFirst as any).mockResolvedValue(null);
        (prisma.improvementExperiment.findMany as any).mockResolvedValue([]);
        (prisma.notification.upsert as any).mockResolvedValue({ id: "notif-1" });
        (prisma.traderSignal.update as any).mockResolvedValue({ id: "sig-1" });

        const count = await triggerCoachNotifications(mockUserId);

        expect(count).toBe(1);
        expect(prisma.notification.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    userId_dedupeKey: {
                        userId: mockUserId,
                        dedupeKey: "SIGNAL:LOSS_STREAK:sig-1",
                    },
                },
                create: expect.objectContaining({
                    userId: mockUserId,
                    type: "FEATURE_UPDATE",
                    title: "Coach Alert: 3-Trade Loss Streak Detected",
                    message: "You recently hit a streak of 3 consecutive losses.",
                    priority: "HIGH",
                    metadata: {
                        signalId: "sig-1",
                        signalType: "LOSS_STREAK",
                        actionType: "OPEN_COACH_PLAN",
                    },
                }),
            })
        );
        expect(prisma.traderSignal.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "sig-1" },
            })
        );
    });

    it("should respect cooldown period for signals already notified", async () => {
        const mockUserId = "user-123";
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        (prisma.traderSignal.findMany as any).mockResolvedValue([
            {
                id: "sig-2",
                signalType: "LOSS_STREAK",
                title: "3-Trade Loss Streak Detected",
                summary: "You recently hit a streak of 3 consecutive losses.",
                severity: "HIGH",
                metadata: { notificationSentAt: oneHourAgo }, // Cooldown is 24h
            },
        ]);
        (prisma.traderInsightSnapshot.findFirst as any).mockResolvedValue(null);
        (prisma.improvementExperiment.findMany as any).mockResolvedValue([]);

        const count = await triggerCoachNotifications(mockUserId);

        expect(count).toBe(0);
        expect(prisma.notification.upsert).not.toHaveBeenCalled();
    });

    it("should dispatch notification for First Insight / Actionable Pattern snapshot", async () => {
        const mockUserId = "user-123";
        (prisma.traderSignal.findMany as any).mockResolvedValue([]);
        (prisma.traderInsightSnapshot.findFirst as any).mockResolvedValue({
            id: "insight-1",
            fingerprint: "WEAK_SESSION_DAY_SYMBOL:XAUUSD",
            title: "Actionable Pattern Identified for XAUUSD",
            summary: "Based on 12 closed trades, XAUUSD accounts for 85% of volume.",
        });
        (prisma.improvementExperiment.findMany as any).mockResolvedValue([]);
        (prisma.notification.upsert as any).mockResolvedValue({ id: "notif-insight" });

        const count = await triggerCoachNotifications(mockUserId);

        expect(count).toBe(1);
        expect(prisma.notification.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    userId_dedupeKey: {
                        userId: mockUserId,
                        dedupeKey: "COACH_INSIGHT:user-123:WEAK_SESSION_DAY_SYMBOL:XAUUSD",
                    },
                },
                create: expect.objectContaining({
                    userId: mockUserId,
                    type: "FEATURE_UPDATE",
                    title: "Coach Plan: Actionable Pattern Identified for XAUUSD",
                    message: "Based on 12 closed trades, XAUUSD accounts for 85% of volume.",
                    link: "/dashboard?action=coach-plan",
                    metadata: {
                        insightId: "insight-1",
                        fingerprint: "WEAK_SESSION_DAY_SYMBOL:XAUUSD",
                        actionType: "OPEN_COACH_PLAN",
                    },
                }),
            })
        );
    });

    it("should dispatch notification for Review Ready Improvement Experiments", async () => {
        const mockUserId = "user-123";
        (prisma.traderSignal.findMany as any).mockResolvedValue([]);
        (prisma.traderInsightSnapshot.findFirst as any).mockResolvedValue(null);
        (prisma.improvementExperiment.findMany as any).mockResolvedValue([
            {
                id: "exp-1",
                title: "Risk Execution Discipline",
                targetTradeCount: 10,
            },
        ]);
        (prisma.notification.upsert as any).mockResolvedValue({ id: "notif-exp" });

        const count = await triggerCoachNotifications(mockUserId);

        expect(count).toBe(1);
        expect(prisma.notification.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    userId_dedupeKey: {
                        userId: mockUserId,
                        dedupeKey: "COACH_EXPERIMENT:user-123:exp-1",
                    },
                },
                create: expect.objectContaining({
                    userId: mockUserId,
                    type: "FEATURE_UPDATE",
                    title: 'Coach Plan: Review your "Risk Execution Discipline" results',
                    link: "/dashboard/reports?type=experiments",
                    metadata: {
                        experimentId: "exp-1",
                        actionType: "NAVIGATE",
                    },
                }),
            })
        );
    });
});
