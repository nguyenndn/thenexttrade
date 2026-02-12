"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
                    className={`flex w-full lg-plus:w-4/5 items-center justify-between gap-2 sm:gap-4 md:gap-6 rounded-xl border px-3 sm:px-4 md:px-6 py-1.5 shadow-lg ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-gray-200'
                        }`}
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
                            className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isDark
                                ? 'bg-gray-600 focus:ring-offset-slate-900'
                                : 'bg-gray-300 focus:ring-offset-white'
                                }`}
                            role="switch"
                            aria-checked={isDark}
                            aria-label="Toggle theme"
                        >
                            <span
                                className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
                                    }`}
                            >
                                <svg
                                    className={`h-2.5 w-2.5 sm:h-3 sm:w-3 m-0.5 ${isDark ? 'text-gray-600' : 'text-yellow-500'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    {isDark ? (
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    ) : (
                                        <path
                                            fillRule="evenodd"
                                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                            clipRule="evenodd"
                                        />
                                    )}
                                </svg>
                            </span>
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
