"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SettingsNavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
}

interface SettingsMobileNavProps {
    items: SettingsNavItem[];
}

export function SettingsMobileNav({ items }: SettingsMobileNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    const activeIndex = Math.max(
        0,
        items.findIndex((item) =>
            item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
        )
    );
    const activeItem = items[activeIndex] ?? items[0];
    const ActiveIcon = activeItem.icon;

    return (
        <DropdownMenu className="w-full md:hidden">
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 px-3.5 rounded-lg border border-dashboard bg-white dark:bg-[#1E2028] text-sm font-bold text-gray-800 dark:text-white flex items-center justify-between shadow-sm hover:border-gold/40"
                    aria-label="Switch settings section"
                >
                    <span className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                            <ActiveIcon
                                size={14}
                                className="text-amber-600 dark:text-gold"
                            />
                        </span>
                        <span className="truncate whitespace-nowrap">
                            {activeItem.title}
                        </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono tabular-nums font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg">
                            {activeIndex + 1} / {items.length}
                        </span>
                        <ChevronDown size={16} className="text-gray-400" />
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] rounded-xl p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]"
            >
                {items.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = idx === activeIndex;

                    return (
                        <DropdownMenuItem
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={cn(
                                "flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer",
                                isActive
                                    ? "bg-amber-500/10 text-amber-700 dark:text-gold font-bold"
                                    : "text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                    size={16}
                                    className={cn(
                                        "shrink-0",
                                        isActive
                                            ? "text-amber-600 dark:text-gold"
                                            : "text-gray-400 dark:text-gray-500"
                                    )}
                                />
                                <span className="truncate whitespace-nowrap">
                                    {item.title}
                                </span>
                            </span>
                            {isActive && (
                                <Check
                                    size={15}
                                    className="text-amber-600 dark:text-gold shrink-0"
                                />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
