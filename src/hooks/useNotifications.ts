import { useState, useEffect } from "react";
import useSWR from "swr";

export interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
    link?: string;
    onClick?: () => void;
}

interface NotificationsResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        unreadCount: number;
    };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Local Notifications Store ---
let localNotifications: Notification[] = [];
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
    listeners.forEach((l) => l());
}

export const localNotificationStore = {
    add: (notification: Notification) => {
        // Check localStorage to see if this specific notification was already marked as read
        const isAlreadyRead =
            typeof window !== "undefined" &&
            localStorage.getItem(
                `read_local_notification_${notification.id}`
            ) === notification.title;

        const finalNotification = {
            ...notification,
            isRead: isAlreadyRead ? true : notification.isRead,
        };

        const exists = localNotifications.some(
            (n) => n.id === finalNotification.id
        );
        if (!exists) {
            localNotifications = [finalNotification, ...localNotifications];
            notifyListeners();
        } else {
            // Update existing
            localNotifications = localNotifications.map((n) =>
                n.id === finalNotification.id ? finalNotification : n
            );
            notifyListeners();
        }
    },
    remove: (id: string) => {
        localNotifications = localNotifications.filter((n) => n.id !== id);
        notifyListeners();
    },
    subscribe: (listener: Listener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    markAsRead: (id?: string) => {
        if (id && id !== "ALL") {
            localNotifications = localNotifications.map((n) => {
                if (n.id === id) {
                    if (typeof window !== "undefined") {
                        localStorage.setItem(
                            `read_local_notification_${n.id}`,
                            n.title
                        );
                    }
                    return { ...n, isRead: true };
                }
                return n;
            });
        } else {
            localNotifications = localNotifications.map((n) => {
                if (typeof window !== "undefined") {
                    localStorage.setItem(
                        `read_local_notification_${n.id}`,
                        n.title
                    );
                }
                return { ...n, isRead: true };
            });
        }
        notifyListeners();
    },
    getSnapshot: () => localNotifications,
};
// ---------------------------------

export function useNotifications(limit = 5) {
    const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
        `/api/user/notifications?limit=${limit}`,
        fetcher,
        {
            // Polling interval (every 60s)
            refreshInterval: 60000,
            // Deduplicate requests within 5 seconds (prevents spam on re-renders/focus)
            dedupingInterval: 5000,
            revalidateOnFocus: true,
            shouldRetryOnError: false,
        }
    );

    // Hydrate local notifications
    const [localNotifs, setLocalNotifs] =
        useState<Notification[]>(localNotifications);

    useEffect(() => {
        return localNotificationStore.subscribe(() => {
            setLocalNotifs(localNotificationStore.getSnapshot());
        });
    }, []);

    const markAsRead = async (id?: string) => {
        // 1. Mark local notifications as read
        localNotificationStore.markAsRead(id);

        // 2. Mark server notifications as read
        try {
            const res = await fetch("/api/user/notifications", {
                method: "PATCH",
                body: JSON.stringify({ id: id || "ALL" }),
            });

            if (res.ok) {
                // Revalidate immediately
                mutate();
            }
        } catch (e) {
            console.error("Failed to mark read");
        }
    };

    // Merge SWR notifications with local notifications
    const serverNotifs = data?.data?.notifications || [];
    const mergedNotifications = [...localNotifs, ...serverNotifs].sort(
        (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Local notifications are technically always unread for the badge, but we can respect their isRead prop
    const localUnreadCount = localNotifs.filter((n) => !n.isRead).length;
    const serverUnreadCount = data?.data?.unreadCount || 0;

    return {
        notifications: mergedNotifications,
        unreadCount: serverUnreadCount + localUnreadCount,
        isLoading,
        isError: error,
        markAsRead,
    };
}
