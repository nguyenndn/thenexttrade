"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

export type UnifiedSyncType = "CLOUD_SYNC";

export interface UnifiedSyncItem {
    id: string;
    type: UnifiedSyncType;
    user: {
        id: string;
        email: string | null;
        name: string | null;
        image?: string | null;
        telegramId?: string | null;
    };
    account: {
        id?: string | null;
        accountNumber: string;
        broker: string;
        server?: string | null;
        balance?: number | null;
        currency?: string | null;
        hasSavedPassword?: boolean;
    };
    status: string;
    unifiedStatus: "QUEUE" | "COMPLETED" | "FAILED";
    createdAt: string;
    updatedAt?: string;
    cloudJob?: {
        mode?: string | null;
        rangeFrom?: string | null;
        rangeTo?: string | null;
        message?: string | null;
        workerId?: string | null;
        progressPercent?: number;
        ordersReceived?: number;
        dealsReceived?: number;
        errorCode?: string | null;
        errorMessage?: string | null;
        completedAt?: string | null;
    };
}

export interface SyncRequestFilterParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateRange?: string;
}

export async function getAdminSyncRequests(params: SyncRequestFilterParams = {}) {
    const user = await getAuthUser();
    if (!user) {
        return {
            success: false,
            error: "Unauthorized",
            items: [],
            total: 0,
            stats: {
                totalAll: 0,
                completedCount: 0,
                failedCount: 0,
                queueCount: 0,
                cloudTotal: 0,
                successRate: "100.0",
            },
            page: 1,
            limit: 20,
            totalPages: 1,
        };
    }

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return {
            success: false,
            error: "Forbidden: Admin access required",
            items: [],
            total: 0,
            stats: {
                totalAll: 0,
                completedCount: 0,
                failedCount: 0,
                queueCount: 0,
                cloudTotal: 0,
                successRate: "100.0",
            },
            page: 1,
            limit: 20,
            totalPages: 1,
        };
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(5, Number(params.limit) || 20));
    const skip = (page - 1) * limit;
    const statusFilter = params.status || "ALL";

    const dateWhere: Record<string, unknown> = {};
    if (params.dateRange && params.dateRange !== "all") {
        const now = new Date();
        if (params.dateRange === "today") {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateWhere.createdAt = { gte: startOfToday };
        } else if (params.dateRange === "7d") {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateWhere.createdAt = { gte: sevenDaysAgo };
        } else if (params.dateRange === "30d") {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateWhere.createdAt = { gte: thirtyDaysAgo };
        }
    }

    const searchWhereJob: Record<string, unknown> = {};
    if (params.search?.trim()) {
        const q = params.search.trim();
        searchWhereJob.OR = [
            { id: { contains: q, mode: "insensitive" } },
            { account: { accountNumber: { contains: q, mode: "insensitive" } } },
            { account: { broker: { contains: q, mode: "insensitive" } } },
            { account: { server: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { name: { contains: q, mode: "insensitive" } } },
        ];
    }

    const statusWhereJob: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== "ALL") {
        if (statusFilter === "QUEUE") {
            statusWhereJob.status = { in: ["PENDING", "PROCESSING"] };
        } else if (statusFilter === "COMPLETED") {
            statusWhereJob.status = "COMPLETED";
        } else if (statusFilter === "FAILED") {
            statusWhereJob.status = "FAILED";
        }
    }

    const jobWhere = {
        ...dateWhere,
        ...searchWhereJob,
        ...statusWhereJob,
    };

    const [jobsRaw, totalFiltered, jobStatsAgg] = await Promise.all([
        prisma.mt5ImportJob.findMany({
            where: jobWhere,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        broker: true,
                        server: true,
                        accountNumber: true,
                        balance: true,
                        currency: true,
                        credential: {
                            select: {
                                encryptedPassword: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                        profile: { select: { telegramId: true } },
                    },
                },
            },
        }),
        prisma.mt5ImportJob.count({ where: jobWhere }),
        prisma.mt5ImportJob.groupBy({
            by: ["status"],
            where: { ...dateWhere, ...searchWhereJob },
            _count: { id: true },
        }),
    ]);

    let completedCount = 0;
    let failedCount = 0;
    let queueCount = 0;
    let totalAll = 0;

    for (const s of jobStatsAgg) {
        const count = s._count.id;
        totalAll += count;
        if (s.status === "COMPLETED") completedCount = count;
        else if (s.status === "FAILED") failedCount = count;
        else if (s.status === "PENDING" || s.status === "PROCESSING") queueCount += count;
    }

    const successRate = totalAll > 0 ? ((completedCount / totalAll) * 100).toFixed(1) : "100.0";

    const items: UnifiedSyncItem[] = jobsRaw.map((job) => ({
        id: job.id,
        type: "CLOUD_SYNC",
        user: {
            id: job.user.id,
            email: job.user.email,
            name: job.user.name,
            image: job.user.image,
            telegramId: job.user.profile?.telegramId || null,
        },
        account: {
            id: job.account?.id || job.accountId,
            accountNumber: job.account?.accountNumber || "N/A",
            broker: job.account?.broker || "Unknown Broker",
            server: job.account?.server || null,
            balance: job.account?.balance ?? null,
            currency: job.account?.currency || "USD",
            hasSavedPassword: Boolean(job.account?.credential?.encryptedPassword),
        },
        status: job.status,
        unifiedStatus:
            job.status === "COMPLETED"
                ? "COMPLETED"
                : job.status === "FAILED"
                ? "FAILED"
                : "QUEUE",
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt?.toISOString(),
        cloudJob: {
            mode: job.mode,
            rangeFrom: job.rangeFrom?.toISOString() || null,
            rangeTo: job.rangeTo?.toISOString() || null,
            message: job.message,
            workerId: job.workerId,
            progressPercent: job.progressPercent,
            ordersReceived: job.ordersReceived,
            dealsReceived: job.dealsReceived,
            errorCode: job.errorCode,
            errorMessage: job.errorMessage,
            completedAt: job.completedAt?.toISOString() || null,
        },
    }));

    return {
        success: true,
        items,
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
        stats: {
            totalAll,
            completedCount,
            failedCount,
            queueCount,
            cloudTotal: totalAll,
            successRate,
        },
    };
}

export async function retrySyncJobAdmin(jobId: string) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    const job = await prisma.mt5ImportJob.findUnique({ where: { id: jobId } });
    if (!job) return { success: false, error: "Job not found" };

    await prisma.mt5ImportJob.update({
        where: { id: jobId },
        data: {
            status: "PENDING",
            errorCode: null,
            errorMessage: null,
            message: "Re-queued by Administrator.",
            createdAt: new Date(),
            completedAt: null,
        },
    });

    revalidatePath("/admin/ib/sync-requests");
    revalidatePath("/dashboard/accounts");
    return { success: true };
}

export async function cancelSyncJobAdmin(jobId: string) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    const job = await prisma.mt5ImportJob.findUnique({
        where: { id: jobId },
        select: { id: true },
    });
    if (!job) {
        return { success: false, error: "Sync job not found" };
    }

    await prisma.mt5ImportJob.update({
        where: { id: jobId },
        data: {
            status: "FAILED",
            errorCode: "CANCELLED_BY_ADMIN",
            errorMessage: "Sync job cancelled by Administrator.",
            completedAt: new Date(),
        },
    });

    revalidatePath("/admin/ib/sync-requests");
    revalidatePath("/dashboard/accounts");
    return { success: true };
}

export async function deleteSyncJobAdmin(jobId: string) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    const job = await prisma.mt5ImportJob.findUnique({ where: { id: jobId } });
    if (job) {
        await prisma.mt5ImportJob.delete({
            where: { id: jobId },
        });
        revalidatePath("/admin/ib/sync-requests");
        return { success: true };
    }

    return { success: false, error: "Sync request not found" };
}

export async function deleteBulkSyncRequestsAdmin(ids: string[]) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    if (!ids || ids.length === 0) {
        return { success: false, error: "No items selected for deletion" };
    }

    const jobsRes = await prisma.mt5ImportJob.deleteMany({
        where: { id: { in: ids } },
    });

    revalidatePath("/admin/ib/sync-requests");
    revalidatePath("/dashboard/accounts");

    return {
        success: true,
        deletedCount: jobsRes.count,
    };
}
