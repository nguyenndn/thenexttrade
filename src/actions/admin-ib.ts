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
                title: "📌 EA Setup Reminder",
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
