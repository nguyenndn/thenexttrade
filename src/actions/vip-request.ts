"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { maskAccountNumber, findOrMatchTradingAccount } from "@/lib/pro-access";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";
import { notifyAdminsOfVipRequest } from "@/lib/admin/admin-notification.server";
import { resolveIbDateFilter, type IbStatsFilter } from "@/lib/admin/ib/date-filter";

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

export async function getVipRequestStats(range: IbStatsFilter = "30d") {
    const user = await getAuthUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return null;

    const { start: rangeStart, end: rangeEnd } = resolveIbDateFilter(range);
    const rangeWhere = rangeStart
        ? rangeEnd
            ? { createdAt: { gte: rangeStart, lte: rangeEnd } }
            : { createdAt: { gte: rangeStart } }
        : rangeEnd
          ? { createdAt: { lte: rangeEnd } }
          : {};

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
        await grantUserProductAccess({
            adminUserId: user.id,
            targetUserId: vipRequest.userId,
            productSlug: "gsn-phoenix-grid",
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

        // Also ensure EALicense is APPROVED + LicenseKey exists + sync to GitHub Backup
        try {
            const {
                ensureTradingAccountLicenseKey,
                syncLicensesToGitHubBackup,
            } = await import("@/lib/ea/github-license-sync.server");
            await ensureTradingAccountLicenseKey({
                userId: vipRequest.userId,
                broker: vipRequest.broker,
                accountNumber: vipRequest.accountNumber,
                isApproved: true,
                approvedBy: user.id,
            });
            await prisma.eALicense.upsert({
                where: {
                    broker_accountNumber: {
                        broker: vipRequest.broker,
                        accountNumber: vipRequest.accountNumber.trim(),
                    },
                },
                create: {
                    userId: vipRequest.userId,
                    broker: vipRequest.broker,
                    accountNumber: vipRequest.accountNumber.trim(),
                    status: "APPROVED",
                    isVerified: true,
                    verifiedAt: new Date(),
                    approvedBy: user.id,
                    approvedAt: new Date(),
                    startDate: new Date(),
                    expiryDate: null,
                },
                update: {
                    status: "APPROVED",
                    isVerified: true,
                    verifiedAt: new Date(),
                    approvedBy: user.id,
                    approvedAt: new Date(),
                },
            });
            await syncLicensesToGitHubBackup();
        } catch (syncErr) {
            console.error("Non-fatal EA license / GitHub sync error after VIP approval:", syncErr);
        }
    } catch (err) {
        console.error("Failed to approve VIP request:", err);
        return { error: "Approval failed. Please try again." };
    }

    revalidatePath(`/admin/users/${vipRequest.userId}`);
    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/admin/ib/traders");
    revalidatePath("/admin/trading-systems");
    revalidatePath("/admin/trading-systems/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

export async function rejectVipRequest(requestId: string, reason?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    const cleanReason = reason?.trim() || null;

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
            rejectReason: cleanReason,
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
            message: cleanReason
                ? `Your VIP request was rejected. Reason: ${cleanReason}`
                : "Your VIP request was not approved.",
            priority: NotificationPriority.NORMAL,
            link: NOTIFICATION_ROUTES.VIP_ACCOUNTS,
        },
    });

    revalidatePath(`/admin/users/${vipRequest.userId}`);
    revalidatePath("/admin/ib/pipeline");
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

    // Only revoke product-level access and suspend EALicense if the deleted
    // request was the APPROVED one (so deleting old REJECTED/PENDING rows
    // never breaks an already-approved account).
    if (existingRequest.status === "APPROVED") {
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
            await revokeUserProductAccess({
                adminUserId: user.id,
                targetUserId: existingRequest.userId,
                productSlug: "gsn-phoenix-grid",
                tradingAccountId: existingRequest.tradingAccountId || null,
            });

            if (existingRequest.accountNumber) {
                const cleanAcct = existingRequest.accountNumber.trim();
                await prisma.eALicense.updateMany({
                    where: {
                        userId: existingRequest.userId,
                        accountNumber: cleanAcct,
                    },
                    data: {
                        status: "SUSPENDED",
                        isVerified: false,
                        rejectReason: "VIP Request deleted by Admin",
                    },
                });
                await prisma.tradingAccount.updateMany({
                    where: {
                        userId: existingRequest.userId,
                        accountNumber: cleanAcct,
                    },
                    data: {
                        ibAttribution: "UNVERIFIED",
                    },
                });
                const { syncLicensesToGitHubBackup } = await import(
                    "@/lib/ea/github-license-sync.server"
                );
                await syncLicensesToGitHubBackup();
            }
        } catch (err) {
            console.error("Failed to revoke product access on VIP request delete:", err);
        }
    }

    await prisma.vipRequest.delete({
        where: { id: requestId },
    });

    revalidatePath(`/admin/users/${existingRequest.userId}`);
    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/admin/ib/traders");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

export async function clearRejectedVipRequests(userId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    const deleted = await prisma.vipRequest.deleteMany({
        where: {
            userId,
            status: "REJECTED",
        },
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/ib/pipeline");
    return { success: true, deletedCount: deleted.count };
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

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}

/**
 * Revoke Pro access for a specific trading account or entitlement.
 * - If entitlementId is provided: revokes that specific entitlement by primary key.
 * - If tradingAccountId is provided: revokes the entitlement associated with that account.
 * - If neither is provided: revokes all active/grace entitlements for the user.
 */
export async function revokeProAccess(
    userId: string,
    reason?: string,
    tradingAccountId?: string,
    entitlementId?: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return { error: "Forbidden" };

    let effectiveTradingAccountId: string | null = null;

    // 1. If entitlementId is provided directly, hard delete by primary key
    if (entitlementId) {
        const ent = await prisma.proEntitlement.findUnique({
            where: { id: entitlementId },
            select: { id: true, tradingAccountId: true },
        });
        if (ent) {
            effectiveTradingAccountId = ent.tradingAccountId;
            await prisma.proEntitlement.deleteMany({
                where: { id: ent.id },
            });
        }
    } else if (tradingAccountId) {
        // Defensive check: was a ProEntitlement ID accidentally passed as tradingAccountId?
        const entByCandidateId = await prisma.proEntitlement.findUnique({
            where: { id: tradingAccountId },
            select: { id: true, tradingAccountId: true },
        });

        if (entByCandidateId) {
            effectiveTradingAccountId = entByCandidateId.tradingAccountId;
            await prisma.proEntitlement.deleteMany({
                where: { id: entByCandidateId.id },
            });
        } else {
            // It is an actual tradingAccountId
            effectiveTradingAccountId = tradingAccountId;
            const targetAcct = await prisma.tradingAccount.findUnique({
                where: { id: tradingAccountId },
                select: { accountNumber: true },
            });
            await prisma.proEntitlement.deleteMany({
                where: targetAcct?.accountNumber
                    ? {
                          userId,
                          OR: [
                              { tradingAccountId },
                              {
                                  tradingAccountId: null,
                                  accountNumber: targetAcct.accountNumber.trim(),
                              },
                          ],
                      }
                    : { tradingAccountId },
            });
        }
    } else {
        // Revoke all user entitlements (legacy/global) -> hard delete
        await prisma.proEntitlement.deleteMany({
            where: { userId },
        });
    }

    // Clean up any APPROVED vipRequest for this account/user to avoid stale approved state
    try {
        if (effectiveTradingAccountId) {
            await prisma.vipRequest.updateMany({
                where: {
                    tradingAccountId: effectiveTradingAccountId,
                    status: "APPROVED",
                },
                data: {
                    status: "REJECTED",
                    rejectReason: reason || "Access revoked by admin",
                    reviewedAt: new Date(),
                    reviewedBy: user.id,
                },
            });
        } else {
            await prisma.vipRequest.updateMany({
                where: {
                    userId,
                    status: "APPROVED",
                },
                data: {
                    status: "REJECTED",
                    rejectReason: reason || "Access revoked by admin",
                    reviewedAt: new Date(),
                    reviewedBy: user.id,
                },
            });
        }
    } catch (err) {
        console.error("Failed to update vipRequest status during revokeProAccess:", err);
    }

    // Also revoke product-level access for canonical products
    try {
        const { revokeUserProductAccess } = await import(
            "@/lib/admin/ib/product-usage.server"
        );
        await revokeUserProductAccess({
            adminUserId: user.id,
            targetUserId: userId,
            productSlug: "goldscalperninja",
            tradingAccountId: effectiveTradingAccountId,
        });
        await revokeUserProductAccess({
            adminUserId: user.id,
            targetUserId: userId,
            productSlug: "trade-manager",
            tradingAccountId: effectiveTradingAccountId,
        });
        await revokeUserProductAccess({
            adminUserId: user.id,
            targetUserId: userId,
            productSlug: "gsn-phoenix-grid",
            tradingAccountId: effectiveTradingAccountId,
        });

        // Synchronize EALicense -> SUSPENDED and TradingAccount.ibAttribution -> UNVERIFIED
        if (effectiveTradingAccountId) {
            const targetAcc = await prisma.tradingAccount.findUnique({
                where: { id: effectiveTradingAccountId },
                select: { accountNumber: true },
            });
            await prisma.tradingAccount.updateMany({
                where: { id: effectiveTradingAccountId },
                data: { ibAttribution: "UNVERIFIED" },
            });
            if (targetAcc?.accountNumber) {
                await prisma.eALicense.updateMany({
                    where: {
                        userId,
                        accountNumber: targetAcc.accountNumber.trim(),
                    },
                    data: {
                        status: "SUSPENDED",
                        isVerified: false,
                        rejectReason: reason || "Pro/VIP access revoked by Admin",
                    },
                });
            }
        } else {
            await prisma.tradingAccount.updateMany({
                where: { userId },
                data: { ibAttribution: "UNVERIFIED" },
            });
            await prisma.eALicense.updateMany({
                where: { userId },
                data: {
                    status: "SUSPENDED",
                    isVerified: false,
                    rejectReason: reason || "Pro/VIP access revoked by Admin",
                },
            });
        }

        const { syncLicensesToGitHubBackup } = await import(
            "@/lib/ea/github-license-sync.server"
        );
        await syncLicensesToGitHubBackup();
    } catch (err) {
        console.error("Failed to revoke product access during revokeProAccess:", err);
    }

    await prisma.notification.create({
        data: {
            userId,
            type: NotificationType.VIP_REJECTED,
            title: "Pro Access Updated",
            message: reason
                ? `Your account plan has been updated to Free Tier. Reason: ${reason}`
                : "Your account plan has been updated to Free Tier. You can apply again anytime with an eligible trading account.",
            priority: NotificationPriority.NORMAL,
            link: NOTIFICATION_ROUTES.VIP_ACCOUNTS,
        },
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/admin/ib/traders");
    revalidatePath("/dashboard");
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

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/ib/pipeline");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/trading-systems");
    return { success: true };
}
