import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

const NOTIFICATION_MAX_ATTEMPTS = 3;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function persistAdminNotifications(
    notificationsData: Array<{
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        link: string;
        priority: NotificationPriority;
        dedupeKey: string;
    }>,
    context: string
): Promise<boolean> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= NOTIFICATION_MAX_ATTEMPTS; attempt++) {
        try {
            await prisma.notification.createMany({
                data: notificationsData,
                skipDuplicates: true,
            });
            return true;
        } catch (error) {
            lastError = error;
            if (attempt < NOTIFICATION_MAX_ATTEMPTS) {
                await sleep(100 * attempt);
            }
        }
    }

    console.error(
        `[${context}] Failed to persist admin notifications after ${NOTIFICATION_MAX_ATTEMPTS} attempts:`,
        lastError
    );

    // Durable failure record for operations. Notification delivery must not
    // roll back the business action that triggered it.
    try {
        if (typeof prisma.securityLog?.create === "function") {
            await prisma.securityLog.create({
                data: {
                    type: "ADMIN_NOTIFICATION_FAILED",
                    ip: "system",
                    path: context,
                    detail: JSON.stringify({
                        adminCount: notificationsData.length,
                        title: notificationsData[0]?.title ?? null,
                        error:
                            lastError instanceof Error
                                ? lastError.message
                                : String(lastError),
                    }),
                },
            });
        }
    } catch (logError) {
        console.error(
            `[${context}] Failed to record notification delivery failure:`,
            logError
        );
    }

    return false;
}

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
            link: `${NOTIFICATION_ROUTES.ADMIN_USERS}/${params.userId}?tab=vip-broker`,
            priority: NotificationPriority.HIGH,
            dedupeKey: `admin-vip-req-${params.vipRequestId}-${admin.userId}`,
        }));

        await persistAdminNotifications(
            notificationsData,
            "notifyAdminsOfVipRequest"
        );
    } catch (error) {
        console.error("[notifyAdminsOfVipRequest error]:", error);
        // Non-blocking: we log and allow parent action to succeed
    }
}

interface NotifyLicenseRequestParams {
    licenseId: string;
    userId: string;
    broker: string;
    accountNumber: string;
    userEmail?: string | null;
    userName?: string | null;
}

/**
 * Sends in-app high-priority notification to all ADMIN users whenever a
 * trader submits (or re-opens) an EA license request. Persisting the event
 * means the admin notification center no longer has to synthesize it on
 * every read, and read state can be tracked per event.
 */
export async function notifyAdminsOfLicenseRequest(
    params: NotifyLicenseRequestParams
) {
    try {
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (!admins.length) return;

        const traderIdentifier =
            params.userName || params.userEmail || "A trader";
        const title = `New License Request: ${params.broker} (${params.accountNumber})`;
        const message = `${traderIdentifier} requested an EA license for ${params.broker} account ${params.accountNumber}.`;

        const notificationsData = admins.map((admin) => ({
            userId: admin.userId,
            type: NotificationType.ANNOUNCEMENT,
            title,
            message,
            link: NOTIFICATION_ROUTES.EA_PENDING_ADMIN,
            priority: NotificationPriority.HIGH,
            dedupeKey: `admin-license-req-${params.licenseId}-${admin.userId}`,
        }));

        await persistAdminNotifications(
            notificationsData,
            "notifyAdminsOfLicenseRequest"
        );
    } catch (error) {
        console.error("[notifyAdminsOfLicenseRequest error]:", error);
        // Non-blocking: notification delivery must not roll back the request.
    }
}

interface NotifyNewAccountParams {
    accountId: string;
    userId: string;
    broker?: string | null;
    accountNumber?: string | null;
    server?: string | null;
    userEmail?: string | null;
    userName?: string | null;
    link?: string | null;
}

/**
 * Sends in-app notification to all ADMIN users whenever a trader connects
 * a new trading account (Free, Partner Pro or API flow), so the admin hub
 * always reflects new account activity even when no VIP request is created.
 */
export async function notifyAdminsOfNewAccount(params: NotifyNewAccountParams) {
    try {
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (!admins.length) return;

        const traderIdentifier =
            params.userName || params.userEmail || "A trader";
        const brokerLabel = params.broker || "Unknown broker";
        const accountLabel = params.accountNumber
            ? ` #${params.accountNumber}`
            : "";
        const title = `New Trading Account: ${brokerLabel}${
            params.accountNumber ? ` (${params.accountNumber})` : ""
        }`;
        const serverStr = params.server ? ` • Server: ${params.server}` : "";
        const message = `${traderIdentifier} connected a new trading account (${brokerLabel}${accountLabel})${serverStr}.`;
        const targetLink =
            params.link ||
            `${NOTIFICATION_ROUTES.ADMIN_USERS}/${params.userId}?tab=accounts`;

        const notificationsData = admins.map((admin) => ({
            userId: admin.userId,
            type: NotificationType.ANNOUNCEMENT,
            title,
            message,
            link: targetLink,
            priority: NotificationPriority.NORMAL,
            dedupeKey: `admin-new-account-${params.accountId}-${admin.userId}`,
        }));

        await persistAdminNotifications(
            notificationsData,
            "notifyAdminsOfNewAccount"
        );
    } catch (error) {
        console.error("[notifyAdminsOfNewAccount error]:", error);
        // Non-blocking: we log and allow parent action to succeed
    }
}

interface NotifySyncFailureParams {
    jobId: string;
    userId: string;
    broker: string;
    accountNumber: string;
    server?: string | null;
    errorMessage: string;
}

/**
 * Sends in-app urgent notification to all ADMIN users when
 * MT5 sync fails after 5 handshake attempts.
 */
export async function notifyAdminsOfSyncFailure(params: NotifySyncFailureParams) {
    try {
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (!admins.length) return;

        const title = `Cloud Sync 5x Timeout: ${params.broker} #${params.accountNumber}`;
        const serverStr = params.server ? ` (${params.server})` : "";
        const message = `Account #${params.accountNumber}${serverStr} on ${params.broker} failed 5 connection attempts. Reason: ${params.errorMessage}`;

        const notificationsData = admins.map((admin) => ({
            userId: admin.userId,
            type: NotificationType.ANNOUNCEMENT,
            title,
            message,
            link: `/admin/trading-accounts?search=${encodeURIComponent(params.accountNumber)}`,
            priority: NotificationPriority.URGENT,
            dedupeKey: `admin-sync-fail-${params.jobId}-${admin.userId}`,
        }));

        await persistAdminNotifications(
            notificationsData,
            "notifyAdminsOfSyncFailure"
        );
    } catch (error) {
        console.error("[notifyAdminsOfSyncFailure error]:", error);
    }
}

