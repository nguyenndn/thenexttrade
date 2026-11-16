"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    BellDot,
    Crown,
    Cpu,
    KeyRound,
    Megaphone,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import type { AdminNotificationFilter } from "@/lib/admin/admin-notification-center.server";

interface AdminNotificationTabConfig {
    key: AdminNotificationFilter;
    label: string;
    icon: LucideIcon;
}

const ADMIN_NOTIFICATION_TAB_ITEMS: AdminNotificationTabConfig[] = [
    { key: "ALL", label: "All", icon: Bell },
    { key: "UNREAD", label: "Unread", icon: BellDot },
    { key: "ACCOUNTS", label: "Accounts", icon: Wallet },
    { key: "VIP", label: "VIP", icon: Crown },
    { key: "LICENSES", label: "Licenses", icon: KeyRound },
    { key: "BROADCASTS", label: "Broadcasts", icon: Megaphone },
    { key: "SYSTEM", label: "System", icon: Cpu },
];

interface AdminNotificationTabsProps {
    activeTab: AdminNotificationFilter;
    unreadCount: number;
}

export function AdminNotificationTabs({
    activeTab,
    unreadCount,
}: AdminNotificationTabsProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [selectedTab, setSelectedTab] =
        useState<AdminNotificationFilter>(activeTab);

    useEffect(() => {
        setSelectedTab(activeTab);
    }, [activeTab]);

    const handleTabChange = (nextValue: string) => {
        const nextTab = nextValue as AdminNotificationFilter;
        setSelectedTab(nextTab);
        const targetHref =
            nextTab === "ALL"
                ? "/admin/notifications"
                : `/admin/notifications?tab=${nextTab}`;
        startTransition(() => {
            router.push(targetHref, { scroll: false });
        });
    };

    return (
        <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
            tabsId="admin-notifications-tabs"
        >
            <div className="overflow-x-auto scrollbar-hide flex">
                <TabsList className="shrink-0">
                    {ADMIN_NOTIFICATION_TAB_ITEMS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = selectedTab === tab.key;
                        const showBadge =
                            tab.key === "UNREAD" && unreadCount > 0;

                        return (
                            <TabsTrigger
                                key={tab.key}
                                value={tab.key}
                                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                                activeIndicatorClassName="!bg-gold shadow-sm shadow-amber-500/20 border-0"
                                activeTextClassName="!text-white"
                            >
                                <Icon
                                    size={15}
                                    className={cn(
                                        isActive
                                            ? "text-white"
                                            : "text-gray-400 dark:text-gray-500"
                                    )}
                                />
                                <span className="whitespace-nowrap">
                                    {tab.label}
                                </span>
                                {showBadge && (
                                    <span
                                        className={cn(
                                            "text-[11px] px-2 py-0.5 rounded-lg font-mono font-bold tabular-nums transition-colors",
                                            isActive
                                                ? "bg-white/20 text-white"
                                                : "bg-amber-500/15 text-amber-700 dark:bg-gold/15 dark:text-gold"
                                        )}
                                    >
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </div>
        </Tabs>
    );
}
