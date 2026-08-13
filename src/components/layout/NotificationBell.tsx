"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
    Bell,
    Trophy,
    Zap,
    PieChart,
    Check,
    Inbox,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

type TabType = "All" | "Coach" | "Reports" | "System";

const TAB_CONFIG: Record<TabType, { label: string; icon: any }> = {
    All: { label: "All", icon: Inbox },
    Coach: { label: "Coach", icon: Zap },
    Reports: { label: "Reports", icon: PieChart },
    System: { label: "System", icon: Bell },
};

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "WEEKLY_REPORT":
        case "MONTHLY_REPORT":
        case "REPORT_NUDGE":
            return {
                Icon: PieChart,
                bg: "bg-emerald-100 dark:bg-emerald-500/20",
                color: "text-emerald-600 dark:text-emerald-400",
            };
        case "FEATURE_UPDATE":
        case "SYNC_STALE":
        case "NO_TRADES_NUDGE":
        case "COACH_NUDGE":
            return {
                Icon: Zap,
                bg: "bg-orange-100 dark:bg-orange-500/20",
                color: "text-orange-600 dark:text-orange-400",
            };
        case "MILESTONE":
            return {
                Icon: Trophy,
                bg: "bg-yellow-100 dark:bg-yellow-500/20",
                color: "text-yellow-600 dark:text-yellow-400",
            };
        case "SYSTEM":
        case "ONBOARDING":
        default:
            return {
                Icon: Bell,
                bg: "bg-blue-100 dark:bg-blue-500/20",
                color: "text-blue-600 dark:text-blue-400",
            };
    }
};

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, isLoading } =
        useNotifications();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 5);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 120;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    // Normalize notifications on client-side to dynamically resolve their UI categories
    const normalizedNotifications = useMemo(() => {
        return notifications.map((n) => {
            const milestoneTitles = [
                "Account Connected!",
                "First Trade Logged!",
                "First Report Ready!",
                "10 Trades Milestone!",
                "First Lesson Complete!",
                "50 Trades!",
                "Strategy Created!",
            ];

            let normalizedType = n.type;
            if (
                n.type === "FEATURE_UPDATE" &&
                milestoneTitles.some((title) => n.title.includes(title))
            ) {
                normalizedType = "MILESTONE";
            } else if (
                [
                    "LICENSE_APPROVED",
                    "LICENSE_REJECTED",
                    "LICENSE_EXPIRED",
                    "NEW_EA_VERSION",
                    "ANNOUNCEMENT",
                    "MAINTENANCE",
                    "PROMOTION",
                    "VIP_APPROVED",
                    "VIP_REJECTED",
                    "FEEDBACK_RECEIVED",
                ].includes(n.type)
            ) {
                normalizedType = "SYSTEM";
            }

            return {
                ...n,
                type: normalizedType,
            };
        });
    }, [notifications]);

    // Compute unread counts per tab
    const unreadCounts = useMemo(() => {
        return {
            All: normalizedNotifications.filter((n) => !n.isRead).length,
            Coach: normalizedNotifications.filter(
                (n) =>
                    !n.isRead &&
                    [
                        "FEATURE_UPDATE",
                        "SYNC_STALE",
                        "NO_TRADES_NUDGE",
                        "COACH_NUDGE",
                    ].includes(n.type)
            ).length,
            Reports: normalizedNotifications.filter(
                (n) =>
                    !n.isRead &&
                    [
                        "WEEKLY_REPORT",
                        "MONTHLY_REPORT",
                        "REPORT_NUDGE",
                    ].includes(n.type)
            ).length,
            System: normalizedNotifications.filter(
                (n) =>
                    !n.isRead &&
                    ["SYSTEM", "ONBOARDING", "MILESTONE"].includes(n.type)
            ).length,
        };
    }, [normalizedNotifications]);

    const filteredNotifications = useMemo(() => {
        return normalizedNotifications.filter((n) => {
            if (activeTab === "All") return true;
            if (activeTab === "Coach")
                return [
                    "FEATURE_UPDATE",
                    "SYNC_STALE",
                    "NO_TRADES_NUDGE",
                    "COACH_NUDGE",
                ].includes(n.type);
            if (activeTab === "Reports")
                return [
                    "WEEKLY_REPORT",
                    "MONTHLY_REPORT",
                    "REPORT_NUDGE",
                ].includes(n.type);
            if (activeTab === "System")
                return ["SYSTEM", "ONBOARDING", "MILESTONE"].includes(n.type);
            return true;
        });
    }, [normalizedNotifications, activeTab]);

    // Run handleScroll initially and whenever notifications or isOpen changes
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                handleScroll();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, normalizedNotifications]);

    // Handle window resizing
    useEffect(() => {
        window.addEventListener("resize", handleScroll);
        return () => window.removeEventListener("resize", handleScroll);
    }, []);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full border border-dashboard relative text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-100"
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
                className="w-[calc(100vw-2rem)] sm:w-[420px] p-0 rounded-2xl bg-white dark:bg-[#1E2028] border-dashboard shadow-2xl"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3">
                    <h3 className="text-sm font-semibold nav-menu-text text-gray-700 dark:text-gray-300">
                        Notifications
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => markAsRead()}
                        >
                            <Check size={14} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Tabs with Horizontal Scroll Controls */}
                <div className="relative px-5 border-b border-dashboard">
                    {/* Left Scroll Arrow */}
                    {showLeftArrow && (
                        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 bg-gradient-to-r from-white dark:from-[#1E2028] via-white/80 dark:via-[#1E2028]/80 to-transparent w-12 z-10 pointer-events-none">
                            <button
                                onClick={() => scroll("left")}
                                className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm pointer-events-auto transition-colors"
                                aria-label="Scroll left"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        </div>
                    )}

                    {/* Scrollable Tabs Wrapper */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex items-center gap-6 overflow-x-auto overflow-y-hidden no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-0.5"
                    >
                        {(Object.keys(TAB_CONFIG) as TabType[]).map(
                            (tabKey) => {
                                const tab = TAB_CONFIG[tabKey];
                                const isActive = activeTab === tabKey;
                                const count = unreadCounts[tabKey];

                                return (
                                    <button
                                        key={tabKey}
                                        onClick={() => setActiveTab(tabKey)}
                                        className={cn(
                                            "relative py-3 flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap nav-menu-text",
                                            isActive
                                                ? "text-primary shadow-sm"
                                                : "text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                        )}
                                    >
                                        <tab.icon
                                            size={16}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                        <span>{tab.label}</span>
                                        {count > 0 && (
                                            <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-bold text-white bg-primary rounded-full ml-0.5">
                                                {count > 99 ? "99+" : count}
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full" />
                                        )}
                                    </button>
                                );
                            }
                        )}
                    </div>

                    {/* Right Scroll Arrow */}
                    {showRightArrow && (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 bg-gradient-to-l from-white dark:from-[#1E2028] via-white/80 dark:via-[#1E2028]/80 to-transparent w-12 z-10 pointer-events-none">
                            <button
                                onClick={() => scroll("right")}
                                className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm pointer-events-auto transition-colors"
                                aria-label="Scroll right"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                <Bell
                                    size={24}
                                    className="text-gray-400 dark:text-gray-500"
                                />
                            </div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                                {isLoading ? "Loading..." : "All caught up!"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px] mx-auto">
                                Sync alerts, weekly reports, and AI insights
                                will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredNotifications.map((n) => {
                                const { Icon, bg, color } = getNotificationIcon(
                                    n.type
                                );
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "group relative flex items-start gap-4 p-4 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer",
                                            !n.isRead &&
                                                "bg-blue-50/40 dark:bg-blue-900/10"
                                        )}
                                        onClick={() => {
                                            if (!n.isRead) markAsRead(n.id);
                                            setIsOpen(false);
                                            if (n.onClick) {
                                                n.onClick();
                                            } else if (
                                                n.link &&
                                                n.link !== "/dashboard"
                                            ) {
                                                router.push(n.link);
                                            } else {
                                                router.push(
                                                    `/dashboard/notifications?id=${n.id}`
                                                );
                                            }
                                        }}
                                    >
                                        {/* Unread indicator dot (left absolute) */}
                                        {!n.isRead && (
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                        )}

                                        {/* Left Icon */}
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                                bg,
                                                color
                                            )}
                                        >
                                            <Icon size={18} strokeWidth={2.5} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h3
                                                    className={cn(
                                                        "text-sm font-semibold truncate",
                                                        !n.isRead
                                                            ? "text-gray-900 dark:text-white"
                                                            : "text-gray-700 dark:text-gray-300"
                                                    )}
                                                >
                                                    {n.title}
                                                </h3>
                                                <span className="text-[10px] font-medium text-gray-500 shrink-0 whitespace-nowrap pt-0.5">
                                                    {formatDistanceToNow(
                                                        new Date(n.createdAt),
                                                        {
                                                            addSuffix: true,
                                                            locale: enUS,
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-dashboard bg-gray-50/50 dark:bg-[#1E2028]/50 rounded-b-2xl">
                    <Button
                        variant="ghost"
                        className="w-full text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white justify-center h-9"
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
