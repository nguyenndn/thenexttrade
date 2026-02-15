import useSWR from 'swr';

export interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
    link?: string;
}

interface NotificationsResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        unreadCount: number;
    };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

    const markAsRead = async (id?: string) => {
        try {
            // Optimistic update (optional, skipping for simplicity unless needed)
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

    return {
        notifications: data?.data?.notifications || [],
        unreadCount: data?.data?.unreadCount || 0,
        isLoading,
        isError: error,
        markAsRead
    };
}
