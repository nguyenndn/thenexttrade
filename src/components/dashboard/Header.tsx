"use client";

import { Bell, Search, Menu, Settings, LogOut, Flame, Sun, Moon } from 'lucide-react';
import { useSearchParams } from "next/navigation";
import { useTheme } from '@/components/providers/ThemeProvider';
import { AuthUser } from "@/lib/auth-types";
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import { AccountSelector } from "@/components/dashboard/AccountSelector";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signout } from '@/app/auth/actions';
import { CommandPalette, CommandPaletteTrigger } from '@/components/search/CommandPalette';
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";

export function Header({
    onMobileMenuClick,
    searchRoute = "/dashboard/search",
    showAccountSelector = false,
    user: initialUser,
    bell,
    collapsed,
    setCollapsed
}: {
    onMobileMenuClick?: () => void,
    searchRoute?: string,
    showAccountSelector?: boolean,
    user?: AuthUser | null,
    bell?: React.ReactNode,
    collapsed?: boolean,
    setCollapsed?: (v: boolean) => void
}) {
    const searchParams = useSearchParams();
    const accountId = searchParams.get("accountId");

    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [user, setUser] = useState<AuthUser | null>(initialUser || null);

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
        }
    }, [initialUser]);

    // Streak / Profile fetch logic can be added here if needed

    // Listen for streak updates or other custom events
    useEffect(() => {
        if (!user) return;
        // Logic restored...
    }, [user]);

    return (
        <>
            <header className="mx-4 mt-3 mb-3 rounded-xl bg-white/100 dark:bg-[#1E2028] shadow-sm border border-gray-200 dark:border-white/10 h-16 px-4 lg:px-6 flex items-center justify-between z-40 relative transition-all duration-100 ease-in-out">
                {/* Left Section: Toggle + Logo */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        onClick={onMobileMenuClick}
                    >
                        <Menu size={20} />
                    </button>

                    {/* Desktop Toggle + Logo (Toggle FIRST) */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCollapsed?.(!collapsed)}
                            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <Logo />
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right Side Actions & Search */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden md:block mr-2">
                        <CommandPaletteTrigger />
                    </div>

                    {showAccountSelector && (
                        <div className="hidden md:block">
                            <AccountSelector currentAccountId={accountId ?? undefined} />
                        </div>
                    )}

                    {/* Theme Toggle */}
                    <ThemeToggleSwitch />

                    {/* Notification Bell */}
                    {bell ? bell : <NotificationBell />}

                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                    <UserMenu user={initialUser ?? null} variant="dashboard" />
                </div>
            </header>

            {/* Command Palette Modal (Ctrl+K) */}
            <CommandPalette />
        </>
    );
}
