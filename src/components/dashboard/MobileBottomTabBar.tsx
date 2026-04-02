"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Bug, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardMenuGroups } from "@/config/navigation";

export function MobileBottomTabBar() {
    const pathname = usePathname();
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    // Close sheet on route change
    useEffect(() => {
        setOpenGroup(null);
    }, [pathname]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenGroup(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Determine which group the current page belongs to
    const activeGroupLabel = (() => {
        if (!pathname) return null;

        // Map child tab routes to parent
        const childRouteMap: Record<string, string> = {
            "/dashboard/sessions": "/dashboard/journal",
            "/dashboard/reports": "/dashboard/analytics",
            "/dashboard/mistakes": "/dashboard/analytics",
        };
        const effectivePath = childRouteMap[pathname] || pathname;

        for (const group of dashboardMenuGroups) {
            for (const item of group.items) {
                if (effectivePath === item.href || effectivePath.startsWith(`${item.href}/`)) {
                    return group.label;
                }
            }
        }
        return null;
    })();

    const handleTabClick = useCallback((label: string) => {
        setOpenGroup(prev => prev === label ? null : label);
    }, []);

    const activeSheet = openGroup
        ? dashboardMenuGroups.find(g => g.label === openGroup)
        : null;

    return (
        <>
            {/* Bottom Sheet Overlay */}
            {activeSheet && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpenGroup(null)}
                />
            )}

            {/* Bottom Sheet Panel */}
            <div
                className={cn(
                    "fixed bottom-[64px] left-0 right-0 z-40 lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    activeSheet ? "translate-y-0" : "translate-y-full"
                )}
            >
                {activeSheet && (
                    <div className="bg-white dark:bg-[#151925] rounded-t-2xl shadow-2xl shadow-black/20 border-t border-x border-gray-200 dark:border-white/10 overflow-hidden">
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        </div>

                        {/* Sheet Header */}
                        <div className="flex items-center justify-between px-5 pb-3">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                                {activeSheet.label}
                            </h3>
                            <button
                                onClick={() => setOpenGroup(null)}
                                className="p-1.5 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/10 transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Sheet Items */}
                        <div className="px-3 pb-4 space-y-0.5">
                            {activeSheet.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <Icon
                                            size={20}
                                            className={cn(
                                                isActive ? "text-primary" : "text-gray-600 dark:text-gray-300"
                                            )}
                                        />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            {/* Feedback actions — only in More sheet */}
                            {activeSheet.label === "More" && (
                                <>
                                    <div className="mx-4 my-2 h-px bg-gray-100 dark:bg-white/10" />
                                    <button
                                        onClick={() => {
                                            setOpenGroup(null);
                                            window.dispatchEvent(new CustomEvent("open-feedback", { detail: "BUG" }));
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
                                    >
                                        <Bug size={20} className="text-red-400" />
                                        <span>Bug Report</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenGroup(null);
                                            window.dispatchEvent(new CustomEvent("open-feedback", { detail: "FEATURE" }));
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
                                    >
                                        <Lightbulb size={20} className="text-amber-400" />
                                        <span>Feature Request</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Bar */}
            <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white dark:bg-[#151925] border-t border-gray-200 dark:border-white/10 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {dashboardMenuGroups.map((group) => {
                        const Icon = group.icon;
                        const isActive = activeGroupLabel === group.label;
                        const isSheetOpen = openGroup === group.label;

                        return (
                            <button
                                key={group.label}
                                onClick={() => handleTabClick(group.label)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                                    isActive || isSheetOpen
                                        ? "text-primary"
                                        : "text-gray-600 dark:text-gray-300"
                                )}
                                aria-label={group.label}
                            >
                                {/* Active indicator dot */}
                                {isSheetOpen && (
                                    <div className="absolute top-1.5 w-1 h-1 rounded-full bg-primary" />
                                )}
                                <Icon
                                    size={22}
                                    className={cn(
                                        "transition-colors",
                                        isActive || isSheetOpen
                                            ? "text-primary"
                                            : "text-gray-600 dark:text-gray-300"
                                    )}
                                />
                                <span className={cn(
                                    "text-[10px] font-semibold",
                                    isActive || isSheetOpen
                                        ? "text-primary"
                                        : "text-gray-600 dark:text-gray-300"
                                )}>
                                    {group.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
