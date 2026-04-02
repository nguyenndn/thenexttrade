
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { cn } from "@/lib/utils";
import { dashboardMenuItems, adminMenuItems } from "@/config/navigation";
import { signout } from "@/app/auth/actions";

// Section label mapping — matches desktop Sidebar.tsx exactly
const userSectionNames: Record<string, string> = {
    "Dashboard": "OPERATIONS",
    "Trading Journal": "EXECUTION",
    "Analytics Hub": "REVIEW",
    "Academy": "RESOURCES",
};

const adminSectionNames: Record<string, string> = {
    "Articles": "CONTENT",
    "Academy": "EDUCATION",
    "EA Management": "SYSTEM",
};

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    items?: any[];
}

export function MobileSidebar({ isOpen, onClose, items }: MobileSidebarProps) {
    const pathname = usePathname();

    if (!isOpen) return null;

    const navItems = items ?? dashboardMenuItems;
    const isAdmin = navItems[0]?.href === "/admin";
    const sectionNames = isAdmin ? adminSectionNames : userSectionNames;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <div className="absolute left-0 top-0 bottom-0 w-[272px] bg-white dark:bg-[#0B0E14] shadow-2xl flex flex-col">

                {/* ── Header: Logo + Close ── */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
                    <Logo />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="p-1.5 h-auto w-auto text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* ── Nav Items (scrollable) ── */}
                <div className="flex-1 overflow-y-auto py-3 px-3">
                    {/* Longest prefix match — only one item active */}
                    {(() => {
                        // Map child tab routes to parent menu items
                        const childRouteMap: Record<string, string> = {
                            "/dashboard/sessions": "/dashboard/journal",
                            "/dashboard/reports": "/dashboard/analytics",
                            "/dashboard/mistakes": "/dashboard/analytics",
                        };
                        const effectivePath = childRouteMap[pathname] || pathname;

                        let bestMatch = "";
                        navItems.forEach((item: any) => {
                            if (item.href && item.href !== "#" && (effectivePath === item.href || effectivePath.startsWith(`${item.href}/`))) {
                                if (item.href.length > bestMatch.length) bestMatch = item.href;
                            }
                        });
                        return navItems.map((item: any, index: number) => {
                        const sectionLabel = sectionNames[item.name];
                        const Icon = item.icon;
                        const isActive = item.href === bestMatch;

                        return (
                            <div key={item.name}>
                                {/* Section Label */}
                                {sectionLabel && (
                                    <div className={cn("px-3 pb-1.5", index > 0 && "mt-4 pt-3 border-t border-gray-100 dark:border-white/8")}>
                                        <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 tracking-widest uppercase">
                                            {sectionLabel}
                                        </span>
                                    </div>
                                )}

                                {/* Nav Item */}
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5",
                                        isActive
                                            ? "bg-primary/10 text-primary dark:text-primary"
                                            : "text-gray-600 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
                                    )}
                                >
                                    {Icon && (
                                        <Icon
                                            size={18}
                                            className={isActive ? "text-primary" : "text-gray-600 dark:text-gray-300"}
                                        />
                                    )}
                                    <span>{item.name}</span>
                                </Link>
                            </div>
                        );
                    });
                    })()}
                </div>

                {/* ── Bottom: Logout ── */}
                <div className="px-3 py-3 border-t border-gray-100 dark:border-white/10">
                    <Button
                        variant="ghost"
                        onClick={() => { onClose(); signout(); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 h-auto rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left justify-start font-medium text-sm"
                    >
                        <LogOut size={18} className="shrink-0" />
                        <span>Logout</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
