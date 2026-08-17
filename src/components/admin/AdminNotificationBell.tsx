"use client";

import { useState, useEffect } from "react";
import { Bell, Crown, KeyRound, ExternalLink } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AdminNotification = {
    id: string;
    type:
        | "NEW_VIP_REQUEST"
        | "NEW_LICENSE_REQUEST"
        | "BROADCAST_SENT"
        | "SYSTEM_ALERT"
        | string;
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
};

type AdminStats = {
    pendingLicenses: number;
    pendingVipRequests: number;
    unreadNotifications: number;
};

export function AdminNotificationBell() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [stats, setStats] = useState<AdminStats>({
        pendingLicenses: 0,
        pendingVipRequests: 0,
        unreadNotifications: 0,
    });
    const [viewedPendingLicenses, setViewedPendingLicenses] = useState(0);
    const [viewedPendingVip, setViewedPendingVip] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Load viewed counts from local storage
        const storedLic = localStorage.getItem("adminViewedPendingCount");
        if (storedLic) {
            setViewedPendingLicenses(parseInt(storedLic, 10));
        }
        const storedVip = localStorage.getItem("adminViewedPendingVipCount");
        if (storedVip) {
            setViewedPendingVip(parseInt(storedVip, 10));
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/admin/notifications?limit=8");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setNotifications(data.data.notifications || []);
                        const pendingLic = data.data.pendingLicenses || 0;
                        const pendingVip = data.data.pendingVipRequests || 0;
                        setStats({
                            pendingLicenses: pendingLic,
                            pendingVipRequests: pendingVip,
                            unreadNotifications: data.data.unreadCount || 0,
                        });

                        // If already on pipeline page, sync VIP viewed count
                        if (pathname?.includes("/admin/ib/pipeline")) {
                            setViewedPendingVip(pendingVip);
                            localStorage.setItem(
                                "adminViewedPendingVipCount",
                                pendingVip.toString()
                            );
                        }
                        // If already on licenses pending page, sync license viewed count
                        if (
                            pathname ===
                            "/admin/trading-systems/accounts/pending"
                        ) {
                            setViewedPendingLicenses(pendingLic);
                            localStorage.setItem(
                                "adminViewedPendingCount",
                                pendingLic.toString()
                            );
                        }
                    }
                }
            } catch {
                console.error("Failed to fetch admin notifications");
            }
        };
        fetchData();

        // Poll every 45s for fresh admin notifications
        const interval = setInterval(fetchData, 45000);
        return () => clearInterval(interval);
    }, [pathname]);

    const markVipAsViewed = () => {
        const current = stats.pendingVipRequests;
        setViewedPendingVip(current);
        localStorage.setItem("adminViewedPendingVipCount", current.toString());
    };

    const markLicensesAsViewed = () => {
        const current = stats.pendingLicenses;
        setViewedPendingLicenses(current);
        localStorage.setItem("adminViewedPendingCount", current.toString());
    };

    // Calculate effective badge count (New pending items only)
    const effectivePendingLicenses = Math.max(
        0,
        stats.pendingLicenses - viewedPendingLicenses
    );
    const effectivePendingVip = Math.max(
        0,
        stats.pendingVipRequests - viewedPendingVip
    );
    const badgeCount = effectivePendingLicenses + effectivePendingVip;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 p-0 rounded-full text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                    aria-label="Admin Notifications"
                >
                    <Bell size={20} />
                    {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse shadow-sm">
                            {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-96 p-0 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden"
                align="end"
            >
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                        Admin Alerts
                    </h3>
                    {(stats.pendingVipRequests > 0 ||
                        stats.pendingLicenses > 0) && (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                            {stats.pendingVipRequests + stats.pendingLicenses}{" "}
                            Action Required
                        </span>
                    )}
                </div>

                {/* Pending VIP Requests Alert (High Priority) */}
                {stats.pendingVipRequests > 0 && (
                    <div
                        className="p-3.5 bg-amber-50/80 dark:bg-amber-500/10 border-b border-amber-200/50 dark:border-amber-500/20 cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-colors"
                        onClick={() => {
                            markVipAsViewed();
                            setIsOpen(false);
                            router.push("/admin/ib/pipeline?status=PENDING");
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                    <Crown size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                                        {stats.pendingVipRequests} pending VIP
                                        request
                                        {stats.pendingVipRequests > 1
                                            ? "s"
                                            : ""}
                                    </p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400/80 truncate">
                                        Review Partner Pro accounts in Pipeline
                                    </p>
                                </div>
                            </div>
                            <ExternalLink
                                size={14}
                                className="text-amber-600 dark:text-amber-400 shrink-0 ml-2"
                            />
                        </div>
                    </div>
                )}

                {/* Pending EA Licenses Alert */}
                {stats.pendingLicenses > 0 && (
                    <div
                        className="p-3.5 bg-orange-50/80 dark:bg-orange-500/10 border-b border-orange-200/50 dark:border-orange-500/20 cursor-pointer hover:bg-orange-100/80 dark:hover:bg-orange-500/20 transition-colors"
                        onClick={() => {
                            markLicensesAsViewed();
                            setIsOpen(false);
                            router.push(
                                "/admin/trading-systems/accounts/pending"
                            );
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                    <KeyRound size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-orange-900 dark:text-orange-300 text-xs">
                                        {stats.pendingLicenses} pending
                                        license{stats.pendingLicenses > 1 ? "s" : ""}
                                    </p>
                                    <p className="text-[11px] text-orange-700 dark:text-orange-400/80 truncate">
                                        Approve trading system EA licenses
                                    </p>
                                </div>
                            </div>
                            <ExternalLink
                                size={14}
                                className="text-orange-600 dark:text-orange-400 shrink-0 ml-2"
                            />
                        </div>
                    </div>
                )}

                {/* Notifications List */}
                <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Bell
                                size={22}
                                className="mx-auto mb-2 opacity-40"
                            />
                            <p className="text-xs font-medium">
                                No new notifications
                            </p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors",
                                    !n.isRead &&
                                        "bg-blue-50/40 dark:bg-blue-900/10"
                                )}
                                onClick={() => {
                                    if (n.link?.includes("pipeline")) {
                                        markVipAsViewed();
                                    } else if (n.link?.includes("pending")) {
                                        markLicensesAsViewed();
                                    }
                                    setIsOpen(false);
                                    router.push(n.link || "/admin");
                                }}
                            >
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                        {n.title}
                                    </p>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                        {formatDistanceToNow(
                                            new Date(n.createdAt),
                                            { addSuffix: true, locale: enUS }
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {n.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-2 border-t border-gray-100 dark:border-white/10 flex gap-2 bg-gray-50/50 dark:bg-white/5">
                    <Button
                        variant="ghost"
                        className="flex-1 text-xs h-8 font-bold text-gray-600 dark:text-gray-300 hover:text-amber-600"
                        onClick={() => {
                            markVipAsViewed();
                            setIsOpen(false);
                            router.push("/admin/ib/pipeline?status=PENDING");
                        }}
                    >
                        VIP Pipeline
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex-1 text-xs h-8 font-bold text-gray-600 dark:text-gray-300"
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/admin/notifications");
                        }}
                    >
                        Broadcasts
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
