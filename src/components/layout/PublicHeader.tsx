"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthUser } from "@/lib/auth-types";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Search } from "lucide-react";

import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { Button } from "@/components/ui/Button";
import { PublicSearchModal } from "@/components/search/PublicSearchModal";
import { usePathname } from "next/navigation";

interface PublicHeaderProps {
    user?: AuthUser | null;
    profile?: any;
}

export function PublicHeader({
    user: initialUser,
    profile,
}: PublicHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";
    const pathname = usePathname();
    const isSearchPage = pathname === "/search";

    const [isMounted, setIsMounted] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(initialUser || null);
    const [isAuthLoaded, setIsAuthLoaded] = useState(initialUser !== undefined);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const handleSearchClick = () => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                bubbles: true,
            })
        );
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-fetch user when not provided (client-side pages)
    useEffect(() => {
        if (initialUser !== undefined) return; // Skip if prop was explicitly passed
        fetch("/api/profile")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.name) {
                    setUser({
                        id: data.id || "",
                        name: data.name,
                        email: data.email,
                        image: data.image,
                        profile: {
                            username: data.username || data.name || "user",
                            role: data.role || "USER",
                            xp: data.xp || 0,
                            level: data.level || 1,
                            streak: data.streak || 0,
                        },
                    } as AuthUser);
                } else {
                    setUser(null);
                }
                setIsAuthLoaded(true);
            })
            .catch(() => {
                setUser(null);
                setIsAuthLoaded(true);
            });
    }, [initialUser]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 10);
        onScroll(); // check on mount
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Determine loading state: on server or client hydration phase, if initialUser is undefined,
    // we must render the skeleton to match the server output perfectly.
    const isHeaderLoading =
        initialUser === undefined && (!isMounted || !isAuthLoaded);

    const userData = {
        name: user?.name || "Trader",
        image: user?.image || null,
        username: user?.profile?.username || "User",
    };

    return (
        <header
            id="site-header"
            className="fixed inset-x-0 z-[60] transition-all duration-500 ease-header"
            style={{
                top: "var(--banner-h, 0px)",
                paddingTop: isScrolled ? "12px" : "0px",
            }}
        >
            {/* Full-width bar — bg + rounded here */}
            <div
                className={[
                    "h-16 transition-all duration-500 ease-header",
                    isScrolled
                        ? "mx-4 sm:mx-6 lg:mx-16 xl:mx-40 2xl:mx-60 rounded-full border shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl bg-white dark:bg-card/90 border-dashboard/50 "
                        : "mx-0 rounded-none border-b border-dashboard bg-white dark:bg-card",
                ].join(" ")}
            >
                {/* Content constrained to 1440px */}
                <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between gap-2 sm:gap-4 md:gap-6 px-2 sm:px-4 md:px-6 h-full">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Logo />
                    </div>

                    {/* Navigation Links - Desktop */}
                    <DesktopNav />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                        {/* Theme Toggle */}
                        <ThemeToggleSwitch />

                        {/* Search Trigger Button (Symmetrical to Theme Switcher) */}
                        <button
                            onClick={handleSearchClick}
                            aria-label="Search website (Ctrl+K)"
                            className={`
      relative w-9 h-9 p-0 flex items-center justify-center rounded-full transition-all duration-300
      focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer
      ${
          isDark
              ? "bg-slate-800/80 border-2 border-slate-700 text-gold hover:bg-slate-700/80 hover:text-amber-300 hover:border-gold/50"
              : "bg-white border-2 border-dashboard text-gold hover:bg-gray-50 hover:text-amber-600 hover:border-gold/50"
      }
    `}
                        >
                            <Search
                                className="w-[18px] h-[18px]"
                                strokeWidth={2.5}
                            />
                        </button>

                        {/* Login / User Menu — hidden on mobile/tablet, shown on lg+ */}
                        <div className="hidden lg:flex items-center">
                            <UserMenu
                                user={user}
                                profile={profile}
                                isLoading={isHeaderLoading}
                            />
                        </div>

                        {/* Mobile/Tablet Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className={`lg:hidden p-2 rounded-lg ${isDark ? "text-white hover:bg-amber-400/10 hover:text-amber-300" : "text-gray-700 hover:bg-amber-50 hover:text-amber-600"}`}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <MobileNavigation
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                user={user}
            />

            {/* Search Modal (Ctrl+K) */}
            <PublicSearchModal />
        </header>
    );
}
