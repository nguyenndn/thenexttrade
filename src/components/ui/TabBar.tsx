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
    "/dashboard/mistakes": AlertTriangle,
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
            "bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-xl border border-gray-200 dark:border-white/10 h-auto",
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
                            "rounded-lg px-4 py-1.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border whitespace-nowrap",
                            equalWidth && "flex-1 text-center lg:flex-none",
                            isActive
                                ? "bg-white dark:bg-[#262A36] text-gray-900 dark:text-white shadow-sm border-gray-200 dark:border-white/10"
                                : "text-gray-500 dark:text-gray-400 border-transparent"
                        )}
                    >
                        {Icon && <Icon size={16} />}
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
