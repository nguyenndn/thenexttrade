"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { dashboardMenuItems } from '@/config/navigation';
import {
    Menu,
    LogOut,
    ChevronDown
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { signout } from '@/app/auth/actions';
import { Button } from "@/components/ui/Button";

export interface SidebarItem {
    name: string;
    href: string;
    icon?: any;
    items?: SidebarItem[];
}

interface SidebarProps {
    items?: any[];
    className?: string;
    collapsed?: boolean;
    setCollapsed?: (value: boolean) => void;
}

interface SidebarItemComponentProps {
    item: SidebarItem;
    pathname: string | null;
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
    isExpanded: boolean;
    onToggle: () => void;
    activeHref: string | null;
}

// Extracted component to follow Rules of Hooks
function SidebarItemComponent({ item, pathname, collapsed, setCollapsed, isExpanded, onToggle, activeHref }: SidebarItemComponentProps) {
    const Icon = item.icon;
    const hasSubItems = item.items && item.items.length > 0;
    const isGroupLink = hasSubItems && item.href !== "#"; // e.g. Dashboard

    // Active Logic
    // Exact match determined by the parent's longest prefix match
    const isSelfActive = item.href !== "#" && item.href === activeHref;

    // Check if any child is precisely the active one
    const isChildActive = item.items && item.items.some(sub => sub.href === activeHref);

    const isBranchActive = isSelfActive || isChildActive;

    // Handle Main Click
    const handleMainClick = (e: React.MouseEvent) => {
        if (!isGroupLink && collapsed) {
            setCollapsed(false);
        }
    };

    const isActiveStyle = isBranchActive;

    return (
        <div className="mb-1">
            <div
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 mx-3 rounded-xl cursor-pointer transition-all duration-300 group relative select-none",
                    collapsed ? "justify-center px-0 mx-2" : "",
                    isActiveStyle
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
                )}
                onClick={handleMainClick}
            >
                <Link
                    href={item.href === "#" ? "" : item.href}
                    className="absolute inset-0 z-0"
                    onClick={(e) => {
                        if (item.href === "#") e.preventDefault();
                    }}
                />

                <Icon size={20} className={cn(
                    "transition-colors relative z-10 pointer-events-none min-w-[20px]",
                    isActiveStyle ? "text-primary" : "text-gray-600 dark:text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />

                {!collapsed && (
                    <span className="flex-1 text-sm relative z-10 pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.name}
                    </span>
                )}

                {collapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                        {item.name}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Sidebar({ items = dashboardMenuItems, className, collapsed, setCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const isCollapsed = collapsed ?? false;
    // const [collapsed, setCollapsed] = useState(false); // Removed local state
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Map child tab routes to their parent menu item routes
    // (These routes are accessed via TabBar but not shown in sidebar)
    const childRouteMap: Record<string, string> = {
        "/dashboard/sessions": "/dashboard/journal",
        "/dashboard/reports": "/dashboard/analytics",
        "/dashboard/mistakes": "/dashboard/analytics",
        "/dashboard/intelligence": "/dashboard/analytics",
    };

    // Calculate the most specific active route using longest prefix match
    const activeHref = useMemo(() => {
        if (!pathname) return null;

        // Resolve child routes to their parent menu item
        const effectivePath = childRouteMap[pathname] || pathname;

        let bestMatch = "";
        
        const checkMatch = (href: string) => {
             if (href && href !== "#" && (effectivePath === href || effectivePath.startsWith(`${href}/`))) {
                 if (href.length > bestMatch.length) {
                     bestMatch = href;
                 }
             }
        }
        
        items.forEach((item: any) => {
            checkMatch(item.href);
            if (item.items) {
                item.items.forEach((sub: any) => checkMatch(sub.href));
            }
        });
        
        return bestMatch || null;
    }, [pathname, items]);

    useEffect(() => {
        if (!pathname) return;
        const activeGroup = items.find((item: any) => {
            if (item.href !== "#" && pathname === item.href) return true;
            if (item.items) {
                return item.items.some((sub: any) => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
            }
            return false;
        });

        if (activeGroup) {
            setExpandedGroup(activeGroup.name);
        }
    }, [pathname, items]);

    return (
        <aside className={cn(
            "hidden lg:flex flex-col bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 h-[calc(100%-1.5rem)] ml-4 mb-6 rounded-xl shadow-sm transition-all duration-300 ease-in-out z-30",
            isCollapsed ? "w-20" : "w-[280px]",
            className
        )}>
            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 py-4 custom-scrollbar">

                {items.map((item: any, index: number) => {
                    // Detect if we're in Admin sidebar by checking first item href
                    const isAdmin = items[0]?.href === "/admin";

                    const sectionNames: Record<string, string> = isAdmin
                        ? {
                            // Admin groups
                            "Articles": "CONTENT",
                            "Academy": "EDUCATION",
                            "Copy Trading": "INVESTING",
                            "EA Management": "SYSTEM",
                        }
                        : {
                            // User Dashboard groups
                            "Dashboard": "OPERATIONS",
                            "Trading Journal": "EXECUTION",
                            "Analytics Hub": "REVIEW",
                            "Academy": "RESOURCES",
                            "Copy Trading": "INVESTING",
                        };

                    const sectionLabel = sectionNames[item.name];

                    return (
                        <div key={item.name}>
                            {/* Section Label */}
                            {sectionLabel && !isCollapsed && (
                                <div className="px-5 py-2 mt-2">
                                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 tracking-widest uppercase">{sectionLabel}</span>
                                </div>
                            )}

                            {/* Divider for Collapsed State */}
                            {sectionLabel && index > 0 && isCollapsed && (
                                <div className="mx-4 my-2 h-px bg-gray-200 dark:bg-white/10" />
                            )}

                            <SidebarItemComponent
                                item={item}
                                pathname={pathname}
                                collapsed={isCollapsed}
                                setCollapsed={setCollapsed || (() => { })}
                                isExpanded={expandedGroup === item.name}
                                onToggle={() => {
                                    setExpandedGroup(prev => prev === item.name ? null : item.name);
                                }}
                                activeHref={activeHref}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 m-4 mt-auto">
                <Button
                    variant="ghost"
                    onClick={() => signout()}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 h-auto rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left group justify-start font-normal",
                        isCollapsed && "justify-center px-0"
                    )}>
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </Button>
            </div>
        </aside>
    );
}
