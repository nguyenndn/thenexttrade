
"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, isLoading } = useNotifications();

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-100">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-[#1E2028]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-xl bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10 shadow-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
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
                            <p className="text-xs">{isLoading ? "Loading..." : "No notifications"}</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-4 border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer",
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

                <div className="p-2 border-t border-gray-200 dark:border-white/10">
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
