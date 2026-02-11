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
                // If it's a link (e.g. Dashboard), we navigate AND toggle if not already open
                // Actually if strict accordion, clicking Dashboard should open it.
                if (!isExpanded) {
                    onToggle();
                }
            } else {
                // Pure Folder: Toggle
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
        <div>
            <div
                className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative select-none",
                    collapsed ? "justify-center px-2" : "",
                    isActiveStyle
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                )}
                onClick={handleMainClick}
            >
                <Link
                    href={item.href === "#" ? "" : item.href} // Empty href if # to prevent navigation logic confusion, handled by onClick
                    className="absolute inset-0 z-0"
                    onClick={(e) => {
                        if (item.href === "#") e.preventDefault();
                    }}
                />

                <Icon size={22} className={cn(
                    "transition-colors relative z-10 pointer-events-none min-w-[22px]",
                    isActiveStyle ? "text-primary" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />

                {!collapsed && (
                    <>
                        <span className="flex-1 font-medium text-sm relative z-10 pointer-events-none">{item.name}</span>
                        {hasSubItems && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={handleChevronClick}
                                className={cn(
                                    "relative z-20 p-1 -mr-2 rounded-lg transition-colors",
                                    isBranchActive
                                        ? "text-primary hover:bg-primary/20"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                                )}
                            >
                                <ChevronDown size={18} className={cn(
                                    "transition-transform duration-200",
                                    isExpanded ? "rotate-180" : ""
                                )} />
                            </div>
                        )}
                    </>
                )}

                {collapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                        {item.name}
                    </div>
                )}
            </div>

            {/* Sub Menu */}
            {!collapsed && hasSubItems && isExpanded && (
                <div className="ml-9 mt-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                    {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname?.startsWith(`${subItem.href}/`);
                        return (
                            <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                                    isSubActive
                                        ? "text-primary bg-primary/10 font-medium"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                {subItem.name}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function Sidebar({ items = dashboardMenuItems, className }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Accordion State: Track the name of the expanded group
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Sync expansion with active path on mount and navigation
    useEffect(() => {
        if (!pathname) return;

        // Find which group should be open based on active path
        const activeGroup = items.find((item: any) => {
            // Check self (for group links)
            if (item.href !== "#" && pathname === item.href) return true;
            // Check children
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
            "hidden lg:flex flex-col bg-white dark:bg-[#0B0E14] border-r border-gray-100 dark:border-white/5 h-screen sticky top-0 transition-all duration-300 z-20 shadow-sm",
            collapsed ? "w-24" : "w-[272px]",
            className
        )}>
            {/* Header / Logo */}
            <div className={cn(
                "h-16 flex items-center border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0B0E14] transition-all",
                collapsed ? "justify-center px-0" : "justify-between px-6"
            )}>
                {!collapsed && <Logo />}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
                {items.map((item: any) => (
                    <SidebarItemComponent
                        key={item.name}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                        isExpanded={expandedGroup === item.name}
                        onToggle={() => {
                            // Toggle logic: If clicking already open group, close it. Else open it (closing others).
                            setExpandedGroup(prev => prev === item.name ? null : item.name);
                        }}
                    />
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-2 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                    onClick={() => signout()}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left",
                        collapsed && "justify-center"
                    )}>
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
