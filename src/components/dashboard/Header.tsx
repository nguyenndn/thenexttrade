"use client";

import {
    Bell,
    Search,
    Menu,
    Settings,
    LogOut,
    Flame,
    Sun,
    Moon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { AuthUser } from "@/lib/auth-types";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { AccountSelector } from "@/components/dashboard/AccountSelector";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signout } from "@/app/auth/actions";
import {
    CommandPalette,
    CommandPaletteTrigger,
} from "@/components/search/CommandPalette";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { Button } from "@/components/ui/Button";
import { SampleModeToggle } from "@/components/dashboard/SampleModeToggle";
import { DashboardTourButton } from "@/components/onboarding/DashboardTourButton";

export function Header({
    onMobileMenuClick,
    searchRoute = "/dashboard/search",
    showAccountSelector = false,
    user: initialUser,
    bell,
    collapsed,
    setCollapsed,
}: {
    onMobileMenuClick?: () => void;
    searchRoute?: string;
    showAccountSelector?: boolean;
    user?: AuthUser | null;
    bell?: React.ReactNode;
    collapsed?: boolean;
    setCollapsed?: (v: boolean) => void;
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
            <header className="mx-2.5 mt-2 mb-2 sm:mx-4 sm:mt-3 sm:mb-3 rounded-xl bg-white/100 dark:bg-[#1E2028] shadow-sm border border-dashboard h-14 sm:h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 z-40 relative transition-all duration-100 ease-in-out">
                {/* Left Section: Toggle + Logo */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    {/* Desktop Toggle + Logo (Toggle FIRST) */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {/* Desktop Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            onClick={() => setCollapsed?.(!collapsed)}
                            className="hidden lg:flex p-1.5 rounded-lg text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <Menu size={20} />
                        </Button>
                        {/* Mobile Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Open navigation menu"
                            onClick={onMobileMenuClick}
                            className="flex lg:hidden w-9 h-9 sm:w-10 sm:h-10 p-1.5 rounded-lg text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
                        >
                            <Menu size={20} />
                        </Button>
                        <Logo
                            size="sm"
                            className="sm:hidden"
                            textClassName="text-base font-bold tracking-tight text-gray-700 dark:text-white"
                        />
                        <Logo
                            className="hidden sm:flex"
                            textClassName="text-lg font-bold tracking-tight text-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1 min-w-0" />

                {/* Right Side Actions & Search */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div
                        data-tour="header-tools"
                        className="flex items-center gap-1.5 sm:gap-2"
                    >
                        <div className="hidden md:block mr-2">
                            <CommandPaletteTrigger />
                        </div>

                        {showAccountSelector && (
                            <div className="hidden md:block">
                                <AccountSelector
                                    currentAccountId={accountId ?? undefined}
                                />
                            </div>
                        )}

                        {/* Sample Mode Toggle */}
                        <SampleModeToggle />

                        {/* Dashboard Tour Replay Button */}
                        <DashboardTourButton />

                        {/* Theme Toggle - hidden on <sm (accessible via UserMenu) */}
                        <div className="hidden sm:block">
                            <ThemeToggleSwitch />
                        </div>

                        {/* Notification Bell - visible on all sizes, next to avatar */}
                        <div key="notification-bell">
                            {bell ? bell : <NotificationBell />}
                        </div>
                    </div>

                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                    <UserMenu user={initialUser ?? null} variant="dashboard" />
                </div>
            </header>

            {/* Command Palette Modal (Ctrl+K) */}
            <CommandPalette searchRoute={searchRoute} />
        </>
    );
}
