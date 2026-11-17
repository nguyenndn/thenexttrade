"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { NotificationItem } from "./NotificationItem";
import { MobileNotificationSheetHeader } from "./MobileNotificationSheetHeader";
import type { NormalizedNotification, TabType } from "./types";

interface MobileNotificationSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    activeTab: TabType;
    onSelectTab: (tab: TabType) => void;
    unreadCounts: Record<TabType, number>;
    unreadCount: number;
    notifications: NormalizedNotification[];
    isLoading: boolean;
    onMarkAsRead: (id?: string) => void;
}

export function MobileNotificationSheet({
    isOpen,
    onOpenChange,
    activeTab,
    onSelectTab,
    unreadCounts,
    unreadCount,
    notifications,
    isLoading,
    onMarkAsRead,
}: MobileNotificationSheetProps) {
    const router = useRouter();
    const unreadItems = notifications.filter((n) => !n.isRead);
    const earlierItems = notifications.filter((n) => n.isRead);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-white dark:bg-[#151925] border-l border-dashboard [&>button.absolute]:hidden"
            >
                <MobileNotificationSheetHeader
                    activeTab={activeTab}
                    onSelectTab={onSelectTab}
                    unreadCounts={unreadCounts}
                    unreadCount={unreadCount}
                    onMarkAsRead={onMarkAsRead}
                    onClose={() => onOpenChange(false)}
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                {isLoading ? "Loading..." : "All caught up!"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                                Execution alerts, weekly reviews, and telemetry reports will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="pb-2">
                            {unreadItems.length > 0 && (
                                <div>
                                    <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        New
                                    </div>
                                    <div className="divide-y divide-dashboard/50">
                                        {unreadItems.map((n) => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onMarkAsRead={onMarkAsRead}
                                                onClose={() => onOpenChange(false)}
                                                compactMobile
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {earlierItems.length > 0 && (
                                <div>
                                    <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Earlier
                                    </div>
                                    <div className="divide-y divide-dashboard/50">
                                        {earlierItems.map((n) => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onMarkAsRead={onMarkAsRead}
                                                onClose={() => onOpenChange(false)}
                                                compactMobile
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="smd"
                        className="w-full rounded-lg text-xs font-bold justify-center"
                        onClick={() => {
                            onOpenChange(false);
                            router.push("/dashboard/notifications");
                        }}
                    >
                        View all notifications
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
