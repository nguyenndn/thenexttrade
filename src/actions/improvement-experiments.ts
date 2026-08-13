"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { captureExperimentBaseline } from "@/lib/experiments/baseline.server";
import { evaluateExperimentOutcome } from "@/lib/experiments/evaluate.server";
import { CreateExperimentInput } from "@/lib/experiments/types";
import { revalidatePath } from "next/cache";

export async function createAndAcceptExperiment(input: CreateExperimentInput) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    try {
        const experiment = await prisma.$transaction(async (tx) => {
            // Verify ownership of accountId if provided
            if (input.accountId) {
                const account = await tx.tradingAccount.findFirst({
                    where: { id: input.accountId, userId: user.id },
                });
                if (!account) throw new Error("Invalid or unauthorized trading account");
            }

            // Verify ownership of sourceInsightId if provided
            if (input.sourceInsightId) {
                const insight = await tx.traderInsightSnapshot.findFirst({
                    where: { id: input.sourceInsightId, userId: user.id },
                });
                if (!insight) throw new Error("Invalid or unauthorized insight snapshot");
            }

            // Verify ownership of coachActionPlanId if provided
            if (input.coachActionPlanId) {
                const plan = await tx.coachActionPlan.findFirst({
                    where: { id: input.coachActionPlanId, userId: user.id },
                });
                if (!plan) throw new Error("Invalid or unauthorized coach action plan");
            }

            // Verify ownership of coachPlanItemId if provided and check match with planId
            if (input.coachPlanItemId) {
                const item = await tx.coachActionPlanItem.findFirst({
                    where: {
                        id: input.coachPlanItemId,
                        plan: { userId: user.id },
                    },
                });
                if (!item) throw new Error("Invalid or unauthorized coach plan item");
                if (input.coachActionPlanId && item.planId !== input.coachActionPlanId) {
                    throw new Error("Coach plan item does not belong to the specified coach plan");
                }
            }

            // Check if an active/ready experiment already exists for this user/account scope
            const existingActive = await tx.improvementExperiment.findFirst({
                where: {
                    userId: user.id,
                    accountId: input.accountId || null,
                    status: { in: ["ACTIVE", "READY_FOR_REVIEW"] },
                },
            });

            if (existingActive) {
                throw new Error("You already have an active experiment in this account scope. Complete or cancel it before starting a new one.");
            }

            // Capture baseline
            const baseline = await captureExperimentBaseline(user.id, input.accountId);

            const hypothesisText = input.hypothesis || input.instruction || `Testing trade execution consistency for ${input.title}`;
            const instructionText = input.instruction || input.hypothesis || `Follow your trading rules for the next ${input.targetTradeCount || 10} trades.`;

            return await tx.improvementExperiment.create({
                data: {
                    userId: user.id,
                    accountId: input.accountId || null,
                    sourceInsightId: input.sourceInsightId || null,
                    coachActionPlanId: input.coachActionPlanId || null,
                    coachPlanItemId: input.coachPlanItemId || null,
                    actionType: input.actionType,
                    title: input.title,
                    hypothesis: hypothesisText,
                    instruction: instructionText,
                    primaryMetric: input.primaryMetric || "WIN_RATE",
                    targetTradeCount: input.targetTradeCount || 10,
                    baseline: baseline as any,
                    status: "ACTIVE",
                    acceptedAt: new Date(),
                },
            });
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard/intelligence");
        return { success: true, experimentId: experiment.id };
    } catch (err: any) {
        if (err?.code === "P2002") {
            throw new Error("You already have an active experiment in this account scope. Complete or cancel it before starting a new one.");
        }
        throw err;
    }
}

export async function cancelExperiment(experimentId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const experiment = await prisma.improvementExperiment.findUnique({
        where: { id: experimentId },
    });

    if (!experiment || experiment.userId !== user.id) {
        throw new Error("Experiment not found or unauthorized");
    }

    if (experiment.status !== "ACTIVE" && experiment.status !== "READY_FOR_REVIEW") {
        throw new Error("Only active or review-ready experiments can be cancelled");
    }

    await prisma.improvementExperiment.update({
        where: { id: experimentId },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    return { success: true };
}

export async function reviewAndCompleteExperiment(experimentId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const experiment = await prisma.improvementExperiment.findUnique({
        where: { id: experimentId },
    });

    if (!experiment || experiment.userId !== user.id) {
        throw new Error("Experiment not found or unauthorized");
    }

    if (experiment.status !== "READY_FOR_REVIEW") {
        throw new Error("Experiment target trade sample is not reached yet");
    }

    const outcome = await evaluateExperimentOutcome(experimentId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    return { success: true, outcome };
}

export async function addExperimentAsTradingRule(experimentId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const experiment = await prisma.improvementExperiment.findUnique({
        where: { id: experimentId },
    });

    if (!experiment || experiment.userId !== user.id) {
        throw new Error("Experiment not found or unauthorized");
    }

    if (experiment.status !== "COMPLETED") {
        throw new Error("Only completed experiments can be promoted to Trading Rules");
    }

    if (experiment.outcome !== "IMPROVED") {
        throw new Error("Only experiments with improved performance outcome can be promoted to Trading Rules");
    }

    // Dedupe check for rule with same title
    const existingRule = await prisma.tradingRule.findFirst({
        where: {
            userId: user.id,
            title: experiment.title,
        },
    });

    if (existingRule) {
        return { success: true, ruleId: existingRule.id, created: false };
    }

    const newRule = await prisma.tradingRule.create({
        data: {
            userId: user.id,
            accountId: experiment.accountId,
            title: experiment.title,
            description: experiment.instruction,
            category: "RISK_EXECUTION",
            severity: "MEDIUM",
            isActive: true,
        },
    });

    revalidatePath("/dashboard/rules");
    return { success: true, ruleId: newRule.id, created: true };
}
