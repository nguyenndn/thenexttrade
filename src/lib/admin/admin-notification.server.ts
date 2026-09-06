import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

interface NotifyVipRequestParams {
    vipRequestId: string;
    userId: string;
    broker: string;
    accountNumber: string;
    balance?: string | null;
    userEmail?: string | null;
    userName?: string | null;
}

/**
 * Sends in-app high-priority notification to all ADMIN users whenever
 * a trader submits a new VIP request.
 */
export async function notifyAdminsOfVipRequest(params: NotifyVipRequestParams) {
    try {
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (!admins.length) return;

        const traderIdentifier =
            params.userName || params.userEmail || "A trader";
        const title = `New VIP Request: ${params.broker} (${params.accountNumber})`;
        const balanceStr = params.balance ? ` • Balance: $${params.balance}` : "";
        const message = `${traderIdentifier} requested VIP Partner Pro for ${params.broker} account ${params.accountNumber}${balanceStr}.`;

        const notificationsData = admins.map((admin) => ({
            userId: admin.userId,
            type: NotificationType.ANNOUNCEMENT,
            title,
            message,
            link: `${NOTIFICATION_ROUTES.VIP_PIPELINE_ADMIN}?status=PENDING`,
            priority: NotificationPriority.HIGH,
            dedupeKey: `admin-vip-req-${params.vipRequestId}-${admin.userId}`,
        }));

        await prisma.notification.createMany({
            data: notificationsData,
            skipDuplicates: true,
        });
    } catch (error) {
        console.error("[notifyAdminsOfVipRequest error]:", error);
        // Non-blocking: we log and allow parent action to succeed
    }
}
