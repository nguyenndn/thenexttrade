"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Flame,
    Settings,
    Bell,
    Users,
    ChevronRight,
    UserCircle
} from "lucide-react";

const sidebarNavItems = [
    {
        title: "Login Streak",
        href: "/dashboard/settings/streak",
        icon: Flame
    },
    {
        title: "Account Settings",
        href: "/dashboard/settings",
        icon: Settings
    },
    {
        title: "Notifications",
        href: "/dashboard/settings/notifications",
        icon: Bell
    },
    {
        title: "Referrals",
        href: "/dashboard/settings/referrals",
        icon: Users
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col xl:flex-row gap-6 p-4 xl:p-[10px] min-h-screen bg-gray-50/50 dark:bg-black/20">
            {/* Sidebar / Navigation Tabs */}
            <aside className="w-full xl:w-64 flex-shrink-0 z-20">
                <div className="sticky top-[10px] bg-white dark:bg-[#0B0E14] rounded-2xl border border-gray-100 dark:border-white/5 p-2 xl:p-4 shadow-sm">
                    <div className="mb-4 px-2 hidden xl:block">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
                        <p className="text-xs text-gray-500">Manage your account settings</p>
                    </div>

                    <nav className="flex xl:flex-col gap-2 overflow-x-auto scrollbar-hide pb-2 xl:pb-0">
                        {sidebarNavItems.map((item) => {
                            // Close match for "Account Settings" which handles root /dashboard/settings
                            const isActive = item.href === "/dashboard/settings"
                                ? pathname === "/dashboard/settings"
                                : pathname.startsWith(item.href);

                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col xl:flex-row items-center xl:gap-3 px-4 py-3 xl:px-3 xl:py-2.5 rounded-xl transition-all font-medium text-xs xl:text-sm group flex-shrink-0 border xl:border-transparent ${isActive
                                        ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary xl:bg-primary/10 xl:dark:bg-primary/20"
                                        : "bg-white dark:bg-transparent border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <Icon size={20} className={`mb-2 xl:mb-0 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                                    <span className="text-center xl:text-left whitespace-nowrap">{item.title}</span>
                                    {isActive && <div className="hidden xl:block w-1 h-4 bg-primary rounded-full ml-auto" />}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 w-full min-w-0">
                {children}
            </div>
        </div>
    );
}
