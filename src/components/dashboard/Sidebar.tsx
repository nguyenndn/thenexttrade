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
}

// Extracted component to follow Rules of Hooks
function SidebarItemComponent({ item, pathname, collapsed, setCollapsed }: SidebarItemComponentProps) {
    const Icon = item.icon;
    const isRoot = item.href === '/admin' || item.href === '/dashboard';
    const isActive = pathname === item.href ||
        (item.items && pathname?.startsWith(item.href)) ||
        (!isRoot && pathname?.startsWith(`${item.href}/`));
    const hasSubItems = item.items && item.items.length > 0;

    // Hooks are now at the top level of this component - correct!
    const [isExpanded, setIsExpanded] = useState(isActive);

    // Sync expansion with active path
    useEffect(() => {
        if (isActive && !collapsed) {
            setIsExpanded(true);
        }
    }, [isActive, collapsed]);

    return (
        <div>
            <div
                onClick={() => {
                    if (hasSubItems) {
                        setIsExpanded(!isExpanded);
                        if (collapsed) setCollapsed(false);
                    }
                }}
                className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative select-none",
                    collapsed ? "justify-center px-2" : "",
                    isActive && !hasSubItems
                        ? "bg-[#00C888]/10 text-[#00C888]"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                )}
            >
                <Link
                    href={hasSubItems ? "#" : item.href}
                    className="absolute inset-0 z-0"
                    onClick={(e) => {
                        if (hasSubItems) e.preventDefault();
                    }}
                />

                <Icon size={22} className={cn(
                    "transition-colors relative z-10 pointer-events-none min-w-[22px]",
                    isActive ? "text-[#00C888]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />

                {!collapsed && (
                    <>
                        <span className="flex-1 font-medium text-sm relative z-10 pointer-events-none">{item.name}</span>
                        {hasSubItems && (
                            <ChevronDown size={18} className={cn(
                                "transition-transform relative z-10 pointer-events-none",
                                isExpanded ? "rotate-180" : ""
                            )} />
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
                        const isSubActive = pathname === subItem.href;
                        return (
                            <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                                    isSubActive
                                        ? "text-[#00C888] bg-[#00C888]/10 font-medium"
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
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
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
