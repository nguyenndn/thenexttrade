"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface SystemDetailNavItem {
    id: string;
    num: string;
    label: string;
    icon: LucideIcon;
    category: string;
    title: string;
}

interface SystemDetailSidebarProps {
    items: SystemDetailNavItem[];
    activeTab: string;
    onSelect: (tabId: string) => void;
}

export function SystemDetailSidebar({
    items,
    activeTab,
    onSelect,
}: SystemDetailSidebarProps) {
    return (
        <aside className="w-full md:w-60 lg:w-64 shrink-0 border-b md:border-b-0 md:border-r border-dashboard dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#151925]">
            <div className="px-5 py-3.5 border-b border-dashboard dark:border-white/[0.06] hidden md:flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    CONTENTS
                </span>
                <span className="text-[10px] font-mono tabular-nums text-gray-400 dark:text-gray-500">
                    {items.length} SECTIONS
                </span>
            </div>

            <div className="flex md:flex-col overflow-x-auto p-2 md:p-2.5 gap-1.5 md:gap-1 scrollbar-hide md:sticky md:top-4">
                {items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <Button
                            variant="ghost"
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                "flex items-center justify-start gap-3 px-3 py-2.5 h-auto rounded-lg text-left text-xs transition-all duration-200 cursor-pointer shrink-0 md:shrink w-auto md:w-full font-normal",
                                isActive
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/25 shadow-sm hover:bg-amber-500/15"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
                            )}
                        >
                            <span
                                className={cn(
                                    "text-[11px] font-mono tabular-nums font-bold tracking-wider",
                                    isActive
                                        ? "text-amber-500"
                                        : "text-gray-400 dark:text-gray-600"
                                )}
                            >
                                {item.num}
                            </span>
                            <span className="truncate flex-1">{item.label}</span>
                            <Icon
                                size={14}
                                className={cn(
                                    "shrink-0 hidden md:block",
                                    isActive
                                        ? "text-amber-500"
                                        : "text-gray-400 dark:text-gray-600 opacity-60"
                                )}
                            />
                        </Button>
                    );
                })}
            </div>
        </aside>
    );
}
