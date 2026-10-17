"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { CompetitionStatus } from "@prisma/client";

async function verifyAdmin() {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (!profile || profile.role !== "ADMIN") {
        throw new Error("Forbidden: Admin access required");
    }

    return user;
}

export interface CompetitionPrizeItem {
    rank: number;
    reward: string;
    title?: string;
}

export interface CreateCompetitionInput {
    title: string;
    slug?: string;
    description?: string;
    rules?: string;
    status?: CompetitionStatus;
    startDate: string; // ISO string
    endDate: string; // ISO string
    prizePool: number;
    prizes?: CompetitionPrizeItem[];
    minTrades?: number;
    maxDrawdown?: number;
    eligibleBrokers?: string;
    scoringMetric?: "currency" | "percentage";
}

export async function fetchAdminCompetitions() {
    await verifyAdmin();

    const competitions = await prisma.competition.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { participants: true },
            },
        },
    });

    const totalCompetitions = competitions.length;
    const activeCount = competitions.filter((c) => c.status === "ACTIVE").length;
    const upcomingCount = competitions.filter((c) => c.status === "UPCOMING").length;
    const totalPrizePool = competitions.reduce((sum, c) => sum + c.prizePool, 0);
    const totalParticipants = competitions.reduce(
        (sum, c) => sum + c._count.participants,
        0
    );

    return {
        competitions,
        stats: {
            totalCompetitions,
            activeCount,
            upcomingCount,
            totalPrizePool,
            totalParticipants,
        },
    };
}

export async function createCompetition(input: CreateCompetitionInput) {
    try {
        await verifyAdmin();

        if (!input.title || !input.startDate || !input.endDate) {
            return { error: "Title, start date, and end date are required." };
        }

        const start = new Date(input.startDate);
        const end = new Date(input.endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return { error: "Invalid start or end date." };
        }

        if (end <= start) {
            return { error: "End date must be after start date." };
        }

        const slug =
            input.slug?.trim() ||
            input.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`;

        const defaultPrizes: CompetitionPrizeItem[] = [
            { rank: 1, reward: `$${Math.round(input.prizePool * 0.5)}`, title: "Champion" },
            { rank: 2, reward: `$${Math.round(input.prizePool * 0.3)}`, title: "Runner-up" },
            { rank: 3, reward: `$${Math.round(input.prizePool * 0.2)}`, title: "Podium" },
        ];

        const created = await prisma.competition.create({
            data: {
                title: input.title,
                slug,
                description: input.description || null,
                rules: input.rules || null,
                status: input.status || "DRAFT",
                startDate: start,
                endDate: end,
                prizePool: Number(input.prizePool) || 0,
                prizes: (input.prizes && input.prizes.length > 0
                    ? input.prizes
                    : defaultPrizes) as any,
                minTrades: Number(input.minTrades) || 10,
                maxDrawdown: input.maxDrawdown !== undefined ? Number(input.maxDrawdown) : 10.0,
                eligibleBrokers: input.eligibleBrokers || "ALL",
                scoringMetric: input.scoringMetric || "currency",
            },
        });

        revalidatePath("/admin/competitions");
        revalidatePath("/dashboard/leaderboard");

        return { success: true, competition: created };
    } catch (error: any) {
        console.error("createCompetition error:", error);
        return { error: error.message || "Failed to create competition." };
    }
}

export async function updateCompetition(
    id: string,
    input: Partial<CreateCompetitionInput>
) {
    try {
        await verifyAdmin();

        const existing = await prisma.competition.findUnique({
            where: { id },
            select: { startDate: true, endDate: true },
        });
        if (!existing) {
            return { error: "Competition not found." };
        }

        const data: any = {};
        if (input.title) data.title = input.title;
        if (input.slug) data.slug = input.slug;
        if (input.description !== undefined) data.description = input.description;
        if (input.rules !== undefined) data.rules = input.rules;
        if (input.status) data.status = input.status;
        if (input.startDate) {
            const parsedStart = new Date(input.startDate);
            if (Number.isNaN(parsedStart.getTime())) {
                return { error: "Invalid start date." };
            }
            data.startDate = parsedStart;
        }
        if (input.endDate) {
            const parsedEnd = new Date(input.endDate);
            if (Number.isNaN(parsedEnd.getTime())) {
                return { error: "Invalid end date." };
            }
            data.endDate = parsedEnd;
        }

        const effectiveStart: Date = data.startDate ?? existing.startDate;
        const effectiveEnd: Date = data.endDate ?? existing.endDate;
        if (effectiveEnd <= effectiveStart) {
            return { error: "End date must be after start date." };
        }

        if (input.prizePool !== undefined) data.prizePool = Number(input.prizePool);
        if (input.prizes) data.prizes = input.prizes;
        if (input.minTrades !== undefined) data.minTrades = Number(input.minTrades);
        if (input.maxDrawdown !== undefined) data.maxDrawdown = Number(input.maxDrawdown);
        if (input.eligibleBrokers !== undefined) data.eligibleBrokers = input.eligibleBrokers;
        if (input.scoringMetric) data.scoringMetric = input.scoringMetric;

        const updated = await prisma.competition.update({
            where: { id },
            data,
        });

        revalidatePath("/admin/competitions");
        revalidatePath("/dashboard/leaderboard");

        return { success: true, competition: updated };
    } catch (error: any) {
        console.error("updateCompetition error:", error);
        return { error: error.message || "Failed to update competition." };
    }
}

export async function toggleCompetitionStatus(
    id: string,
    status: CompetitionStatus
) {
    try {
        await verifyAdmin();

        const updated = await prisma.competition.update({
            where: { id },
            data: { status },
        });

        revalidatePath("/admin/competitions");
        revalidatePath("/dashboard/leaderboard");

        return { success: true, competition: updated };
    } catch (error: any) {
        console.error("toggleCompetitionStatus error:", error);
        return { error: error.message || "Failed to change status." };
    }
}

export async function deleteCompetition(id: string) {
    try {
        await verifyAdmin();

        await prisma.competition.delete({
            where: { id },
        });

        revalidatePath("/admin/competitions");
        revalidatePath("/dashboard/leaderboard");

        return { success: true };
    } catch (error: any) {
        console.error("deleteCompetition error:", error);
        return { error: error.message || "Failed to delete competition." };
    }
}
