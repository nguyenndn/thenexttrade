"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { AuthUser } from "@/lib/auth-types";
import { useTheme } from "@/components/providers/ThemeProvider";

import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { UserMenu } from "@/components/layout/UserMenu";

interface PublicHeaderProps {
    user?: AuthUser | null;
    profile?: any;
}

export function PublicHeader({ user: initialUser, profile }: PublicHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [user, setUser] = useState<AuthUser | null>(initialUser || null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Note: getAuthUser is server side only, so we rely on initialUser or client side fetch if needed
    // But for PublicHeader, we usually pass user from server
    // Removing client-side getUser for now as getAuthUser returns mapped type not available in client auth.getUser directly without API

    const userData = {
        name: user?.name || "Trader",
        image: user?.image || null,
        username: user?.profile?.username || "User",
    };

    return (
        <header
            id="site-header"
            className="fixed top-0 inset-x-0 z-[60] backdrop-blur-2xl"
        >
            <div className="px-0 lg-plus:px-4 py-2 flex justify-center">
                <div
                    className="flex w-full lg-plus:w-4/5 items-center justify-between gap-2 sm:gap-4 md:gap-6 rounded-xl border px-3 sm:px-4 md:px-6 h-16 shadow-lg bg-white dark:bg-[#151925]/90 border-gray-200 dark:border-white/10"
                >
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Logo />
                    </div>

                    {/* Navigation Links - Desktop */}
                    <DesktopNav />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {/* Login / User Menu Logic */}
                        <UserMenu user={user} profile={profile} />

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`lg:hidden p-2 rounded-lg ${isDark ? 'text-white hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <MobileNavigation isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>
    );
}
