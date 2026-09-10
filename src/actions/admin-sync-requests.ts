"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getInvestorPasswordForAccount } from "@/lib/credentials/investor-password.server";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

interface NotifyTicketParams {
    userId: string;
    broker: string;
    accountNumber: string;
    resolved: boolean;
    notes?: string;
}

/**
 * Notifies a user that their manual sync request was handled.
 * Non-blocking: a notification failure must never fail the admin's action,
 * otherwise the admin sees an error even though the ticket was already updated.
 */
async function notifyUserOfSyncTicketOutcome(params: NotifyTicketParams) {
    try {
        const accountLabel = `${params.broker} #${params.accountNumber}`;

        const title = params.resolved
            ? "Manual sync completed"
            : "Manual sync could not be completed";

        const message = params.resolved
            ? `Our team has synced ${accountLabel}. Your trade history should now be up to date — open your accounts to review it.`
            : `We could not sync ${accountLabel}${params.notes ? `. Reason: ${params.notes}` : "."} Your other accounts are unaffected. Contact support if this keeps happening.`;

        // createMany + skipDuplicates so re-resolving a ticket is a silent no-op
        // rather than a P2002 throw on the unique (userId, dedupeKey) index.
        await prisma.notification.createMany({
            data: [
                {
                    userId: params.userId,
                    type: NotificationType.ANNOUNCEMENT,
                    title,
                    message,
                    priority: NotificationPriority.HIGH,
                    link: NOTIFICATION_ROUTES.VIP_ACCOUNTS,
                    // One notification per ticket state — re-resolving must not spam.
                    dedupeKey: `sync-ticket-${params.resolved ? "verified" : "failed"}-${params.accountNumber}`,
                },
            ],
            skipDuplicates: true,
        });
    } catch (error) {
        // Non-blocking by design; the ticket update already succeeded.
        console.error("[notifyUserOfSyncTicketOutcome error]:", error);
    }
}

export type UnifiedSyncType = "CLOUD_SYNC" | "SUPPORT_TICKET";

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
    supportTicket?: {
        ticketNumber: string;
        notes?: string | null;
        scheduledFor?: string | null;
        verifiedAt?: string | null;
        investorPassword?: string | null;
        hasInvestorPassword?: boolean;
    };
}

export interface SyncRequestFilterParams {
    page?: number;
    limit?: number;
    type?: "ALL" | "CLOUD" | "SUPPORT";
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
                supportTotal: 0,
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
                supportTotal: 0,
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
    const typeFilter = params.type || "ALL";
    const statusFilter = params.status || "ALL";

    // Date range filter
    const dateWhere: any = {};
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

    // Search filter for Jobs
    const searchWhereJob: any = {};
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

    // Search filter for Tickets
    const searchWhereTicket: any = {};
    if (params.search?.trim()) {
        const q = params.search.trim();
        searchWhereTicket.OR = [
            { id: { contains: q, mode: "insensitive" } },
            { accountNumber: { contains: q, mode: "insensitive" } },
            { broker: { contains: q, mode: "insensitive" } },
            { server: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { notes: { contains: q, mode: "insensitive" } },
        ];
    }

    // Status filter
    const statusWhereJob: any = {};
    if (statusFilter && statusFilter !== "ALL") {
        if (statusFilter === "QUEUE") {
            statusWhereJob.status = { in: ["PENDING", "PROCESSING"] };
        } else if (statusFilter === "COMPLETED") {
            statusWhereJob.status = "COMPLETED";
        } else if (statusFilter === "FAILED") {
            statusWhereJob.status = "FAILED";
        }
    }

    const statusWhereTicket: any = {};
    if (statusFilter && statusFilter !== "ALL") {
        if (statusFilter === "QUEUE") {
            statusWhereTicket.status = "PENDING";
        } else if (statusFilter === "COMPLETED") {
            statusWhereTicket.status = "VERIFIED";
        } else if (statusFilter === "FAILED") {
            statusWhereTicket.status = "FAILED";
        }
    }

    const jobWhere = {
        ...dateWhere,
        ...searchWhereJob,
        ...statusWhereJob,
    };

    const ticketWhere = {
        ...dateWhere,
        ...searchWhereTicket,
        ...statusWhereTicket,
    };

    const shouldFetchJobs = typeFilter === "ALL" || typeFilter === "CLOUD";
    const shouldFetchTickets = typeFilter === "ALL" || typeFilter === "SUPPORT";

    const [jobsRaw, ticketsRaw, jobStatsAgg, ticketStatsAgg] = await Promise.all([
        shouldFetchJobs
            ? prisma.mt5ImportJob.findMany({
                  where: jobWhere,
                  orderBy: { createdAt: "desc" },
                  take: 500,
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
              })
            : Promise.resolve([]),
        shouldFetchTickets
            ? prisma.supportSyncTicket.findMany({
                  where: ticketWhere,
                  orderBy: { createdAt: "desc" },
                  take: 500,
                  include: {
                      user: {
                          select: {
                              id: true,
                              email: true,
                              name: true,
                              image: true,
                              profile: { select: { telegramId: true } },
                          },
                      },
                      tradingAccount: {
                          select: {
                              id: true,
                              name: true,
                              broker: true,
                              server: true,
                              accountNumber: true,
                              balance: true,
                              currency: true,
                          },
                      },
                  },
              })
            : Promise.resolve([]),
        prisma.mt5ImportJob.groupBy({
            by: ["status"],
            where: { ...dateWhere, ...searchWhereJob },
            _count: { id: true },
        }),
        prisma.supportSyncTicket.groupBy({
            by: ["status"],
            where: { ...dateWhere, ...searchWhereTicket },
            _count: { id: true },
        }),
    ]);

    let cloudCompleted = 0;
    let cloudFailed = 0;
    let cloudQueue = 0;
    let cloudTotal = 0;

    for (const s of jobStatsAgg) {
        const count = s._count.id;
        cloudTotal += count;
        if (s.status === "COMPLETED") cloudCompleted = count;
        else if (s.status === "FAILED") cloudFailed = count;
        else if (s.status === "PENDING" || s.status === "PROCESSING") cloudQueue += count;
    }

    let supportVerified = 0;
    let supportFailed = 0;
    let supportPending = 0;
    let supportTotal = 0;

    for (const s of ticketStatsAgg) {
        const count = s._count.id;
        supportTotal += count;
        if (s.status === "VERIFIED") supportVerified = count;
        else if (s.status === "FAILED") supportFailed = count;
        else if (s.status === "PENDING") supportPending = count;
    }

    let totalAll = cloudTotal + supportTotal;
    let completedCount = cloudCompleted + supportVerified;
    let failedCount = cloudFailed + supportFailed;
    let queueCount = cloudQueue + supportPending;

    if (typeFilter === "CLOUD") {
        totalAll = cloudTotal;
        completedCount = cloudCompleted;
        failedCount = cloudFailed;
        queueCount = cloudQueue;
    } else if (typeFilter === "SUPPORT") {
        totalAll = supportTotal;
        completedCount = supportVerified;
        failedCount = supportFailed;
        queueCount = supportPending;
    }

    const successRate = totalAll > 0 ? ((completedCount / totalAll) * 100).toFixed(1) : "100.0";

    // Enrich support tickets with investor credentials for slide-over drawer inspection
    const enrichedTickets = await Promise.all(
        ticketsRaw.map(async (ticket) => {
            let targetAccountId = ticket.tradingAccountId;
            if (!targetAccountId) {
                const matched = await prisma.tradingAccount.findFirst({
                    where: {
                        userId: ticket.userId,
                        accountNumber: ticket.accountNumber,
                    },
                    select: { id: true },
                });
                targetAccountId = matched?.id || null;
            }

            let investorPassword: string | null = null;
            if (targetAccountId) {
                const pwRes = await getInvestorPasswordForAccount(targetAccountId);
                if (pwRes.ok) {
                    investorPassword = pwRes.password;
                }
            }

            return {
                ...ticket,
                investorPassword,
            };
        })
    );

    const mappedJobs: UnifiedSyncItem[] = jobsRaw.map((job) => ({
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

    const mappedTickets: UnifiedSyncItem[] = enrichedTickets.map((ticket) => ({
        id: ticket.id,
        type: "SUPPORT_TICKET",
        user: {
            id: ticket.user.id,
            email: ticket.user.email,
            name: ticket.user.name,
            image: ticket.user.image,
            telegramId: ticket.user.profile?.telegramId || null,
        },
        account: {
            id: ticket.tradingAccountId || null,
            accountNumber: ticket.accountNumber,
            broker: ticket.broker,
            server: ticket.server || null,
            balance: ticket.tradingAccount?.balance ?? null,
            currency: ticket.tradingAccount?.currency || "USD",
        },
        status: ticket.status,
        unifiedStatus:
            ticket.status === "VERIFIED"
                ? "COMPLETED"
                : ticket.status === "FAILED"
                ? "FAILED"
                : "QUEUE",
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt?.toISOString(),
        supportTicket: {
            ticketNumber: ticket.id.slice(-8).toUpperCase(),
            notes: ticket.notes,
            scheduledFor: ticket.scheduledFor?.toISOString() || null,
            verifiedAt: ticket.verifiedAt?.toISOString() || null,
            investorPassword: ticket.investorPassword || null,
            hasInvestorPassword: Boolean(ticket.investorPassword),
        },
    }));

    const allCombined = [...mappedJobs, ...mappedTickets].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalFiltered = allCombined.length;
    const paginatedItems = allCombined.slice(skip, skip + limit);

    return {
        success: true,
        items: paginatedItems,
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
        stats: {
            totalAll,
            completedCount,
            failedCount,
            queueCount,
            cloudTotal,
            supportTotal,
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

export async function resolveSupportTicketAdmin(ticketId: string, notes?: string) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    const resolvedTicket = await prisma.supportSyncTicket.update({
        where: { id: ticketId },
        data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
            verifiedBy: user.id,
            notes: notes ? `[Resolved] ${notes}` : undefined,
        },
        select: { userId: true, broker: true, accountNumber: true },
    });

    await notifyUserOfSyncTicketOutcome({
        userId: resolvedTicket.userId,
        broker: resolvedTicket.broker,
        accountNumber: resolvedTicket.accountNumber,
        resolved: true,
    });

    revalidatePath("/admin/ib/sync-requests");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/notifications");
    return { success: true };
}

export async function markTicketFailedAdmin(ticketId: string, reason?: string) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (adminProfile?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin access required" };
    }

    const ticket = await prisma.supportSyncTicket.findUnique({
        where: { id: ticketId },
        select: { notes: true },
    });

    const failedNote = reason?.trim() ? `[Failed: ${reason.trim()}]` : "[Failed: Unable to sync manually]";
    const updatedNotes = ticket?.notes ? `${failedNote} ${ticket.notes}` : failedNote;

    const failedTicket = await prisma.supportSyncTicket.update({
        where: { id: ticketId },
        data: {
            status: "FAILED",
            verifiedAt: new Date(),
            verifiedBy: user.id,
            notes: updatedNotes,
        },
        select: { userId: true, broker: true, accountNumber: true },
    });

    await notifyUserOfSyncTicketOutcome({
        userId: failedTicket.userId,
        broker: failedTicket.broker,
        accountNumber: failedTicket.accountNumber,
        resolved: false,
        notes: reason?.trim() || undefined,
    });

    revalidatePath("/admin/ib/sync-requests");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/notifications");
    return { success: true };
}

export async function getTicketCredentials(ticketId: string) {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const adminProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });
        if (adminProfile?.role !== "ADMIN") {
            return { success: false, error: "Forbidden: Admin access required" };
        }

        const ticket = await prisma.supportSyncTicket.findUnique({
            where: { id: ticketId },
            include: {
                tradingAccount: {
                    select: { id: true, server: true, broker: true, accountNumber: true },
                },
            },
        });

        if (!ticket) {
            return { success: false, error: "Support ticket not found" };
        }

        // Resolve target account ID from ticket relation or matching user + account number
        let targetAccountId = ticket.tradingAccountId;
        if (!targetAccountId) {
            const matchedAccount = await prisma.tradingAccount.findFirst({
                where: {
                    userId: ticket.userId,
                    accountNumber: ticket.accountNumber,
                },
                select: { id: true },
            });
            targetAccountId = matchedAccount?.id || null;
        }

        if (!targetAccountId) {
            return {
                success: false,
                error: "No registered trading account found for this ticket.",
            };
        }

        const pwResult = await getInvestorPasswordForAccount(targetAccountId);
        if (!pwResult.ok) {
            return {
                success: false,
                error: "No investor password configured in Cloud Sync settings for this account.",
            };
        }

        // Audit view event to SecurityLog table (non-blocking)
        try {
            let ip = "127.0.0.1";
            let userAgent: string | null = null;
            try {
                const headersList = await headers();
                ip =
                    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    headersList.get("x-real-ip") ||
                    "127.0.0.1";
                userAgent = headersList.get("user-agent") || null;
            } catch {
                // Fallback gracefully if headers context is unavailable
            }

            await prisma.securityLog.create({
                data: {
                    type: "ADMIN_VIEW_CREDENTIAL",
                    ip,
                    userAgent,
                    path: "/admin/ib/sync-requests",
                    detail: JSON.stringify({
                        ticketId,
                        tradingAccountId: targetAccountId,
                        accountNumber: ticket.accountNumber,
                        broker: ticket.broker,
                    }),
                    userId: user.id,
                },
            });
        } catch (auditErr) {
            console.warn("[SecurityLog audit warning]:", auditErr);
        }

        return {
            success: true,
            broker: ticket.broker,
            server: ticket.server || ticket.tradingAccount?.server || "Default Server",
            accountNumber: ticket.accountNumber,
            password: pwResult.password,
        };
    } catch (err: any) {
        console.error("[getTicketCredentials error]:", err);
        return {
            success: false,
            error: err?.message || "Failed to load credentials",
        };
    }
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

    const ticket = await prisma.supportSyncTicket.findUnique({ where: { id: jobId } });
    if (ticket) {
        await prisma.supportSyncTicket.delete({
            where: { id: jobId },
        });
        revalidatePath("/admin/ib/sync-requests");
        return { success: true };
    }

    return { success: false, error: "Sync request or ticket not found" };
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

    // Delete matching Mt5ImportJobs
    const deleteJobs = prisma.mt5ImportJob.deleteMany({
        where: { id: { in: ids } },
    });

    // Delete matching SupportSyncTickets
    const deleteTickets = prisma.supportSyncTicket.deleteMany({
        where: { id: { in: ids } },
    });

    const [jobsRes, ticketsRes] = await prisma.$transaction([deleteJobs, deleteTickets]);

    revalidatePath("/admin/ib/sync-requests");
    revalidatePath("/dashboard/accounts");

    return {
        success: true,
        deletedCount: jobsRes.count + ticketsRes.count,
    };
}
