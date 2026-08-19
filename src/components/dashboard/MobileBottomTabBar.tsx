"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClaimableCount } from "@/hooks/useClaimableCount";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Bug, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardMenuGroups, adminMenuGroups } from "@/config/navigation";
import { useFeatureFlags } from "@/lib/dashboard-context";
import { SPRING_SOFT, backdropVariants } from "@/lib/animations";

export function MobileBottomTabBar() {
    const pathname = usePathname();
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const { disabledFlags, loaded: flagsLoaded } = useFeatureFlags();
    const claimableCount = useClaimableCount();

    // Determine which groups to use based on the path
    const isAdmin = pathname?.startsWith("/admin");
    const rawGroups = isAdmin ? adminMenuGroups : dashboardMenuGroups;

    // Filter groups: remove items with disabled feature flags
    const filteredGroups = useMemo(() => {
        return rawGroups.map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                const flag = (item as any).featureFlag;
                if (!flag) return true;
                if (!flagsLoaded) return false;
                return !disabledFlags.has(flag);
            }),
        }));
    }, [rawGroups, disabledFlags, flagsLoaded]);

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
            "/dashboard/reports/weekly": "/dashboard/analytics",
            "/dashboard/reports/monthly": "/dashboard/analytics",
            "/dashboard/mistakes": "/dashboard/analytics",
        };
        const effectivePath = childRouteMap[pathname] || pathname;

        for (const group of filteredGroups) {
            for (const item of group.items) {
                if (
                    effectivePath === item.href ||
                    effectivePath.startsWith(`${item.href}/`)
                ) {
                    return group.label;
                }
            }
        }
        return null;
    })();

    const handleTabClick = useCallback((label: string) => {
        setOpenGroup((prev) => (prev === label ? null : label));
    }, []);

    const activeSheet = openGroup
        ? filteredGroups.find((g) => g.label === openGroup)
        : null;

    return (
        <>
            {/* Bottom Sheet Overlay + Panel */}
            <AnimatePresence>
                {activeSheet && (
                <>
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                        onClick={() => setOpenGroup(null)}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={SPRING_SOFT}
                        className="fixed bottom-[64px] left-0 right-0 z-40 lg:hidden"
                    >
                    <div className="bg-white dark:bg-[#151925] rounded-t-2xl shadow-2xl shadow-black/20 border-t border-x border-dashboard overflow-hidden">
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
                                const isActive =
                                    pathname === item.href ||
                                    pathname.startsWith(`${item.href}/`);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm nav-menu-text transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <Icon
                                            size={20}
                                            className={cn(
                                                isActive
                                                    ? "text-primary"
                                                    : "text-gray-600 dark:text-gray-300"
                                            )}
                                        />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            {/* Feedback actions - only in More sheet for Users */}
                            {activeSheet.label === "More" && !isAdmin && (
                                <>
                                    <div className="mx-4 my-2 h-px bg-gray-100 dark:bg-white/10" />
                                    <button
                                        onClick={() => {
                                            setOpenGroup(null);
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    "open-feedback",
                                                    { detail: "BUG" }
                                                )
                                            );
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm nav-menu-text text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
                                    >
                                        <Bug
                                            size={20}
                                            className="text-red-400"
                                        />
                                        <span>Bug Report</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenGroup(null);
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    "open-feedback",
                                                    { detail: "FEATURE" }
                                                )
                                            );
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm nav-menu-text text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
                                    >
                                        <Lightbulb
                                            size={20}
                                            className="text-amber-400"
                                        />
                                        <span>Feature Request</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    </motion.div>
                </>
                )}
            </AnimatePresence>

            {/* Tab Bar */}
            <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white dark:bg-[#151925] border-t border-dashboard safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {filteredGroups.map((group) => {
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
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold",
                                        isActive || isSheetOpen
                                            ? "text-primary"
                                            : "text-gray-600 dark:text-gray-300"
                                    )}
                                >
                                    {group.label}
                                </span>
                                {/* Red dot for claimable missions */}
                                {group.label === "More" &&
                                    claimableCount > 0 && (
                                        <span className="absolute top-2 right-1/2 translate-x-4 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#151925]" />
                                    )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
