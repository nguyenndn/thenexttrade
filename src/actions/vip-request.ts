"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { maskAccountNumber, findOrMatchTradingAccount } from "@/lib/pro-access";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { notifyAdminsOfVipRequest } from "@/lib/admin/admin-notification.server";
import type { IbStatsRange } from "@/actions/ib-lead";

// ============================================================================
// USER ACTIONS
// ============================================================================

export async function getMyVipRequest(tradingAccountId?: string) {
    const user = await getAuthUser();
    if (!user) return null;

    const request = await prisma.vipRequest.findFirst({
        where: {
            userId: user.id,
            // Scope to specific account if provided, otherwise get latest non-orphaned
            ...(tradingAccountId
                ? { tradingAccountId }
                : { tradingAccountId: { not: null } }),
        },
        orderBy: { createdAt: "desc" },
    });

    return request;
}

// VIP Telegram group invite link — env-configurable. Without VIP_TELEGRAM_URL
// the function returns null so the product never surfaces a fake invite link.
// The owner must set VIP_TELEGRAM_URL in env for the "Join VIP Telegram" button
// to appear for entitled users.
const VIP_TELEGRAM_URL = process.env.VIP_TELEGRAM_URL || null;

export async function getVipLink() {
    const user = await getAuthUser();
    if (!user) return null;

    // Only entitled users see the invite: an ACTIVE/GRACE entitlement (account
    // or user-level) OR an approved request. Manual grants have no approved
    // VipRequest, so the entitlement check is the source of truth.
    const [activeEntitlement, approvedRequest] = await Promise.all([
        prisma.proEntitlement.findFirst({
            where: {
                userId: user.id,
                status: { in: ["ACTIVE", "GRACE"] },
            },
            select: { id: true },
        }),
        prisma.vipRequest.findFirst({
            where: { userId: user.id, status: "APPROVED" },
            select: { id: true },
        }),
    ]);

    if (!activeEntitlement && !approvedRequest) return null;
    if (!VIP_TELEGRAM_URL) return null;

    return VIP_TELEGRAM_URL;
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

function getVipStatsRangeStart(range: IbStatsRange) {
    const now = new Date();
    if (range === "7d")
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d")
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null;
}

export async function getVipRequestStats(range: IbStatsRange = "30d") {
    const user = await getAuthUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return null;

    const rangeStart = getVipStatsRangeStart(range);
    const rangeWhere = rangeStart ? { createdAt: { gte: rangeStart } } : {};

    const [total, pending, approved, rejected] = await Promise.all([
        prisma.vipRequest.count({ where: rangeWhere }),
        prisma.vipRequest.count({ where: { status: "PENDING", ...rangeWhere } }),
        prisma.vipRequest.count({
            where: { status: "APPROVED", ...rangeWhere },
        }),
        prisma.vipRequest.count({
            where: { status: "REJECTED", ...rangeWhere },
        }),
    ]);

    return { total, pending, approved, rejected };
}

/**
 * Approve a VIP request — creates account-scoped ProEntitlement.
 */
export async function approveVipRequest(requestId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    // Status guard — only a PENDING request can be approved. Re-approving an
    // already-reviewed request would flip status in place and re-grant.
    const vipRequest = await prisma.vipRequest.findUnique({
        where: { id: requestId },
    });
    if (!vipRequest) return { error: "Not found" };
    if (vipRequest.status !== "PENDING") {
        return {
            error: `Cannot approve a request in status "${vipRequest.status}"`,
        };
    }

    // If no tradingAccountId on the request, try to match now
    let accountId = vipRequest.tradingAccountId;
    if (!accountId) {
        accountId = await findOrMatchTradingAccount(
            vipRequest.userId,
            vipRequest.broker,
            vipRequest.accountNumber
        );
    }

    // Wrap the whole approval in ONE transaction: entitlement + product grants +
    // audit + notification + status flip commit together, so a failure anywhere
    // rolls back everything and the request stays PENDING (no half-granted state).
    // Product-grant failures are now surfaced to the admin instead of swallowed.
    try {
        await prisma.$transaction(async (tx) => {
        // Create or update ProEntitlement (account-scoped)
        if (accountId) {
            await tx.proEntitlement.upsert({
                where: { tradingAccountId: accountId },
                create: {
                    userId: vipRequest.userId,
                    tradingAccountId: accountId,
                    status: "ACTIVE",
                    source: "IB_VERIFIED",
                    vipRequestId: requestId,
                    broker: vipRequest.broker,
                    accountNumber: vipRequest.accountNumber,
                    accountNumberMasked: maskAccountNumber(
                        vipRequest.accountNumber
                    ),
                    startsAt: new Date(),
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                },
                update: {
                    status: "ACTIVE",
                    source: "IB_VERIFIED",
                    vipRequestId: requestId,
                    broker: vipRequest.broker,
                    accountNumber: vipRequest.accountNumber,
                    accountNumberMasked: maskAccountNumber(
                        vipRequest.accountNumber
                    ),
                    startsAt: new Date(),
                    expiresAt: null,
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                },
            });
        } else {
            // Fallback: create user-level entitlement (legacy, no account linked)
            await tx.proEntitlement.create({
                data: {
                    userId: vipRequest.userId,
                    status: "ACTIVE",
                    source: "IB_VERIFIED",
                    vipRequestId: requestId,
                    broker: vipRequest.broker,
                    accountNumber: vipRequest.accountNumber,
                    accountNumberMasked: maskAccountNumber(
                        vipRequest.accountNumber
                    ),
                    startsAt: new Date(),
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                },
            });
        }

        // Link the matched account back onto the request
        if (accountId && vipRequest.tradingAccountId !== accountId) {
            await tx.vipRequest.update({
                where: { id: requestId },
                data: { tradingAccountId: accountId },
            });
        }

        // Grant product-level access for canonical products. If this throws, the
        // transaction aborts — the request stays PENDING and no entitlement/status
        // change is committed.
        const { grantUserProductAccess } = await import(
            "@/lib/admin/ib/product-usage.server"
        );
        const { ToolAccessSource } = await import("@prisma/client");
        await grantUserProductAccess({
            adminUserId: user.id,
            targetUserId: vipRequest.userId,
            productSlug: "goldscalperninja",
            tradingAccountId: accountId || null,
            source: ToolAccessSource.IB_VERIFIED,
        });
        await grantUserProductAccess({
            adminUserId: user.id,
            targetUserId: vipRequest.userId,
            productSlug: "trade-manager",
            tradingAccountId: accountId || null,
            source: ToolAccessSource.IB_VERIFIED,
        });

        // Audit log
        await tx.auditLog.create({
            data: {
                adminId: user.id,
                action: "APPROVE_VIP_REQUEST",
                targetType: "VIP_REQUEST",
                targetId: requestId,
                details: {
                    userId: vipRequest.userId,
                    tradingAccountId: accountId,
                },
            },
        });

        // Notify user
        await tx.notification.create({
            data: {
                userId: vipRequest.userId,
                type: NotificationType.VIP_APPROVED,
                title: "VIP Access Activated!",
                message:
                    "Your VIP request has been approved. You now have full VIP access — open the VIP tab to join the Telegram channel & TraderRoom.",
                priority: NotificationPriority.HIGH,
                link: NOTIFICATION_ROUTES.VIP_COMMUNITY,
            },
        });

        // Flip status LAST — everything above succeeded
        await tx.vipRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                reviewedBy: user.id,
                reviewedAt: new Date(),
            },
        });
        });
    } catch (err) {
        console.error("Failed to approve VIP request:", err);
        return { error: "Approval failed. Please try again." };
    }

    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/admin/ib/traders");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

export async function rejectVipRequest(requestId: string, reason: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    if (!reason?.trim()) return { error: "Reject reason is required" };

    // Status guard — mirror of approveVipRequest. Only a PENDING request can be
    // rejected; re-rejecting a reviewed request would overwrite its state.
    const existing = await prisma.vipRequest.findUnique({
        where: { id: requestId },
    });
    if (!existing) return { error: "Not found" };
    if (existing.status !== "PENDING") {
        return {
            error: `Cannot reject a request in status "${existing.status}"`,
        };
    }

    const vipRequest = await prisma.vipRequest.update({
        where: { id: requestId },
        data: {
            status: "REJECTED",
            rejectReason: reason.trim(),
            reviewedBy: user.id,
            reviewedAt: new Date(),
        },
    });

    // Notify user
    await prisma.notification.create({
        data: {
            userId: vipRequest.userId,
            type: NotificationType.VIP_REJECTED,
            title: "VIP Request Rejected",
            message: `Your VIP request was rejected. Reason: ${reason.trim()}`,
            priority: NotificationPriority.NORMAL,
            link: NOTIFICATION_ROUTES.VIP_ACCOUNTS,
        },
    });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteVipRequest(requestId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    const existingRequest = await prisma.vipRequest.findUnique({
        where: { id: requestId },
    });

    if (!existingRequest) return { error: "Not found" };

    // Clean up associated ProEntitlement so user reverts to "Free Plan".
    // Match by vipRequestId ONLY — the old OR(tradingAccountId) arm could delete
    // entitlements belonging to OTHER pending requests on the same account.
    await prisma.proEntitlement.deleteMany({
        where: { vipRequestId: requestId },
    });

    // Also revoke product-level access for canonical products so eAProductAccess
    // rows aren't left orphaned as GRANTED after the request is deleted.
    try {
        const { revokeUserProductAccess } = await import(
            "@/lib/admin/ib/product-usage.server"
        );
        await revokeUserProductAccess({
            adminUserId: user.id,
            targetUserId: existingRequest.userId,
            productSlug: "goldscalperninja",
            tradingAccountId: existingRequest.tradingAccountId || null,
        });
        await revokeUserProductAccess({
            adminUserId: user.id,
            targetUserId: existingRequest.userId,
            productSlug: "trade-manager",
            tradingAccountId: existingRequest.tradingAccountId || null,
        });
    } catch (err) {
        console.error("Failed to revoke product access on VIP request delete:", err);
    }

    await prisma.vipRequest.delete({
        where: { id: requestId },
    });

    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/admin/ib/traders");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

// ============================================================================
// PRO ENTITLEMENT ADMIN ACTIONS (Account-Scoped)
// ============================================================================

/**
 * Grant grace period for a specific trading account.
 * If no tradingAccountId, grants user-level grace (legacy).
 */
export async function grantGracePeriod(
    userId: string,
    days: number = 14,
    tradingAccountId?: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    if (tradingAccountId) {
        await prisma.proEntitlement.upsert({
            where: { tradingAccountId },
            create: {
                userId,
                tradingAccountId,
                status: "GRACE",
                source: "MANUAL_ADMIN",
                startsAt: new Date(),
                expiresAt,
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
            },
            update: {
                status: "GRACE",
                startsAt: new Date(),
                expiresAt,
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
            },
        });
    } else {
        // Legacy user-level grace — upsert by userId to avoid stacking duplicate
        // user-level entitlements (the @@unique([userId, tradingAccountId]) allows
        // multiple rows where tradingAccountId IS NULL in Postgres).
        const existingUserLevel = await prisma.proEntitlement.findFirst({
            where: { userId, tradingAccountId: null },
            orderBy: { createdAt: "desc" },
        });
        if (existingUserLevel) {
            await prisma.proEntitlement.update({
                where: { id: existingUserLevel.id },
                data: {
                    status: "GRACE",
                    startsAt: new Date(),
                    expiresAt,
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                },
            });
        } else {
            await prisma.proEntitlement.create({
                data: {
                    userId,
                    status: "GRACE",
                    source: "MANUAL_ADMIN",
                    startsAt: new Date(),
                    expiresAt,
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                },
            });
        }
    }

    await prisma.notification.create({
        data: {
            userId,
            type: NotificationType.VIP_APPROVED,
            title: "Temporary VIP Access Granted",
            message: `You have been granted ${days}-day temporary VIP access. Complete your verification to keep access permanently.`,
            priority: NotificationPriority.NORMAL,
            link: NOTIFICATION_ROUTES.VIP_UNLOCK_PRO,
        },
    });

    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

/**
 * Revoke Pro access for a specific trading account.
 * If no tradingAccountId, revokes all entitlements for the user.
 */
export async function revokeProAccess(
    userId: string,
    reason?: string,
    tradingAccountId?: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    if (tradingAccountId) {
        // Revoke specific account
        await prisma.proEntitlement.upsert({
            where: { tradingAccountId },
            create: {
                userId,
                tradingAccountId,
                status: "REVOKED",
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
                adminNote: reason || null,
            },
            update: {
                status: "REVOKED",
                expiresAt: null,
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
                adminNote: reason || null,
            },
        });
    } else {
        // Revoke all user entitlements (legacy)
        await prisma.proEntitlement.updateMany({
            where: { userId },
            data: {
                status: "REVOKED",
                expiresAt: null,
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
                adminNote: reason || null,
            },
        });
    }

    await prisma.notification.create({
        data: {
            userId,
            type: NotificationType.VIP_REJECTED,
            title: "VIP Access Revoked",
            message: reason
                ? `Your VIP access has been revoked. Reason: ${reason}`
                : "Your VIP access has been revoked. Contact support for details.",
            priority: NotificationPriority.HIGH,
            link: NOTIFICATION_ROUTES.VIP_ACCOUNTS,
        },
    });

    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

/**
 * Grant manual Pro for a specific trading account.
 */
export async function grantManualPro(
    userId: string,
    note?: string,
    tradingAccountId?: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    if (tradingAccountId) {
        await prisma.proEntitlement.upsert({
            where: { tradingAccountId },
            create: {
                userId,
                tradingAccountId,
                status: "ACTIVE",
                source: "MANUAL_ADMIN",
                startsAt: new Date(),
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
                adminNote: note || null,
            },
            update: {
                status: "ACTIVE",
                source: "MANUAL_ADMIN",
                startsAt: new Date(),
                expiresAt: null,
                lastReviewedAt: new Date(),
                reviewedBy: user.id,
                adminNote: note || null,
            },
        });
    } else {
        // Legacy user-level grant — upsert by userId to avoid stacking duplicate
        // user-level entitlements (same null tradingAccountId caveat as grace).
        const existingUserLevel = await prisma.proEntitlement.findFirst({
            where: { userId, tradingAccountId: null },
            orderBy: { createdAt: "desc" },
        });
        if (existingUserLevel) {
            await prisma.proEntitlement.update({
                where: { id: existingUserLevel.id },
                data: {
                    status: "ACTIVE",
                    source: "MANUAL_ADMIN",
                    startsAt: new Date(),
                    expiresAt: null,
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                    adminNote: note || null,
                },
            });
        } else {
            await prisma.proEntitlement.create({
                data: {
                    userId,
                    status: "ACTIVE",
                    source: "MANUAL_ADMIN",
                    startsAt: new Date(),
                    lastReviewedAt: new Date(),
                    reviewedBy: user.id,
                    adminNote: note || null,
                },
            });
        }
    }

    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}
