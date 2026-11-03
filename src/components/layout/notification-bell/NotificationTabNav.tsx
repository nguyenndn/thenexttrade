"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TAB_CONFIG, type TabType } from "./types";

interface NotificationTabNavProps {
    activeTab: TabType;
    onSelectTab: (tab: TabType) => void;
    unreadCounts: Record<TabType, number>;
}

export function NotificationTabNav({
    activeTab,
    onSelectTab,
    unreadCounts,
}: NotificationTabNavProps) {
    return (
        <div className="p-2 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01]">
            <div
                role="tablist"
                aria-label="Notification Categories"
                className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg"
            >
                {(Object.keys(TAB_CONFIG) as TabType[]).map((tabKey) => {
                    const tab = TAB_CONFIG[tabKey];
                    const isActive = activeTab === tabKey;
                    const count = unreadCounts[tabKey];

                    return (
                        <Button
                            key={tabKey}
                            type="button"
                            variant="ghost"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onSelectTab(tabKey)}
                            className={cn(
                                "h-auto border-0 py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all min-w-0 select-none",
                                isActive
                                    ? "bg-white dark:bg-[#151925] text-gray-900 dark:text-white shadow-sm font-bold hover:bg-white hover:text-gray-900 dark:hover:bg-[#151925] dark:hover:text-white"
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
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
