"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useState } from "react";
import { X, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { dashboardMenuItems } from "@/config/navigation";
import { signout } from "@/app/auth/actions";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/lib/auth-types";
import { FloatingQuickActions } from "@/components/dashboard/FloatingQuickActions";

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    user: AuthUser | null;
}

export function DashboardLayoutClient({
    children,
    user
}: DashboardLayoutClientProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="h-screen font-sans flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--dashboard-bg)' }}>
            {/* Top Header - Full Width */}
            <Header
                onMobileMenuClick={() => setMobileMenuOpen(true)}
                user={user}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar for Desktop */}
                <Sidebar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden font-sans">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-xs bg-white dark:bg-[#0B0E14] shadow-2xl p-4 flex flex-col animate-in slide-in-from-left duration-200">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <Logo />
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <nav className="flex flex-col gap-1">
                                {dashboardMenuItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                                            )}
                                        >
                                            <Icon size={20} />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>

                        <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                            <button
                                onClick={() => signout()}
                                className="flex items-center gap-4 px-4 py-3 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                                <LogOut size={20} />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FloatingQuickActions />
        </div>
    );
}
