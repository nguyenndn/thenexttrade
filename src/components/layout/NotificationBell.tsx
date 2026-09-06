"use client";

import { useState, useMemo } from "react";
import {
    Bell,
    Trophy,
    Zap,
    PieChart,
    Check,
    Inbox,
    ShieldCheck,
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

function cleanNotificationTitle(text: string): string {
    if (!text) return "";
    return text.replace(/\p{Extended_Pictographic}\s*/gu, "").trim();
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "WEEKLY_REPORT":
        case "MONTHLY_REPORT":
        case "REPORT_NUDGE":
            return {
                Icon: PieChart,
                bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20",
                color: "text-emerald-600 dark:text-emerald-400",
            };
        case "FEATURE_UPDATE":
        case "SYNC_STALE":
        case "NO_TRADES_NUDGE":
        case "COACH_NUDGE":
            return {
                Icon: Zap,
                bg: "bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20",
                color: "text-amber-600 dark:text-amber-400",
            };
        case "MILESTONE":
            return {
                Icon: Trophy,
                bg: "bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20",
                color: "text-amber-600 dark:text-amber-400",
            };
        case "VIP_APPROVED":
            return {
                Icon: ShieldCheck,
                bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20",
                color: "text-emerald-600 dark:text-emerald-400",
            };
        case "SYSTEM":
        case "ONBOARDING":
        default:
            return {
                Icon: Bell,
                bg: "bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10",
                color: "text-gray-600 dark:text-gray-300",
            };
    }
};

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, isLoading } =
        useNotifications();

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

            const meta = (n.metadata as Record<string, any>) || {};
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
            } else if (
                n.type === "FEATURE_UPDATE" &&
                (meta.actionType === "OPEN_COACH_PLAN" ||
                    meta.signalType ||
                    meta.insightId ||
                    n.title.startsWith("Coach") ||
                    n.title.includes("Pattern") ||
                    n.title.includes("Leak Alert") ||
                    n.title.includes("Loss Streak") ||
                    n.title.includes("Experiment"))
            ) {
                normalizedType = "COACH_NUDGE";
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
                className="w-[calc(100vw-2rem)] sm:w-[480px] p-0 rounded-2xl bg-white dark:bg-[#1E2028] border-dashboard shadow-2xl"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-dashboard">
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
                        <button
                            className="text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            onClick={() => markAsRead()}
                        >
                            <Check size={13} className="text-amber-500" /> Mark all read
                        </button>
                    )}
                </div>

                {/* Tabs — Segmented Control */}
                <div className="p-2 border-b border-dashboard bg-gray-50/50 dark:bg-white/[0.01]">
                    <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                        {(Object.keys(TAB_CONFIG) as TabType[]).map((tabKey) => {
                            const tab = TAB_CONFIG[tabKey];
                            const isActive = activeTab === tabKey;
                            const count = unreadCounts[tabKey];

                            return (
                                <button
                                    key={tabKey}
                                    onClick={() => setActiveTab(tabKey)}
                                    className={cn(
                                        "py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all min-w-0 select-none",
                                        isActive
                                            ? "bg-white dark:bg-[#151925] text-gray-900 dark:text-white shadow-sm font-bold"
                                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon
                                        size={13}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn(isActive ? "text-amber-500" : "text-gray-400")}
                                    />
                                    <span className="truncate">{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={cn(
                                                "flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-mono font-bold rounded-full",
                                                isActive
                                                    ? "bg-amber-500 text-white"
                                                    : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                                            )}
                                        >
                                            {count > 99 ? "99+" : count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-dashboard/50">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-dashboard flex items-center justify-center">
                                <Bell
                                    size={22}
                                    className="text-gray-400 dark:text-gray-500"
                                />
                            </div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                {isLoading ? "Loading..." : "All caught up!"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                                Execution alerts, weekly reviews, and telemetry reports will appear here.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredNotifications.map((n) => {
                                const { Icon, bg, color } = getNotificationIcon(
                                    n.type
                                );
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "group relative flex items-start gap-3.5 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer",
                                            !n.isRead && "bg-amber-500/[0.025] dark:bg-amber-500/[0.03]"
                                        )}
                                        onClick={() => {
                                            if (!n.isRead) markAsRead(n.id);
                                            setIsOpen(false);
                                            const meta = (n.metadata as Record<string, any>) || {};
                                            if (
                                                meta.actionType === "OPEN_COACH_PLAN" ||
                                                n.link === "#coach-plan" ||
                                                n.link?.includes("action=coach-plan")
                                            ) {
                                                window.dispatchEvent(
                                                    new CustomEvent("open-coach-action-plan", {
                                                        detail: { notificationId: n.id, metadata: meta },
                                                    })
                                                );
                                                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/dashboard")) {
                                                    router.push("/dashboard?action=coach-plan");
                                                }
                                            } else if (n.onClick) {
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
                                        {/* Unread vertical indicator bar */}
                                        {!n.isRead && (
                                            <span className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-full" />
                                        )}

                                        {/* Left Icon */}
                                        <div
                                            className={cn(
                                                "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                                bg,
                                                color
                                            )}
                                        >
                                            <Icon size={16} strokeWidth={2} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex justify-between items-baseline mb-1 gap-2">
                                                <h4
                                                    className={cn(
                                                        "text-xs truncate tracking-tight",
                                                        !n.isRead
                                                            ? "text-gray-900 dark:text-white font-bold"
                                                            : "text-gray-700 dark:text-gray-300 font-medium"
                                                    )}
                                                >
                                                    {cleanNotificationTitle(n.title)}
                                                </h4>
                                                <span className="text-[10px] font-mono text-gray-400 shrink-0 whitespace-nowrap">
                                                    {formatDistanceToNow(
                                                        new Date(n.createdAt),
                                                        {
                                                            addSuffix: true,
                                                            locale: enUS,
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
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
                <div className="p-2.5 border-t border-dashboard bg-gray-50/50 dark:bg-white/[0.01] rounded-b-2xl">
                    <Button
                        variant="ghost"
                        className="w-full text-xs font-semibold text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 justify-center h-8 rounded-xl"
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
