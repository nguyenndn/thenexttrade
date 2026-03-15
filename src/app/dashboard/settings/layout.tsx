"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Settings, Bell, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { title: "Account", href: "/dashboard/settings", icon: Settings, exact: true },
    { title: "Security", href: "/dashboard/settings/security", icon: Lock },
    { title: "Login Streak", href: "/dashboard/settings/streak", icon: Flame },
    { title: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
    { title: "Referrals", href: "/dashboard/settings/referrals", icon: Users },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen">
            {/* ── Page Header ── */}
            <div className="px-4 sm:px-6 pt-6 pb-0">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Manage your account, preferences, and notifications.
                </p>
            </div>

            {/* ── Horizontal Tab Nav ── */}
            <div className="mt-6 border-b border-gray-200 dark:border-white/10 px-4 sm:px-6">
                <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20"
                                )}
                            >
                                <Icon size={16} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ── Content ── */}
            <div className="px-4 sm:px-6 py-6">
                {children}
            </div>
        </div>
    );
}
