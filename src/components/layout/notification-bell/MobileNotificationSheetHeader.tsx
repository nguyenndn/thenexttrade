"use client";

import { useRouter } from "next/navigation";
import { Check, CheckCheck, ChevronDown, Settings, X } from "lucide-react";
import { SheetDescription, SheetTitle } from "@/components/ui/Sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TAB_CONFIG, type TabType } from "./types";

interface MobileNotificationSheetHeaderProps {
    activeTab: TabType;
    onSelectTab: (tab: TabType) => void;
    unreadCounts: Record<TabType, number>;
    unreadCount: number;
    onMarkAsRead: (id?: string) => void;
    onClose: () => void;
}

export function MobileNotificationSheetHeader({
    activeTab,
    onSelectTab,
    unreadCounts,
    unreadCount,
    onMarkAsRead,
    onClose,
}: MobileNotificationSheetHeaderProps) {
    const router = useRouter();
    const activeTabConfig = TAB_CONFIG[activeTab];
    const activeCount = unreadCounts[activeTab];

    return (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
            <SheetTitle className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                Notifications
            </SheetTitle>
            <SheetDescription className="sr-only">
                Recent execution alerts, coaching nudges, and reports
            </SheetDescription>

            <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Filter notification category"
                            className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1.5 border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04]"
                        >
                            <span>{activeTabConfig.label}</span>
                            {activeCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold tabular-nums">
                                    {activeCount > 99 ? "99+" : activeCount}
                                </span>
                            )}
                            <ChevronDown size={14} className="text-gray-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl p-1.5 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-xl"
                    >
                        {(Object.keys(TAB_CONFIG) as TabType[]).map((tabKey) => {
                            const tab = TAB_CONFIG[tabKey];
                            const Icon = tab.icon;
                            const count = unreadCounts[tabKey];
                            const selected = activeTab === tabKey;
                            return (
                                <DropdownMenuItem
                                    key={tabKey}
                                    onClick={() => onSelectTab(tabKey)}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer",
                                        selected
                                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
                                            : "text-gray-700 dark:text-gray-300 font-medium"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon
                                            size={14}
                                            className={cn(
                                                selected ? "text-amber-500" : "text-gray-400"
                                            )}
                                        />
                                        <span>{tab.label}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        {count > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold tabular-nums">
                                                {count > 99 ? "99+" : count}
                                            </span>
                                        )}
                                        {selected && <Check size={13} className="text-amber-500" />}
                                    </span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Mark all notifications as read"
                    disabled={unreadCount === 0}
                    onClick={() => onMarkAsRead()}
                    className="w-8 h-8 rounded-lg text-amber-600 dark:text-amber-400 disabled:text-gray-300 dark:disabled:text-gray-600"
                >
                    <CheckCheck size={17} />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Notification settings"
                    onClick={() => {
                        onClose();
                        router.push("/dashboard/settings");
                    }}
                    className="w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400"
                >
                    <Settings size={16} />
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Close notifications"
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg border-transparent text-gray-500 dark:text-gray-400"
                >
                    <X size={18} />
                </Button>
            </div>
        </div>
    );
}
