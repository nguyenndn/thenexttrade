"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
    grantUserProductAccess,
    revokeUserProductAccess,
} from "@/lib/admin/ib/product-usage.server";
import { ToolAccessSource } from "@prisma/client";

async function verifyAdmin() {
    const user = await getAuthUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") return null;

    return user;
}

export async function adminGrantProductAccessAction(params: {
    targetUserId: string;
    productSlug: string;
    tradingAccountId?: string | null;
    source?: "IB_VERIFIED" | "MANUAL_ADMIN" | "PROMO" | "LEGACY_PRO";
}) {
    const admin = await verifyAdmin();
    if (!admin) return { error: "Unauthorized / Forbidden" };

    try {
        await grantUserProductAccess({
            adminUserId: admin.id,
            targetUserId: params.targetUserId,
            productSlug: params.productSlug,
            tradingAccountId: params.tradingAccountId,
            source: (params.source as ToolAccessSource) || ToolAccessSource.MANUAL_ADMIN,
        });

        revalidatePath("/admin/ib");
        revalidatePath("/admin/ib/pipeline");
        revalidatePath("/admin/ib/traders");
        return { success: true };
    } catch (err: any) {
        return { error: err.message || "Failed to grant product access" };
    }
}

export async function adminRevokeProductAccessAction(params: {
    targetUserId: string;
    productSlug: string;
    tradingAccountId?: string | null;
}) {
    const admin = await verifyAdmin();
    if (!admin) return { error: "Unauthorized / Forbidden" };

    try {
        await revokeUserProductAccess({
            adminUserId: admin.id,
            targetUserId: params.targetUserId,
            productSlug: params.productSlug,
            tradingAccountId: params.tradingAccountId,
        });

        revalidatePath("/admin/ib");
        revalidatePath("/admin/ib/pipeline");
        revalidatePath("/admin/ib/traders");
        return { success: true };
    } catch (err: any) {
        return { error: err.message || "Failed to revoke product access" };
    }
}

export async function adminSendSetupReminderAction(params: {
    targetUserId: string;
    productSlug: string;
}) {
    const admin = await verifyAdmin();
    if (!admin) return { error: "Unauthorized / Forbidden" };

    try {
        await prisma.notification.create({
            data: {
                userId: params.targetUserId,
                type: "VIP_APPROVED",
                title: "EA Setup Reminder",
                message: `Don't forget to complete setting up ${params.productSlug} on MetaTrader 5 to start automated tracking.`,
                link: `/trading-systems/${params.productSlug}`,
            },
        });

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "SEND_SETUP_REMINDER",
                targetType: "USER",
                targetId: params.targetUserId,
                details: { productSlug: params.productSlug },
            },
        });

        return { success: true };
    } catch (err: any) {
        return { error: err.message || "Failed to send setup reminder" };
    }
}

export async function adminBulkExtendGracePeriodAction(params: {
    userIds: string[];
    days: number;
}) {
    const admin = await verifyAdmin();
    if (!admin) return { error: "Unauthorized / Forbidden" };
    if (!params.userIds || params.userIds.length === 0) {
        return { error: "No users selected" };
    }

    try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + params.days);

        for (const userId of params.userIds) {
            // Check trading accounts for this user
            const accounts = await prisma.tradingAccount.findMany({
                where: { userId },
                select: { id: true },
            });

            if (accounts.length > 0) {
                for (const acc of accounts) {
                    await prisma.proEntitlement.upsert({
                        where: { tradingAccountId: acc.id },
                        create: {
                            userId,
                            tradingAccountId: acc.id,
                            status: "GRACE",
                            source: "MANUAL_ADMIN",
                            startsAt: new Date(),
                            expiresAt,
                            lastReviewedAt: new Date(),
                            reviewedBy: admin.id,
                        },
                        update: {
                            status: "GRACE",
                            startsAt: new Date(),
                            expiresAt,
                            lastReviewedAt: new Date(),
                            reviewedBy: admin.id,
                        },
                    });
                }
            } else {
                const existing = await prisma.proEntitlement.findFirst({
                    where: { userId, tradingAccountId: null },
                    orderBy: { createdAt: "desc" },
                });
                if (existing) {
                    await prisma.proEntitlement.update({
                        where: { id: existing.id },
                        data: {
                            status: "GRACE",
                            startsAt: new Date(),
                            expiresAt,
                            lastReviewedAt: new Date(),
                            reviewedBy: admin.id,
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
                            reviewedBy: admin.id,
                        },
                    });
                }
            }

            // Notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: "VIP_APPROVED",
                    title: "Grace Period Extended",
                    message: `Your VIP grace period has been extended by ${params.days} days by Administrator.`,
                    link: "/dashboard/accounts",
                },
            });
        }

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "BULK_EXTEND_GRACE_PERIOD",
                targetType: "USER_BATCH",
                targetId: params.userIds.join(","),
                details: { count: params.userIds.length, days: params.days },
            },
        });

        revalidatePath("/admin/ib");
        revalidatePath("/admin/ib/pipeline");
        revalidatePath("/admin/ib/traders");
        return { success: true, count: params.userIds.length };
    } catch (err: any) {
        return { error: err.message || "Failed to extend grace period in bulk" };
    }
}

export async function adminBulkSendSetupReminderAction(params: {
    userIds: string[];
    productSlug?: string;
}) {
    const admin = await verifyAdmin();
    if (!admin) return { error: "Unauthorized / Forbidden" };
    if (!params.userIds || params.userIds.length === 0) {
        return { error: "No users selected" };
    }

    const slug = params.productSlug || "gold-scalper-ninja";

    try {
        for (const userId of params.userIds) {
            await prisma.notification.create({
                data: {
                    userId,
                    type: "VIP_APPROVED",
                    title: "EA Setup Reminder",
                    message: `Don't forget to complete setting up ${slug} on MetaTrader 5 to start automated tracking.`,
                    link: `/trading-systems/${slug}`,
                },
            });
        }

        await prisma.auditLog.create({
            data: {
                adminId: admin.id,
                action: "BULK_SEND_SETUP_REMINDER",
                targetType: "USER_BATCH",
                targetId: params.userIds.join(","),
                details: { count: params.userIds.length, productSlug: slug },
            },
        });

        return { success: true, count: params.userIds.length };
    } catch (err: any) {
        return { error: err.message || "Failed to send setup reminders in bulk" };
    }
}

