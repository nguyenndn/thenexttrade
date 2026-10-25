import { prisma } from "@/lib/prisma";
import { AccountStatus, Prisma, NotificationType } from "@prisma/client";

export const ADMIN_NOTIFICATION_FILTERS = [
    "ALL",
    "UNREAD",
    "ACCOUNTS",
    "VIP",
    "LICENSES",
    "BROADCASTS",
    "SYSTEM",
] as const;

export type AdminNotificationFilter =
    (typeof ADMIN_NOTIFICATION_FILTERS)[number];

export const ADMIN_NOTIFICATION_DEFAULT_LIMIT = 15;
export const ADMIN_NOTIFICATION_MAX_LIMIT = 50;

export interface AdminNotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    priority: string;
}

export interface AdminNotificationFeed {
    notifications: AdminNotificationItem[];
    unreadCount: number;
    pendingLicenses: number;
    pendingVipRequests: number;
    nextCursor: string | null;
}

const DEDUPE_PREFIX: Record<
    Exclude<AdminNotificationFilter, "ALL" | "UNREAD">,
    string
> = {
    ACCOUNTS: "admin-new-account-",
    VIP: "admin-vip-req-",
    LICENSES: "admin-license-req-",
    BROADCASTS: "",
    SYSTEM: "",
};

function resolveFilterWhere(
    filter: AdminNotificationFilter
): Prisma.NotificationWhereInput {
    switch (filter) {
        case "UNREAD":
            return { isRead: false };
        case "ACCOUNTS":
            return { dedupeKey: { startsWith: DEDUPE_PREFIX.ACCOUNTS } };
        case "VIP":
            return { dedupeKey: { startsWith: DEDUPE_PREFIX.VIP } };
        case "LICENSES":
            return { dedupeKey: { startsWith: DEDUPE_PREFIX.LICENSES } };
        case "BROADCASTS":
            return { broadcastId: { not: null } };
        case "SYSTEM":
            return {
                type: {
                    in: [
                        NotificationType.MAINTENANCE,
                        NotificationType.FEATURE_UPDATE,
                        NotificationType.PROMOTION,
                    ],
                },
            };
        case "ALL":
        default:
            return {};
    }
}

function normalizeFilter(value: string | null): AdminNotificationFilter {
    const upper = (value || "ALL").toUpperCase();
    return (ADMIN_NOTIFICATION_FILTERS as readonly string[]).includes(upper)
        ? (upper as AdminNotificationFilter)
        : "ALL";
}

function normalizeLimit(value: number | string | null): number {
    const parsed =
        typeof value === "number" ? value : parseInt(value || "", 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return ADMIN_NOTIFICATION_DEFAULT_LIMIT;
    }
    return Math.min(Math.floor(parsed), ADMIN_NOTIFICATION_MAX_LIMIT);
}

/**
 * Single read model shared by the admin bell and the full notification
 * center. It returns persisted notifications only — pending VIP/license
 * work is exposed as separate counts and never counted as an unread
 * notification, so one event can never be counted twice.
 */
export async function loadAdminNotificationFeed(params: {
    adminUserId: string;
    filter?: string | null;
    limit?: number | string | null;
    cursor?: string | null;
}): Promise<AdminNotificationFeed> {
    const filter = normalizeFilter(params.filter ?? null);
    const limit = normalizeLimit(params.limit ?? null);

    const cursorDate = params.cursor ? new Date(params.cursor) : null;
    const hasValidCursor =
        cursorDate !== null && !Number.isNaN(cursorDate.getTime());

    const filterWhere = resolveFilterWhere(filter);
    const where: Prisma.NotificationWhereInput = {
        userId: params.adminUserId,
        ...filterWhere,
        ...(hasValidCursor ? { createdAt: { lt: cursorDate } } : {}),
    };

    const [rows, unreadCount, pendingLicenses, pendingVipRequests] =
        await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: limit + 1,
            }),
            prisma.notification.count({
                where: { userId: params.adminUserId, isRead: false },
            }),
            prisma.eALicense.count({
                where: { status: AccountStatus.PENDING },
            }),
            prisma.vipRequest.count({ where: { status: "PENDING" } }),
        ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    return {
        notifications: pageRows.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link || "/admin",
            isRead: n.isRead,
            readAt: n.readAt ? n.readAt.toISOString() : null,
            createdAt: n.createdAt.toISOString(),
            priority: n.priority,
        })),
        unreadCount,
        pendingLicenses,
        pendingVipRequests,
        nextCursor: hasMore
            ? pageRows[pageRows.length - 1]?.createdAt.toISOString() ?? null
            : null,
    };
}
