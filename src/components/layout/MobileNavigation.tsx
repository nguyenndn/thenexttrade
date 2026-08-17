"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { menuItems } from "@/config/navigation";
import {
    ChevronDown,
    LogIn,
    UserPlus,
    User as UserIcon,
    LayoutDashboard,
    Settings,
    LogOut,
    Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { AuthUser } from "@/lib/auth-types";
import { signout } from "@/app/auth/actions";

interface MobileNavigationProps {
    isOpen: boolean;
    onClose: () => void;
    user?: AuthUser | null;
}

/** Read last_account_id cookie and return a pre-built dashboard URL to skip the redirect hop. */
function useDashboardUrl(): string {
    return useMemo(() => {
        if (typeof document === "undefined") return "/dashboard";
        const match = document.cookie.match(
            /(?:^|;\s*)last_account_id=([^;]+)/
        );
        const accountId = match?.[1];
        if (!accountId) return "/dashboard";
        const today = new Date().toISOString().slice(0, 10);
        return `/dashboard?accountId=${accountId}&from=${today}&to=${today}`;
    }, []);
}

export function MobileNavigation({
    isOpen,
    onClose,
    user,
}: MobileNavigationProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const pathname = usePathname();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dashboardUrl = useDashboardUrl();

    const handleMobileDropdownToggle = (
        menu: string,
        event: React.MouseEvent
    ) => {
        event.stopPropagation();
        setOpenDropdown((prev) => (prev === menu ? null : menu));
    };

    if (!isOpen) return null;

    return (
        <div className="lg:hidden px-2 pb-4 absolute top-full left-0 w-full z-40">
            <div
                className={`max-w-7xl mx-auto rounded-xl border shadow-lg ${isDark ? "bg-slate-900/95 border-slate-700" : "bg-white border-dashboard"}`}
            >
                {/* Nav Links */}
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/" &&
                                pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                aria-current={isActive ? "page" : undefined}
                                className={[
                                    "relative block px-4 py-3 rounded-lg nav-menu-text transition-colors",
                                    isActive
                                        ? isDark
                                            ? "bg-amber-400/10 text-amber-300"
                                            : "bg-amber-50 text-amber-700"
                                        : isDark
                                          ? "text-white hover:bg-amber-400/10 hover:text-amber-300"
                                          : "text-gray-700 hover:bg-amber-50 hover:text-amber-700",
                                ].join(" ")}
                            >
                                {item.name}
                                <span
                                    className={[
                                        "absolute bottom-1.5 left-4 right-4 h-[2px] rounded-full bg-amber-500 transition-opacity",
                                        isActive ? "opacity-100" : "opacity-0",
                                    ].join(" ")}
                                />
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section: user info OR auth buttons */}
                <div
                    className={`border-t ${isDark ? "border-slate-700" : "border-dashboard"}`}
                >
                    {user ? (
                        /* ── Logged in: user card + key links ── */
                        <div className="p-4 space-y-1">
                            {/* Avatar + name */}
                            <div
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-2 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name || "User"}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div
                                            className={`w-full h-full flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
                                        >
                                            <UserIcon
                                                size={20}
                                                className="text-gray-500"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p
                                        className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-gray-700"}`}
                                    >
                                        {user.name || "Trader"}
                                    </p>
                                    <p className="text-xs text-primary truncate">
                                        @{user.profile?.username || "user"}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/get-started"
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text transition-colors ${isDark ? "text-orange-300 hover:bg-orange-400/10" : "text-orange-700 hover:bg-orange-50"}`}
                            >
                                <Compass
                                    size={16}
                                    className="text-orange-500"
                                />
                                Getting Started
                            </Link>
                            <Link
                                href={dashboardUrl}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text transition-colors ${isDark ? "text-gray-300 hover:bg-slate-800 hover:text-white" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                <LayoutDashboard
                                    size={16}
                                    className="text-primary"
                                />
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text transition-colors ${isDark ? "text-gray-300 hover:bg-slate-800 hover:text-white" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Settings size={16} className="text-gray-500" />
                                Settings
                            </Link>
                            <button
                                onClick={() => {
                                    signout();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                        </div>
                    ) : (
                        /* ── Not logged in: Login + Sign Up ── */
                        <div className="p-4 space-y-3">
                            <Link
                                href="/get-started"
                                onClick={onClose}
                                className={buttonVariants({
                                    variant: "outline",
                                    className: `flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${isDark ? "border-orange-400/20 bg-orange-400/10 text-orange-300 hover:bg-orange-400/15" : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"}`,
                                })}
                            >
                                <Compass size={16} />
                                Start Here
                            </Link>
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/auth/login"
                                    onClick={onClose}
                                    className={buttonVariants({
                                        variant: "outline",
                                        className: `flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-slate-600 text-white hover:bg-slate-800" : "border-dashboard text-gray-800 hover:bg-gray-50"}`,
                                    })}
                                >
                                    <LogIn size={16} />
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    onClick={onClose}
                                    className={buttonVariants({
                                        variant: "primary",
                                        className:
                                            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20",
                                    })}
                                >
                                    <UserPlus size={16} />
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
