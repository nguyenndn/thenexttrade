
"use client";

import { useState, useEffect } from "react";
import { Bell, Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AdminNotification = {
    id: string;
    type: "NEW_LICENSE_REQUEST" | "BROADCAST_SENT" | "SYSTEM_ALERT";
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
};

type AdminStats = {
    pendingLicenses: number;
    unreadNotifications: number;
};

export function AdminNotificationBell() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [stats, setStats] = useState<AdminStats>({ pendingLicenses: 0, unreadNotifications: 0 });
    const [viewedPendingCount, setViewedPendingCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Load viewed count from local storage
        const stored = localStorage.getItem("adminViewedPendingCount");
        if (stored) {
            setViewedPendingCount(parseInt(stored, 10));
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/admin/notifications?limit=5");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setNotifications(data.data.notifications);
                        setStats({
                            pendingLicenses: data.data.pendingLicenses,
                            unreadNotifications: data.data.unreadCount,
                        });

                        // If we are already on the pending page, update viewed count to match current pending
                        if (pathname === "/admin/ea/accounts/pending") {
                            const current = data.data.pendingLicenses;
                            setViewedPendingCount(current);
                            localStorage.setItem("adminViewedPendingCount", current.toString());
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch admin notifications");
            }
        };
        fetchData();

        // Optional: Poll every minute
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [pathname]); // Re-run fetch/check when pathname changes

    const markAsViewed = () => {
        const current = stats.pendingLicenses;
        setViewedPendingCount(current);
        localStorage.setItem("adminViewedPendingCount", current.toString());
    };

    // Calculate effective badge count (New items only)
    const effectivePendingCount = Math.max(0, stats.pendingLicenses - viewedPendingCount);
    // unreadNotifications is currently hardcoded to 0 in API, so mostly relying on pending licenses
    // If we enable real notifications later, we sum them up here.
    const badgeCount = effectivePendingCount + stats.unreadNotifications;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <Bell size={20} />
                    {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0 rounded-xl bg-white dark:bg-[#1E2028] border-gray-100 dark:border-white/5 shadow-xl" align="end">
                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white">Admin Alerts</h3>
                </div>

                {/* Pending Licenses Alert */}
                {stats.pendingLicenses > 0 && (
                    <div
                        className="p-4 bg-orange-50 dark:bg-orange-900/10 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                        onClick={() => {
                            markAsViewed();
                            setIsOpen(false);
                            router.push("/admin/ea/accounts/pending");
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-orange-700 dark:text-orange-300 text-sm">
                                    {stats.pendingLicenses} pending requests
                                </p>
                                <p className="text-xs text-orange-600 dark:text-orange-400">Click to view details</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications List */}
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            <Bell size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No new notifications</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors",
                                    !n.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                                )}
                                onClick={() => {
                                    // If clicking a pending request notification, mark as viewed
                                    if (n.link.includes('pending')) {
                                        markAsViewed();
                                    }
                                    setIsOpen(false);
                                    router.push(n.link);
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: enUS })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-2 border-t border-gray-100 dark:border-white/5 flex gap-2 bg-gray-50/50 dark:bg-white/5">
                    <Button variant="ghost" className="flex-1 text-xs h-8 text-gray-600 dark:text-gray-300" onClick={() => {
                        markAsViewed();
                        setIsOpen(false);
                        router.push("/admin/ea/accounts/pending");
                    }}>
                        View Pending
                    </Button>
                    <Button variant="ghost" className="flex-1 text-xs h-8 text-gray-600 dark:text-gray-300" onClick={() => { setIsOpen(false); router.push("/admin/notifications"); }}>
                        Broadcasts
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
