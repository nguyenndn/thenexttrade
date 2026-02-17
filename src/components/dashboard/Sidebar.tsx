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
import { useState, useEffect } from 'react';
import { signout } from '@/app/auth/actions';

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
}

// Extracted component to follow Rules of Hooks
function SidebarItemComponent({ item, pathname, collapsed, setCollapsed, isExpanded, onToggle }: SidebarItemComponentProps) {
    const Icon = item.icon;
    const hasSubItems = item.items && item.items.length > 0;
    const isGroupLink = hasSubItems && item.href !== "#"; // e.g. Dashboard

    // Active Logic
    // Exact match for the item itself
    const isSelfActive = item.href !== "#" && pathname === item.href;

    // Check if any child is active
    const isChildActive = item.items && item.items.some(sub =>
        pathname === sub.href || pathname?.startsWith(`${sub.href}/`)
    );

    const isBranchActive = isSelfActive || isChildActive;

    // Handle Main Click
    const handleMainClick = (e: React.MouseEvent) => {
        if (hasSubItems) {
            if (isGroupLink) {
                if (!isExpanded) {
                    onToggle();
                }
            } else {
                e.preventDefault();
                onToggle();
            }
            if (collapsed) setCollapsed(false);
        }
    };

    // Handle Chevron Click (Always Toggle)
    const handleChevronClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to Link
        onToggle();
        if (collapsed) setCollapsed(false);
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
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
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
                    isActiveStyle ? "text-primary" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />

                {!collapsed && (
                    <>
                        <span className="flex-1 text-sm relative z-10 pointer-events-none">{item.name}</span>
                        {hasSubItems && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={handleChevronClick}
                                className={cn(
                                    "relative z-20 p-1 -mr-1 rounded-lg transition-colors",
                                    isBranchActive
                                        ? "text-primary hover:bg-primary/20"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                                )}
                            >
                                <ChevronDown size={16} className={cn(
                                    "transition-transform duration-200",
                                    isExpanded ? "rotate-180" : ""
                                )} />
                            </div>
                        )}
                    </>
                )}

                {collapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                        {item.name}
                    </div>
                )}
            </div>

            {/* Sub Menu */}
            {!collapsed && hasSubItems && isExpanded && (
                <div className="ml-4 pl-4 border-l-2 border-gray-100 dark:border-white/5 mt-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200 hidden-scrollbar">
                    {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname?.startsWith(`${subItem.href}/`);
                        return (
                            <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 mx-2 rounded-lg text-sm transition-colors relative",
                                    isSubActive
                                        ? "text-primary font-medium"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full bg-primary shrink-0 transition-opacity duration-200",
                                    isSubActive ? "opacity-100" : "opacity-0"
                                )} />
                                <span>{subItem.name}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function Sidebar({ items = dashboardMenuItems, className, collapsed, setCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const isCollapsed = collapsed ?? false;
    // const [collapsed, setCollapsed] = useState(false); // Removed local state
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
            "hidden lg:flex flex-col bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-gray-800 h-[calc(100%-1.5rem)] ml-4 mb-6 rounded-xl shadow-sm transition-all duration-100 ease-in-out z-30",
            isCollapsed ? "w-20" : "w-[280px]",
            className
        )}>
            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 py-4 custom-scrollbar">

                {items.map((item: any) => (
                    <SidebarItemComponent
                        key={item.name}
                        item={item}
                        pathname={pathname}
                        collapsed={isCollapsed}
                        setCollapsed={setCollapsed || (() => { })}
                        isExpanded={expandedGroup === item.name}
                        onToggle={() => {
                            setExpandedGroup(prev => prev === item.name ? null : item.name);
                        }}
                    />
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 m-4 mt-auto">
                <button
                    onClick={() => signout()}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left group",
                        isCollapsed && "justify-center px-0"
                    )}>
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
