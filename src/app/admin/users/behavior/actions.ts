"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { isAdminRole } from "@/lib/permissions";
import { UserBehaviorSegmentItem } from "@/lib/admin/behavior/types";
import { classifyUser } from "@/lib/admin/behavior/classify.server";
import {
    getBatchProductAdoption,
    getBatchLastActivity,
    computeUserTradingActivity,
} from "@/lib/admin/behavior/activity.server";

export interface GetBehaviorSegmentsParams {
    tab?: "needs-attention" | "value";
    search?: string;
    groupFilter?: string;
    page?: number;
    pageSize?: number;
}

export interface GetBehaviorSegmentsResult {
    success: boolean;
    data?: {
        items: UserBehaviorSegmentItem[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
        metricsSummary: {
            needsAttentionCount: number;
            valueTradersCount: number;
            lossStreakCount: number;
            steadyTradersCount: number;
            registeredNeverTradedCount: number;
        };
    };
    error?: string;
}

export async function getBehaviorSegments(
    params: GetBehaviorSegmentsParams = {}
): Promise<GetBehaviorSegmentsResult> {
    const authUser = await getAuthUser();
    if (!authUser) {
        return { success: false, error: "Unauthorized" };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: authUser.id },
        select: { role: true },
    });

    if (!profile || !isAdminRole(profile.role)) {
        return { success: false, error: "Forbidden: Admin privileges required" };
    }

    try {
        const {
            tab = "needs-attention",
            search = "",
            groupFilter = "ALL",
            page = 1,
            pageSize = 20,
        } = params;

        const whereUser: any = {};
        if (search.trim()) {
            whereUser.OR = [
                { name: { contains: search.trim(), mode: "insensitive" } },
                { email: { contains: search.trim(), mode: "insensitive" } },
            ];
        }

        // Fetch up to 200 recent active users to classify
        const users = await prisma.user.findMany({
            where: whereUser,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                tradingAccounts: {
                    select: {
                        id: true,
                        accountType: true,
                        server: true,
                        status: true,
                        broker: true,
                    },
                },
                _count: {
                    select: {
                        journalEntries: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        const userIds = users.map((u) => u.id);
        if (userIds.length === 0) {
            return {
                success: true,
                data: {
                    items: [],
                    totalCount: 0,
                    page: 1,
                    pageSize,
                    totalPages: 0,
                    metricsSummary: {
                        needsAttentionCount: 0,
                        valueTradersCount: 0,
                        lossStreakCount: 0,
                        steadyTradersCount: 0,
                        registeredNeverTradedCount: 0,
                    },
                },
            };
        }

        // Parallel batch data retrieval
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const [recentJournals, activeSignals, productAdoptions, lastActivities] =
            await Promise.all([
                prisma.journalEntry.findMany({
                    where: {
                        userId: { in: userIds },
                        status: "CLOSED",
                        entryDate: { gte: sixtyDaysAgo },
                    },
                    select: {
                        id: true,
                        userId: true,
                        status: true,
                        result: true,
                        pnl: true,
                        entryDate: true,
                        createdAt: true,
                        syncSource: true,
                        lotSize: true,
                    },
                    orderBy: { entryDate: "desc" },
                }),
                prisma.traderSignal.findMany({
                    where: {
                        userId: { in: userIds },
                        status: "ACTIVE",
                    },
                    select: {
                        id: true,
                        userId: true,
                        signalType: true,
                        severity: true,
                        title: true,
                        summary: true,
                    },
                }),
                getBatchProductAdoption(userIds),
                getBatchLastActivity(userIds),
            ]);

        // Group journals and signals by userId
        const journalsByUser = new Map<string, typeof recentJournals>();
        for (const j of recentJournals) {
            if (!journalsByUser.has(j.userId)) {
                journalsByUser.set(j.userId, []);
            }
            journalsByUser.get(j.userId)!.push(j);
        }

        const signalsByUser = new Map<string, typeof activeSignals>();
        for (const s of activeSignals) {
            if (!signalsByUser.has(s.userId)) {
                signalsByUser.set(s.userId, []);
            }
            signalsByUser.get(s.userId)!.push(s);
        }

        // Classify each user
        const allItems: UserBehaviorSegmentItem[] = users.map((user) => {
            const userJournals = journalsByUser.get(user.id) || [];
            const userSignals = signalsByUser.get(user.id) || [];
            const adoption = productAdoptions.get(user.id) || { count: 0, features: [] };
            const lastActivity = lastActivities.get(user.id) || null;

            const classification = classifyUser({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                },
                tradingAccounts: user.tradingAccounts,
                journalEntries: userJournals,
                totalJournalCount: user._count.journalEntries,
                activeSignals: userSignals,
                productAdoptionCount: adoption.count,
                productAdoptionFeatures: adoption.features,
            });

            return {
                userId: user.id,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    createdAt: user.createdAt,
                },
                classification,
                lastActivityAt: lastActivity,
            };
        });

        // Summary counts
        let needsAttentionCount = 0;
        let valueTradersCount = 0;
        let lossStreakCount = 0;
        let steadyTradersCount = 0;
        let registeredNeverTradedCount = 0;

        for (const item of allItems) {
            const c = item.classification;
            if (c.severity === "CRITICAL" || c.severity === "ATTENTION") needsAttentionCount++;
            if (c.metrics.hasLiveAccount && c.metrics.activeDays30 >= 4) valueTradersCount++;
            if (c.group === "LOSING_STREAK") lossStreakCount++;
            if (c.group === "TRADING_WELL") steadyTradersCount++;
            if (c.group === "REGISTERED_NEVER_TRADED") registeredNeverTradedCount++;
        }

        // Filter by group if specified
        let filteredItems = allItems;
        if (groupFilter !== "ALL") {
            filteredItems = filteredItems.filter(
                (item) => item.classification.group === groupFilter
            );
        }

        // Sort based on selected Tab
        if (tab === "needs-attention") {
            // Sort by urgency hierarchy:
            // 1. Loss streak >= 5 + 14d inactivity (CRITICAL)
            // 2. Technical sync error (SYNC_STALE, ACCOUNT_NEVER_SYNCED)
            // 3. Loss streak 3-4 (ATTENTION)
            // 4. Registered never traded (ATTENTION)
            // 5. Other HIGH signals
            // 6. Others
            const getUrgencyScore = (item: UserBehaviorSegmentItem): number => {
                const c = item.classification;
                if (c.severity === "CRITICAL") return 100;
                if (c.primarySignal === "SYNC_STALE" || c.primarySignal === "ACCOUNT_NEVER_SYNCED") return 80;
                if (c.group === "LOSING_STREAK") return 70;
                if (c.group === "REGISTERED_NEVER_TRADED") return 60;
                if (c.severity === "ATTENTION") return 50;
                if (c.severity === "MONITOR") return 30;
                return 10;
            };

            filteredItems.sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
        } else {
            // Tab B - Value:
            // Sắp xếp theo Axis 1 (thật sự giao dịch) rồi Axis 2 (nhịp độ activeDays30)
            filteredItems.sort((a, b) => {
                const aLive = a.classification.metrics.hasLiveAccount ? 1 : 0;
                const bLive = b.classification.metrics.hasLiveAccount ? 1 : 0;
                if (bLive !== aLive) return bLive - aLive;

                const aDays = a.classification.metrics.activeDays30;
                const bDays = b.classification.metrics.activeDays30;
                if (bDays !== aDays) return bDays - aDays;

                return b.classification.metrics.closedTrades30 - a.classification.metrics.closedTrades30;
            });
        }

        const totalCount = filteredItems.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

        return {
            success: true,
            data: {
                items: paginatedItems,
                totalCount,
                page,
                pageSize,
                totalPages,
                metricsSummary: {
                    needsAttentionCount,
                    valueTradersCount,
                    lossStreakCount,
                    steadyTradersCount,
                    registeredNeverTradedCount,
                },
            },
        };
    } catch (err: any) {
        console.error("Failed to get behavior segments:", err);
        return { success: false, error: err.message || "Failed to load behavior segments" };
    }
}
