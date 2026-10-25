"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Bell, CheckCheck, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AdminNotificationItem = {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    priority: string;
};

interface AdminNotificationListProps {
    initialNotifications: AdminNotificationItem[];
    initialNextCursor: string | null;
    initialUnreadCount: number;
    filter: string;
}

const EMPTY_COPY: Record<string, string> = {
    ALL: "No notifications yet.",
    UNREAD: "You are all caught up.",
    ACCOUNTS: "No account notifications yet.",
    VIP: "No VIP notifications yet.",
    LICENSES: "No license notifications yet.",
    BROADCASTS: "No broadcast notifications yet.",
    SYSTEM: "No system notifications yet.",
};

export function AdminNotificationList({
    initialNotifications,
    initialNextCursor,
    initialUnreadCount,
    filter,
}: AdminNotificationListProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState(
        initialNotifications || []
    );
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const markOneAsRead = async (notificationId: string) => {
        const previous = notifications;
        const previousUnreadCount = unreadCount;

        setNotifications((current) =>
            current.map((notification) =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
        setUnreadCount((current) => Math.max(0, current - 1));

        try {
            const res = await fetch("/api/user/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: notificationId }),
            });
            const payload = await res.json().catch(() => null);

            if (!res.ok || !payload?.success) {
                throw new Error(
                    payload?.error || "Failed to mark notification as read"
                );
            }

            router.refresh();
        } catch (error) {
            setNotifications(previous);
            setUnreadCount(previousUnreadCount);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to mark notification as read"
            );
        }
    };

    const markAllAsRead = async () => {
        setIsMarkingAll(true);
        try {
            const res = await fetch("/api/user/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: "ALL" }),
            });
            const payload = await res.json().catch(() => null);

            if (!res.ok || !payload?.success) {
                throw new Error(
                    payload?.error || "Failed to mark all notifications as read"
                );
            }

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );
            setUnreadCount(0);
            router.refresh();
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to mark all notifications as read"
            );
        } finally {
            setIsMarkingAll(false);
        }
    };

    const loadOlder = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const params = new URLSearchParams({ limit: "15" });
            if (filter && filter !== "ALL") {
                params.set("filter", filter);
            }
            params.set("cursor", nextCursor);

            const res = await fetch(
                `/api/admin/notifications?${params.toString()}`
            );
            const payload = await res.json().catch(() => null);

            if (!res.ok || !payload?.success) {
                throw new Error(
                    payload?.error || "Failed to load older notifications"
                );
            }

            const fresh: AdminNotificationItem[] =
                payload.data.notifications || [];
            const knownIds = new Set(
                notifications.map((notification) => notification.id)
            );

            setNotifications((current) => [
                ...current,
                ...fresh.filter((item) => !knownIds.has(item.id)),
            ]);
            setNextCursor(payload.data.nextCursor || null);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load older notifications"
            );
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#151925] rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {unreadCount > 0
                        ? `${unreadCount} unread notification${
                              unreadCount > 1 ? "s" : ""
                          }`
                        : "All caught up"}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-gray-600 dark:text-gray-300"
                    onClick={() => void markAllAsRead()}
                    disabled={isMarkingAll || unreadCount === 0}
                >
                    {isMarkingAll ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <CheckCheck size={14} />
                    )}
                    Mark all as read
                </Button>
            </div>

            {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-600 dark:text-gray-400">
                    <Bell size={44} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">
                        {EMPTY_COPY[filter] || EMPTY_COPY.ALL}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {notifications.map((notification) => (
                        <Button
                            key={notification.id}
                            type="button"
                            variant="ghost"
                            className={cn(
                                "w-full h-auto block text-left font-normal rounded-none px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
                                !notification.isRead &&
                                    "bg-blue-50/40 dark:bg-blue-900/10"
                            )}
                            onClick={() => {
                                if (!notification.isRead) {
                                    void markOneAsRead(notification.id);
                                }
                                router.push(notification.link || "/admin");
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                        {notification.message}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {!notification.isRead && (
                                        <span
                                            className="w-2 h-2 rounded-full bg-blue-500"
                                            aria-label="Unread"
                                        />
                                    )}
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {formatDistanceToNow(
                                            new Date(notification.createdAt),
                                            { addSuffix: true, locale: enUS }
                                        )}
                                    </span>
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            )}

            {nextCursor && (
                <div className="p-3 border-t border-gray-100 dark:border-white/10 flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-gray-600 dark:text-gray-300"
                        onClick={() => void loadOlder()}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <ChevronDown size={14} />
                        )}
                        Load older notifications
                    </Button>
                </div>
            )}
        </div>
    );
}
