"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LogOut,
    Settings,
    User as UserIcon,
    Wallet,
    Trophy,
    LayoutDashboard,
    Flame,
    ChevronRight
} from "lucide-react";
import { signout } from "@/app/auth/actions";
import { AuthUser } from "@/lib/auth-types";
import { Button } from "@/components/ui/Button";

interface UserMenuProps {
    user: AuthUser | null;
    profile?: any;
    variant?: "default" | "dashboard";
}

export function UserMenu({ user, profile, variant = "default" }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const userData = {
        name: user?.name || "Trader",
        image: user?.image || null,
        username: user?.profile?.username || "User",
    };

    // Mock Stats (To be replaced with real data or props in the future)
    const stats = {
        profit: 1250.50,
        points: 850,
        rank: "Silver"
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) {
        return (
            <div className="flex items-center gap-3">
                <Link
                    href="/auth/login"
                    className="text-sm font-semibold whitespace-nowrap px-4 py-2 rounded-xl text-gray-800 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                    Login
                </Link>
                <Link
                    href="/auth/signup"
                    className="text-sm font-bold whitespace-nowrap px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-[#00A570] text-white hover:opacity-90 transition-opacity shadow-sm"
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
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#00C888]/10 dark:bg-slate-800 border-none sm:border-solid border-[#00C888]/20 dark:border-slate-700 hover:bg-[#00C888]/20 dark:hover:bg-slate-700 transition-all group shadow-sm !h-auto"
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
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-slate-800">
                            <UserIcon size={16} />
                        </div>
                    )}
                </div>

                {/* Gear Icon */}
                <Settings
                    size={20}
                    className="text-[#00C888] dark:text-[#00C888] group-hover:rotate-90 transition-transform duration-500"
                />
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#151925] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">

                    {/* Header Info */}
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                            Hello, <span className="text-primary">{userData.name}</span>
                        </h4>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                        {variant !== 'dashboard' ? (
                            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <LayoutDashboard size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                                <div>
                                    <span className="block text-gray-900 dark:text-white">Dashboard</span>
                                    <span className="text-xs text-gray-500 font-normal">Overview & Learning Path</span>
                                </div>
                            </Link>
                        ) : (
                            <>
                                {/* Dashboard Specific Links */}
                                {pathname.startsWith('/admin') ? (
                                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <Settings size={18} className="text-gray-400" />
                                        Account Settings
                                    </Link>
                                ) : (
                                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <Settings size={18} className="text-gray-400" />
                                        Account Settings
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-200 dark:border-white/10">
                        <Button
                            variant="ghost"
                            onClick={() => signout()}
                            className="flex w-full justify-start items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                            Log Out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
