"use client";

import { useState, useMemo } from "react";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationTabNav } from "./notification-bell/NotificationTabNav";
import { NotificationItem } from "./notification-bell/NotificationItem";
import {
    categorizeNotification,
    computeUnreadCounts,
    type TabType,
    type NormalizedNotification,
} from "./notification-bell/types";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, isLoading } =
        useNotifications(20);

    const normalizedNotifications = useMemo<NormalizedNotification[]>(() => {
        return notifications.map((n) => ({
            ...n,
            category: categorizeNotification(n),
        }));
    }, [notifications]);

    const unreadCounts = useMemo(
        () => computeUnreadCounts(normalizedNotifications),
        [normalizedNotifications]
    );

    const filteredNotifications = useMemo(() => {
        return normalizedNotifications.filter((n) => {
            if (activeTab === "All") return true;
            return n.category === activeTab;
        });
    }, [normalizedNotifications, activeTab]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 relative text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-100"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-[#1E2028]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[calc(100vw-2rem)] sm:w-[480px] p-0 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-2xl"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold h-7 px-2.5 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 gap-1.5"
                            onClick={() => markAsRead()}
                        >
                            <Check size={13} className="text-amber-500" /> Mark all read
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <NotificationTabNav
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    unreadCounts={unreadCounts}
                />

                {/* Notifications List */}
                <div className="max-h-[252px] overflow-y-auto custom-scrollbar divide-y divide-dashboard/50">
                    {filteredNotifications.length === 0 ? (
                        <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                {isLoading ? "Loading..." : "All caught up!"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                                Execution alerts, weekly reviews, and telemetry reports will appear here.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredNotifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onMarkAsRead={markAsRead}
                                    onClose={() => setIsOpen(false)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2.5 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] rounded-b-xl">
                    <Button
                        variant="ghost"
                        size="smd"
                        className="w-full text-xs font-semibold text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 justify-center rounded-lg"
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/dashboard/notifications");
                        }}
                    >
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
