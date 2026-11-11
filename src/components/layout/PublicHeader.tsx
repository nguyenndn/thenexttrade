"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { AuthUser } from "@/lib/auth-types";
import dynamic from "next/dynamic";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { HeaderActionGroup } from "./header/HeaderActionGroup";

const PublicSearchModal = dynamic(
    () =>
        import("@/components/search/PublicSearchModal").then(
            (m) => m.PublicSearchModal
        ),
    { ssr: false }
);

const MobileNavigation = dynamic(
    () =>
        import("@/components/layout/MobileNavigation").then(
            (m) => m.MobileNavigation
        ),
    { ssr: false }
);

interface PublicHeaderProps {
    user?: AuthUser | null;
}

export function PublicHeader({
    user: initialUser,
}: PublicHeaderProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(initialUser || null);
    const [isAuthLoaded, setIsAuthLoaded] = useState(initialUser !== undefined);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-fetch user when not provided (client-side pages)
    useEffect(() => {
        if (initialUser !== undefined) return;
        fetch("/api/profile")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.id || data?.email || data?.name) {
                    const fallbackName =
                        data.name ||
                        data.username ||
                        (typeof data.email === "string"
                            ? data.email.split("@")[0]
                            : null) ||
                        "Trader";
                    setUser({
                        id: data.id || "",
                        name: fallbackName,
                        email: data.email,
                        image: data.image,
                        profile: {
                            username: data.username || fallbackName || "user",
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
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const isHeaderLoading =
        initialUser === undefined && (!isMounted || !isAuthLoaded);

    return (
        <header
            id="site-header"
            className="fixed inset-x-0 z-[60] transition-all duration-500 ease-header"
            style={{
                top: "var(--banner-h, 0px)",
                paddingTop: isScrolled ? "12px" : "0px",
            }}
        >
            <div
                className={[
                    "h-16 transition-all duration-500 ease-header",
                    isScrolled
                        ? "mx-4 sm:mx-6 lg:mx-2 xl:mx-20 2xl:mx-48 rounded-full border shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl bg-white dark:bg-card/90 border-gray-200 dark:border-white/10"
                        : "mx-0 rounded-none border-b border-gray-200 dark:border-white/10 bg-white dark:bg-card",
                ].join(" ")}
            >
                <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between gap-2 sm:gap-4 lg:gap-2.5 xl:gap-6 px-3 sm:px-4 lg:px-3.5 xl:px-6 h-full">
                    <div className="flex-shrink-0 lg:min-w-0 xl:min-w-[180px]">
                        <Logo />
                    </div>

                    <DesktopNav />

                    <HeaderActionGroup
                        user={user}
                        isHeaderLoading={isHeaderLoading}
                        isMobileMenuOpen={isMobileMenuOpen}
                        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                </div>
            </div>

            <MobileNavigation
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                user={user}
            />

            <PublicSearchModal />
        </header>
    );
}
