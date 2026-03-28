"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthUser } from "@/lib/auth-types";
import { useTheme } from "@/components/providers/ThemeProvider";

import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { Button } from "@/components/ui/Button";
import { PublicSearchModal, PublicSearchTrigger } from "@/components/search/PublicSearchModal";

interface PublicHeaderProps {
    user?: AuthUser | null;
    profile?: any;
}

export function PublicHeader({ user: initialUser, profile }: PublicHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [user, setUser] = useState<AuthUser | null>(initialUser || null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Auto-fetch user when not provided (client-side pages)
    useEffect(() => {
        if (initialUser !== undefined) return; // Skip if prop was explicitly passed
        fetch("/api/profile")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.name) {
                    setUser({
                        id: "",
                        name: data.name,
                        email: data.email,
                        image: data.image,
                        profile: { username: data.name, role: data.role || "USER" }
                    } as AuthUser);
                }
            })
            .catch(() => {});
    }, [initialUser]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 10);
        onScroll(); // check on mount
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const userData = {
        name: user?.name || "Trader",
        image: user?.image || null,
        username: user?.profile?.username || "User",
    };

    return (
        <header
            id="site-header"
            className="fixed inset-x-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
                top: 'var(--banner-h, 0px)',
                paddingTop: isScrolled ? "12px" : "0px"
            }}
        >
            {/* Full-width bar — bg + rounded here */}
            <div
                className={[
                    "h-16 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isScrolled
                        ? "mx-4 sm:mx-6 lg:mx-16 xl:mx-40 2xl:mx-60 rounded-full border shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl bg-white dark:bg-[#151925] border-gray-200/50 dark:border-white/10"
                        : "mx-0 rounded-none border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14]",
                ].join(" ")}
            >
                {/* Content constrained to 1440px */}
                <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between gap-2 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-6 h-full">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Logo />
                    </div>

                    {/* Navigation Links - Desktop */}
                    <DesktopNav />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                        {/* Search */}
                        <PublicSearchTrigger className="hidden sm:flex" />

                        {/* Theme Toggle */}
                        <ThemeToggleSwitch />

                        {/* Login / User Menu — hidden on mobile, shown on md+ */}
                        <div className="hidden md:flex items-center">
                            <UserMenu user={user} profile={profile} />
                        </div>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`md:hidden p-2 rounded-lg ${isDark ? 'text-white hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
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
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <MobileNavigation isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />

            {/* Search Modal (Ctrl+K) */}
            <PublicSearchModal />
        </header>
    );
}
