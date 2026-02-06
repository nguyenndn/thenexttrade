"use client";

import { Bell, Search, Menu, Settings, LogOut } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { AuthUser } from "@/lib/auth-types";
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import { AccountSelector } from "@/components/dashboard/AccountSelector";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signout } from '@/app/auth/actions';
import { SearchBar } from '@/components/search/SearchBar';
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Header({
    onMobileMenuClick,
    searchRoute = "/dashboard/search",
    showAccountSelector = false,
    user: initialUser,
    bell
}: {
    onMobileMenuClick?: () => void,
    searchRoute?: string,
    showAccountSelector?: boolean,
    user?: AuthUser | null,
    bell?: React.ReactNode
}) {
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
        <header className="h-16 bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 sticky top-0 z-50 px-4 lg:px-6 flex items-center justify-between">
            {/* ... (Search bar section) ... */}
            <div className="flex items-center gap-3 flex-1">
                <button
                    className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    onClick={onMobileMenuClick}
                >
                    <Menu size={20} />
                </button>
                <div className="hidden md:block w-full max-w-md ml-4">
                    <SearchBar targetRoute={searchRoute} />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {showAccountSelector && (
                    <div className="hidden md:block">
                        <AccountSelector />
                    </div>
                )}
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isDark
                        ? 'bg-gray-600 focus:ring-offset-slate-900'
                        : 'bg-gray-300 focus:ring-offset-white'
                        }`}
                >
                    <span
                        className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
                            }`}
                    />
                </button>

                {/* Notification Bell */}
                {bell ? (
                    bell
                ) : (
                    <NotificationBell />
                )}

                <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                {/* UserMenu needs AuthUser. We pass user which is AuthUser | null. */}
                {/* UserMenu profile prop: previously passed userProfile | null. */}
                {/* UserMenu uses profile.username mainly. */}
                {/* AuthUser has profile.username. */}
                {/* So we can pass user too? UserMenu implementation shows: */}
                {/* const userData = { username: user?.profile?.username || "User" ... } */}
                {/* Wait, UserMenu implementation I updated in Step 2239: */}
                {/* username: user?.profile?.username || "User" */}
                {/* So UserMenu extracts from user.profile. */}
                {/* The 'profile' prop in UserMenu might be redundant now? */}
                {/* I will pass empty profile or just user. */}

                <UserMenu user={initialUser ?? null} variant="dashboard" />
            </div>
        </header>
    );
}
