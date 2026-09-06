"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SPRING_SOFT } from "@/lib/animations";
import {
    LogOut,
    Settings,
    User as UserIcon,
    Wallet,
    Trophy,
    LayoutDashboard,
    Flame,
    ChevronRight,
    Search,
} from "lucide-react";
import { signout } from "@/app/auth/actions";
import { AuthUser } from "@/lib/auth-types";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { CommandPaletteTrigger } from "@/components/search/CommandPalette";
import { getTierProgress } from "@/lib/tier-utils";
import { EdgeInfoModal } from "@/components/gamification/EdgeInfoModal";

/** Read last_account_id cookie and return a pre-built dashboard URL to skip the redirect hop. */
function useDashboardUrl(): string {
    return useMemo(() => {
        if (typeof document === "undefined") return "/dashboard";
        const match = document.cookie.match(
            /(?:^|;\s*)last_account_id=([^;]+)/
        );
        const accountId = match?.[1];
        if (!accountId) return "/dashboard";
        const today = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
        return `/dashboard?accountId=${accountId}&from=${today}&to=${today}`;
    }, []);
}

interface UserMenuProps {
    user: AuthUser | null;
    profile?: any;
    variant?: "default" | "dashboard";
    isLoading?: boolean;
}

export function UserMenu({
    user,
    profile,
    variant = "default",
    isLoading = false,
}: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const dashboardUrl = useDashboardUrl();

    const userData = {
        name: user?.name || "Trader",
        image: user?.image || null,
        username: user?.profile?.username || "User",
    };

    const userXp = user?.profile?.xp ?? 0;
    const tierProgress = getTierProgress(userXp);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 animate-pulse">
                {/* Beautiful clean skeleton for header buttons matching exact sizes */}
                <div className="w-12 h-6 bg-gray-200 dark:bg-slate-700/50 rounded-xl" />
                <div className="w-24 h-9 bg-gray-300 dark:bg-slate-700/70 rounded-xl" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2 sm:gap-3">
                <Link
                    href="/auth/login"
                    className={buttonVariants({
                        variant: "ghost",
                        className:
                            "px-3 xl:px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-xl text-gray-800 hover:text-amber-600 hover:bg-transparent dark:text-gray-300 dark:hover:text-amber-300 dark:hover:bg-transparent",
                    })}
                >
                    Login
                </Link>
                <Link
                    href="/auth/signup"
                    className={buttonVariants({
                        variant: "primary",
                        className:
                            "px-4 xl:px-6 py-2 text-sm font-bold whitespace-nowrap rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/20",
                    })}
                >
                    Sign Up Free
                </Link>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-amber-500/10 dark:bg-slate-800 border-none sm:border-solid border-amber-500/20 dark:border-amber-400/20 hover:bg-amber-500/15 dark:hover:bg-amber-400/10 transition-all group shadow-sm !h-auto"
                aria-label="User menu"
            >
                {/* Avatar Circle */}
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-600 shadow-sm shrink-0">
                    {userData.image ? (
                        <Image
                            src={userData.image}
                            alt={userData.name || "User"}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-slate-800">
                            <UserIcon size={16} />
                        </div>
                    )}
                </div>

                {/* Gear Icon */}
                <Settings
                    size={20}
                    className="text-amber-500 dark:text-slate-400 dark:group-hover:text-white group-hover:rotate-90 transition-transform duration-500"
                />
            </Button>

            {/* Dropdown Menu */}
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={SPRING_SOFT}
                    style={{ transformOrigin: "top right" }}
                    className="absolute right-0 mt-3 w-60 bg-white dark:bg-[#151925] rounded-xl shadow-2xl border border-dashboard overflow-hidden z-50"
                >
                    {/* Header Info */}
                    <div className="p-4 border-b border-dashboard bg-gray-50/50 dark:bg-white/5">
                        <h4 className="font-bold text-lg text-gray-700 dark:text-white leading-tight">
                            Hello,{" "}
                            <span className="text-primary">
                                {userData.name}
                            </span>
                        </h4>

                        {/* Edge & Tier */}
                        <button
                            className="mt-3 flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
                            onClick={() => {
                                setIsOpen(false);
                                setIsEdgeModalOpen(true);
                            }}
                        >
                            <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                                style={{
                                    color: tierProgress.current.color,
                                    borderColor:
                                        tierProgress.current.color + "40",
                                    backgroundColor:
                                        tierProgress.current.color + "15",
                                }}
                            >
                                {tierProgress.current.label}
                            </span>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                {userXp.toLocaleString()} Edge
                            </span>
                        </button>

                        {/* Progress bar */}
                        {tierProgress.next && (
                            <div className="mt-2">
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${tierProgress.progress}%`,
                                            backgroundColor:
                                                tierProgress.current.color,
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {tierProgress.xpToNext.toLocaleString()}{" "}
                                    Edge to {tierProgress.next.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Search — mobile only (sm:hidden) */}
                    <div className="sm:hidden px-3 py-2 border-b border-dashboard">
                        <button
                            onClick={() =>
                                document.dispatchEvent(
                                    new KeyboardEvent("keydown", {
                                        key: "k",
                                        ctrlKey: true,
                                        bubbles: true,
                                    })
                                )
                            }
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-sm text-left"
                        >
                            <Search size={15} className="shrink-0" />
                            <span>Search...</span>
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                        <Link
                            href="/get-started"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-400/10 transition-colors group"
                        >
                            <Flame
                                size={18}
                                className="text-orange-500 transition-colors"
                            />
                            <div>
                                <span className="block text-gray-700 dark:text-white">
                                    Getting Started
                                </span>
                                <span className="text-xs text-gray-600 font-normal">
                                    Setup & next action
                                </span>
                            </div>
                        </Link>
                        {variant !== "dashboard" ? (
                            <Link
                                href={dashboardUrl}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                            >
                                <LayoutDashboard
                                    size={18}
                                    className="text-gray-500 group-hover:text-primary transition-colors"
                                />
                                <div>
                                    <span className="block text-gray-700 dark:text-white">
                                        Dashboard
                                    </span>
                                    <span className="text-xs text-gray-600 font-normal">
                                        Overview & Learning Path
                                    </span>
                                </div>
                            </Link>
                        ) : (
                            <>
                                {/* Dashboard Specific Links */}
                                {pathname.startsWith("/admin") ? (
                                    <Link
                                        href="/admin/settings"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Settings
                                            size={18}
                                            className="text-gray-500"
                                        />
                                        Account Settings
                                    </Link>
                                ) : (
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Settings
                                            size={18}
                                            className="text-gray-500"
                                        />
                                        Account Settings
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-2 border-t border-dashboard">
                        <Button
                            variant="ghost"
                            onClick={() => signout()}
                            className="flex w-full justify-start items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                            Log Out
                        </Button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            <EdgeInfoModal
                isOpen={isEdgeModalOpen}
                onClose={() => setIsEdgeModalOpen(false)}
            />
        </div>
    );
}
