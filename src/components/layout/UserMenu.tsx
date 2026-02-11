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
            <Link
                href="/auth/login"
                className="text-sm sm:text-base font-medium whitespace-nowrap px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100 transition-colors"
            >
                Login
            </Link>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-0.5 pr-3 py-0.5 rounded-full bg-[#EAF4FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all group"
                aria-label="User menu"
            >
                {/* Avatar Circle */}
                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm">
                    {userData.image ? (
                        <Image
                            src={userData.image}
                            alt={userData.name || "User"}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-slate-800">
                            <UserIcon size={18} />
                        </div>
                    )}
                </div>

                {/* Gear Icon */}
                <Settings
                    size={20}
                    className="text-[#2F80ED] dark:text-blue-400 group-hover:rotate-90 transition-transform duration-500"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#151925] rounded-xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">

                    {/* Header Info */}
                    <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                        <div className="mb-4">
                            <h4 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">
                                Hello, <span className="text-primary">{userData.name}</span>
                            </h4>
                        </div>

                        {/* Quick Stats Row - REMOVED for cleanup
                        <div className="bg-white dark:bg-[#0B0E14] p-3 rounded-xl border border-gray-100 dark:border-white/5 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-1.5 text-[#2F80ED] mb-1">
                                <Trophy size={14} />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider">Points</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white text-lg">{stats.points} XP</p>
                        </div>
                        */}
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

                    <div className="p-2 border-t border-gray-100 dark:border-white/5">
                        <button
                            onClick={() => signout()}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
