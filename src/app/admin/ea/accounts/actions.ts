
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { approveAccountSchema, rejectAccountSchema } from "@/lib/validations/ea-license";
import { ErrorCode } from "@/lib/errors/ea-license";
import { ApproveAccountInput, RejectAccountInput } from "@/types/ea-license";
import { AccountStatus, NotificationType, NotificationPriority } from "@prisma/client";

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { isAuthorized: false, user: null };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") {
        return { isAuthorized: false, user };
    }

    return { isAuthorized: true, user };
}

export async function approveAccount(
    accountId: string,
    data: ApproveAccountInput
) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        // Validation
        const validated = approveAccountSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message || 'Validation failed' };
        }

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        if (license.status === AccountStatus.APPROVED) {
            return { success: false, error: ErrorCode.ACCOUNT_ALREADY_APPROVED };
        }

        // Update License
        await prisma.eALicense.update({
            where: { id: accountId },
            data: {
                status: AccountStatus.APPROVED,
                approvedBy: user.id,
                approvedAt: new Date(),
                startDate: new Date(),
                expiryDate: data.expiryDate || null,
                note: data.note,
                rejectedBy: null,
                rejectedAt: null,
                rejectReason: null,
            },
        });

        // Notify User
        await prisma.notification.create({
            data: {
                userId: license.userId,
                type: NotificationType.LICENSE_APPROVED,
                title: "License Approved",
                message: `Account ${license.accountNumber} (${license.broker}) has been approved. You can download the EA now.`,
                priority: NotificationPriority.HIGH,
                link: "/dashboard/trading-systems",
            },
        });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "LICENSE_APPROVED",
                targetType: "EALicense",
                targetId: accountId,
                details: { accountNumber: license.accountNumber, broker: license.broker, expiry: data.expiryDate },
            },
        });

        revalidatePath("/admin/ea");
        return { success: true };
    } catch (error) {
        console.error("approveAccount error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function rejectAccount(
    accountId: string,
    data: RejectAccountInput
) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const validated = rejectAccountSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message || 'Validation failed' };
        }

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        // Update License
        await prisma.eALicense.update({
            where: { id: accountId },
            data: {
                status: AccountStatus.REJECTED,
                rejectedBy: user.id,
                rejectedAt: new Date(),
                rejectReason: data.reason,
                approvedBy: null,
                approvedAt: null,
            },
        });

        // Notify User
        await prisma.notification.create({
            data: {
                userId: license.userId,
                type: NotificationType.LICENSE_REJECTED,
                title: "License Rejected",
                message: `Request for account ${license.accountNumber} was rejected. Reason: ${data.reason}`,
                priority: NotificationPriority.HIGH,
                link: "/dashboard/my-accounts",
            },
        });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "LICENSE_REJECTED",
                targetType: "EALicense",
                targetId: accountId,
                details: { accountNumber: license.accountNumber, reason: data.reason },
            },
        });

        revalidatePath("/admin/ea");
        return { success: true };
    } catch (error) {
        console.error("rejectAccount error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}

export async function deleteLicense(accountId: string) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: ErrorCode.NOT_ADMIN };

        const license = await prisma.eALicense.findUnique({
            where: { id: accountId },
        });

        if (!license) {
            return { success: false, error: ErrorCode.ACCOUNT_NOT_FOUND };
        }

        await prisma.eALicense.delete({
            where: { id: accountId },
        });

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "LICENSE_DELETED",
                targetType: "EALicense",
                targetId: accountId,
                details: { accountNumber: license.accountNumber, broker: license.broker },
            },
        });

        revalidatePath("/admin/ea");
        return { success: true };
    } catch (error) {
        console.error("deleteLicense error:", error);
        return { success: false, error: ErrorCode.INTERNAL_ERROR };
    }
}
