"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/components/providers/ThemeProvider";
import { menuItems } from "@/config/navigation";
import { ChevronDown, LogIn, UserPlus, User as UserIcon, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthUser } from "@/lib/auth-types";
import { signout } from "@/app/auth/actions";

interface MobileNavigationProps {
    isOpen: boolean;
    onClose: () => void;
    user?: AuthUser | null;
}

export function MobileNavigation({ isOpen, onClose, user }: MobileNavigationProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleMobileDropdownToggle = (menu: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenDropdown(prev => prev === menu ? null : menu);
    };

    if (!isOpen) return null;

    return (
        <div className="md:hidden px-2 pb-4 absolute top-full left-0 w-full z-40">
            <div className={`max-w-7xl mx-auto rounded-xl border shadow-lg ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white border-gray-200'}`}>

                {/* Nav Links */}
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        if (item.type === "link") {
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${isDark ? 'text-white hover:bg-slate-800 hover:text-teal-400' : 'text-gray-900 hover:bg-gray-50 hover:text-teal-600'}`}
                                >
                                    {item.name}
                                </Link>
                            );
                        }
                        return (
                            <div key={item.name}>
                                <Button
                                    variant="ghost"
                                    onClick={(e) => handleMobileDropdownToggle(item.name, e)}
                                    className={`w-full flex h-auto items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${isDark ? 'text-white hover:bg-slate-800 hover:text-teal-400' : 'text-gray-900 hover:bg-gray-50 hover:text-teal-600'}`}
                                >
                                    <span>{item.name}</span>
                                    <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                                </Button>
                                {openDropdown === item.name && (
                                    <div className="pl-4 mt-2 space-y-1">
                                        {item.items?.map((subItem, idx) => (
                                            <Link
                                                key={idx}
                                                href={subItem.href}
                                                onClick={() => { setOpenDropdown(null); onClose(); }}
                                                className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${isDark ? 'text-gray-300 hover:bg-slate-800 hover:text-teal-400' : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'}`}
                                            >
                                                {subItem.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom section: user info OR auth buttons */}
                <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                    {user ? (
                        /* ── Logged in: user card + key links ── */
                        <div className="p-4 space-y-1">
                            {/* Avatar + name */}
                            <div className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
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
                                        <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                            <UserIcon size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {user.name || "Trader"}
                                    </p>
                                    <p className="text-xs text-primary truncate">@{user.profile?.username || "user"}</p>
                                </div>
                            </div>

                            <Link href="/dashboard" onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-slate-800 hover:text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <LayoutDashboard size={16} className="text-primary" />
                                Dashboard
                            </Link>
                            <Link href="/dashboard/settings" onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-slate-800 hover:text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <Settings size={16} className="text-gray-400" />
                                Settings
                            </Link>
                            <button
                                onClick={() => { signout(); onClose(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                        </div>
                    ) : (
                        /* ── Not logged in: Login + Sign Up ── */
                        <div className="p-4 flex gap-3">
                            <Link href="/auth/login" onClick={onClose}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50'}`}>
                                <LogIn size={16} />
                                Login
                            </Link>
                            <Link href="/auth/signup" onClick={onClose}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-[#00A570] text-white hover:opacity-90 transition-opacity">
                                <UserPlus size={16} />
                                Sign Up Free
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
