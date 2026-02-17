"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

// ==============================================================================
// TRADING GOALS — Stored in User.settings JSON
// ==============================================================================

export interface TradingGoal {
    id: string;
    type: "weekly" | "monthly";
    metric: "pnl" | "trades" | "winRate" | "maxLoss";
    label: string;
    targetValue: number;
    createdAt: string;
}

interface UserSettings {
    tradingGoals?: TradingGoal[];
    [key: string]: any;
}

function generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Get all trading goals for the current user
 */
export async function getTradingGoals(): Promise<TradingGoal[]> {
    const user = await getAuthUser();
    if (!user) return [];

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true }
    });

    const settings = (dbUser?.settings as UserSettings) || {};
    return settings.tradingGoals || [];
}

/**
 * Create a new trading goal
 */
export async function createTradingGoal(goal: Omit<TradingGoal, "id" | "createdAt">) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true }
    });

    const settings = (dbUser?.settings as UserSettings) || {};
    const goals = settings.tradingGoals || [];

    // Limit to 10 goals
    if (goals.length >= 10) {
        return { error: "Maximum 10 goals allowed" };
    }

    const newGoal: TradingGoal = {
        ...goal,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };

    goals.push(newGoal);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            settings: { ...settings, tradingGoals: goals } as any
        }
    });

    revalidatePath("/dashboard");
    return { success: true, goal: newGoal };
}

/**
 * Delete a trading goal
 */
export async function deleteTradingGoal(goalId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true }
    });

    const settings = (dbUser?.settings as UserSettings) || {};
    const goals = (settings.tradingGoals || []).filter((g: TradingGoal) => g.id !== goalId);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            settings: { ...settings, tradingGoals: goals } as any
        }
    });

    revalidatePath("/dashboard");
    return { success: true };
}

/**
 * Get progress for all goals based on actual trading data
 * Returns goals with their current progress values
 */
export async function getGoalsProgress() {
    const user = await getAuthUser();
    if (!user) return [];

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true }
    });

    const settings = (dbUser?.settings as UserSettings) || {};
    const goals = settings.tradingGoals || [];

    if (goals.length === 0) return [];

    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get trades for both periods in parallel
    const [weeklyTrades, monthlyTrades] = await Promise.all([
        prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                exitDate: { gte: startOfWeek }
            },
            select: { pnl: true, result: true }
        }),
        prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                exitDate: { gte: startOfMonth }
            },
            select: { pnl: true, result: true }
        })
    ]);

    // Calculate metrics
    function calcMetrics(trades: { pnl: number | null; result: string | null }[]) {
        const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const tradeCount = trades.length;
        const winCount = trades.filter(t => t.result === "WIN").length;
        const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
        const maxLoss = trades.reduce((max, t) => {
            const loss = t.pnl && t.pnl < 0 ? Math.abs(t.pnl) : 0;
            return Math.max(max, loss);
        }, 0);
        return { totalPnl, tradeCount, winRate, maxLoss };
    }

    const weeklyMetrics = calcMetrics(weeklyTrades);
    const monthlyMetrics = calcMetrics(monthlyTrades);

    // Map goals to progress
    return goals.map(goal => {
        const metrics = goal.type === "weekly" ? weeklyMetrics : monthlyMetrics;
        let currentValue = 0;

        switch (goal.metric) {
            case "pnl":
                currentValue = metrics.totalPnl;
                break;
            case "trades":
                currentValue = metrics.tradeCount;
                break;
            case "winRate":
                currentValue = metrics.winRate;
                break;
            case "maxLoss":
                currentValue = metrics.maxLoss;
                break;
        }

        const progress = goal.targetValue > 0
            ? Math.min((currentValue / goal.targetValue) * 100, 100)
            : 0;

        return {
            ...goal,
            currentValue,
            progress,
            isCompleted: goal.metric === "maxLoss"
                ? currentValue <= goal.targetValue  // For maxLoss, lower is better
                : currentValue >= goal.targetValue
        };
    });
}
