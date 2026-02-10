
"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Define strict type for notification to avoid implicit any
type Notification = {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string; // serialized date
    link?: string;
};

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Fetch notifications
    const fetchNotifications = async () => {
        // In a real app we'd fetch from API
        // For now we simulate or fetch from a server action if available
        // I'll create a quick fetch to /api/user/notifications (Task 4.4 - not created yet)
        // Or simpler: fetch from simple server action or just use dummy until API is ready.
        // I will implement the API in Task 4.4, so for now I'll stub it or assume it exists.
        // Actually, I should create the API first if I want this to work.
        // But I'm doing 4.1 first. I'll write the fetch logic assuming the API route `GET /api/user/notifications` exists or will exist.
        // Spec 35.5 says "API: GET /api/user/notifications".

        try {
            const res = await fetch("/api/user/notifications?limit=5");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data.notifications);
                    setUnreadCount(data.data.unreadCount);
                }
            }
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Real-time subscription (Optional for Phase 4, spec 35.6)
        // For now, poll or just manual.
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id?: string) => {
        // Call API to mark as read
        try {
            const res = await fetch("/api/user/notifications", {
                method: "PATCH",
                body: JSON.stringify({ id: id || "ALL" }), // "ALL" to mark all
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (e) {
            console.error("Failed to mark read");
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl bg-white dark:bg-[#1E2028] border-gray-100 dark:border-white/5 shadow-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2 text-primary"
                            onClick={() => markAsRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No notifications</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer",
                                    !n.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                                )}
                                onClick={() => {
                                    if (!n.isRead) markAsRead(n.id);
                                    setIsOpen(false);
                                    if (n.link) {
                                        router.push(n.link);
                                    } else {
                                        // If no specific link, go to the notifications page to see full details
                                        router.push("/dashboard/notifications");
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={cn("text-sm font-medium", !n.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300")}>
                                        {n.title}
                                    </h4>
                                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-1">{n.message}</p>
                                <span className="text-[10px] text-gray-400">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: enUS })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-2 border-t border-gray-100 dark:border-white/5">
                    <Button
                        variant="ghost"
                        className="w-full text-xs text-gray-500 justify-center h-8"
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/dashboard/notifications");
                        }}
                    >
                        View All
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
