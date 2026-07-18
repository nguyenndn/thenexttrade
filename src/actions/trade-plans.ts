"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const tradePlanSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(30),
  type: z.enum(["BUY", "SELL"]).nullable().optional(),
  plannedEntry: z.number().min(0).nullable().optional(),
  plannedStopLoss: z.number().min(0).nullable().optional(),
  plannedTakeProfit: z.number().min(0).nullable().optional(),
  plannedLotSize: z.number().min(0).nullable().optional(),
  riskAmount: z.number().min(0).nullable().optional(),
  setupName: z.string().max(120).nullable().optional(),
  thesis: z.string().nullable().optional(),
  invalidation: z.string().nullable().optional(),
  emotionBefore: z.string().max(50).nullable().optional(),
  confidenceLevel: z.number().int().min(1).max(5).nullable().optional(),
  ruleChecklist: z.any().optional(),
  accountId: z.string().nullable().optional(),
  snapshotData: z.any().optional(),
  snapshotPassed: z.boolean().optional(),
});

export async function getTradePlans() {
  const user = await getAuthUser();
  if (!user) return [];

  return prisma.tradePlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      account: { select: { name: true } },
      journalEntry: true,
    },
  });
}

export async function createTradePlan(data: z.infer<typeof tradePlanSchema>) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = tradePlanSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid trade plan details" };

  try {
    const plan = await prisma.tradePlan.create({
      data: {
        userId: user.id,
        symbol: parsed.data.symbol,
        type: parsed.data.type || null,
        plannedEntry: parsed.data.plannedEntry || null,
        plannedStopLoss: parsed.data.plannedStopLoss || null,
        plannedTakeProfit: parsed.data.plannedTakeProfit || null,
        plannedLotSize: parsed.data.plannedLotSize || null,
        riskAmount: parsed.data.riskAmount || null,
        setupName: parsed.data.setupName || null,
        thesis: parsed.data.thesis || null,
        invalidation: parsed.data.invalidation || null,
        emotionBefore: parsed.data.emotionBefore || null,
        confidenceLevel: parsed.data.confidenceLevel || null,
        ruleChecklist: parsed.data.ruleChecklist || null,
        accountId: parsed.data.accountId || null,
        status: "PLANNED",
        ...(parsed.data.snapshotData && {
          tradeCheckSnapshot: {
            create: {
              userId: user.id,
              snapshotData: parsed.data.snapshotData,
              passed: parsed.data.snapshotPassed || false,
              accountId: parsed.data.accountId || null,
            }
          }
        })
      },
      include: {
        tradeCheckSnapshot: true
      }
    });

    revalidatePath("/dashboard/journal");
    return { success: true, plan };
  } catch (err) {
    console.error("Create trade plan error:", err);
    return { error: "Failed to create trade plan" };
  }
}

export async function updateTradePlanStatus(id: string, status: "PLANNED" | "ACTIVE" | "MATCHED" | "REVIEWED" | "CANCELLED") {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const currentPlan = await prisma.tradePlan.findUnique({
      where: { id, userId: user.id },
      select: { status: true },
    });
    if (!currentPlan) return { error: "Trade plan not found" };

    const currentStatus = currentPlan.status;

    // Define permitted transitions
    const validTransitions: Record<string, string[]> = {
      PLANNED: ["ACTIVE", "CANCELLED", "MATCHED"],
      ACTIVE: ["MATCHED", "CANCELLED", "PLANNED"],
      MATCHED: ["REVIEWED", "PLANNED"],
      REVIEWED: [],
      CANCELLED: ["PLANNED"],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return { error: `Invalid transition from ${currentStatus} to ${status}` };
    }

    const data: any = { status };
    if (status === "ACTIVE") {
      data.openedAt = new Date();
    } else if (status === "CANCELLED") {
      data.cancelledAt = new Date();
    } else if (status === "REVIEWED") {
      data.reviewedAt = new Date();
    } else if (status === "PLANNED") {
      data.openedAt = null;
      data.cancelledAt = null;
      data.reviewedAt = null;
      data.journalEntryId = null;
    }

    const plan = await prisma.tradePlan.update({
      where: { id, userId: user.id },
      data,
    });

    revalidatePath("/dashboard/journal");
    return { success: true, plan };
  } catch (err) {
    console.error("Update trade plan status error:", err);
    return { error: "Failed to update trade plan status" };
  }
}

export async function cancelTradePlan(id: string, reason: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const currentPlan = await prisma.tradePlan.findUnique({
      where: { id, userId: user.id },
      select: { status: true }
    });
    if (!currentPlan) return { error: "Trade plan not found" };

    if (currentPlan.status !== "PLANNED" && currentPlan.status !== "ACTIVE") {
      return { error: `Cannot cancel trade plan in ${currentPlan.status} state` };
    }

    const plan = await prisma.tradePlan.update({
      where: { id, userId: user.id },
      data: {
        status: "CANCELLED",
        invalidation: reason,
        cancelledAt: new Date(),
      },
    });

    revalidatePath("/dashboard/journal");
    return { success: true, plan };
  } catch (err) {
    console.error("Cancel trade plan error:", err);
    return { error: "Failed to cancel trade plan" };
  }
}

export async function linkPlanToTrade(planId: string, journalEntryId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const currentPlan = await prisma.tradePlan.findUnique({
      where: { id: planId, userId: user.id },
      select: { status: true }
    });
    if (!currentPlan) return { error: "Trade plan not found" };

    if (currentPlan.status === "CANCELLED" || currentPlan.status === "REVIEWED") {
      return { error: `Cannot link trade plan in ${currentPlan.status} state` };
    }

    const plan = await prisma.tradePlan.update({
      where: { id: planId, userId: user.id },
      data: {
        journalEntryId,
        status: "MATCHED",
        openedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/journal");
    return { success: true, plan };
  } catch (err) {
    console.error("Link plan to trade error:", err);
    return { error: "Failed to link plan to trade" };
  }
}
