"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    FileText,
    Clock,
    Route,
    BarChart3,
    FileSpreadsheet,
    AlertTriangle,
    Brain,
    CalendarDays,
    CalendarRange,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Built-in icon mapping for known routes
// This avoids Server→Client serialization issues with Lucide components
const routeIconMap: Record<string, LucideIcon> = {
    "/dashboard/journal": FileText,
    "/dashboard/sessions": Clock,
    "/dashboard/strategies": Route,
    "/dashboard/analytics": BarChart3,
    "/dashboard/reports": FileSpreadsheet,
    "/dashboard/reports/weekly": CalendarDays,
    "/dashboard/reports/monthly": CalendarRange,
    "/dashboard/mistakes": AlertTriangle,
    "/dashboard/intelligence": Brain,
};

interface Tab {
    label: string;
    href: string;
    icon?: LucideIcon;
}

interface TabBarProps {
    tabs: Tab[];
    className?: string;
    equalWidth?: boolean;
}

export function TabBar({ tabs, className, equalWidth }: TabBarProps) {
    const pathname = usePathname();

    return (
        <div className={cn(
            "bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-xl border border-gray-200 dark:border-white/10 h-auto overflow-x-auto scrollbar-hide",
            equalWidth ? "w-full flex lg:w-auto lg:inline-flex" : "w-auto inline-flex",
            className
        )}>
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                // Use explicit icon prop first, fallback to route map
                const Icon = tab.icon || routeIconMap[tab.href];
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 border whitespace-nowrap shrink-0",
                            equalWidth && "flex-1 text-center lg:flex-none",
                            isActive
                                ? "bg-white dark:bg-[#262A36] text-gray-700 dark:text-white shadow-sm border-gray-200 dark:border-white/10"
                                : "text-gray-600 dark:text-gray-300 border-transparent"
                        )}
                    >
                        {Icon && <Icon size={14} className="sm:w-4 sm:h-4" />}
                        <span>{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
