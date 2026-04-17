"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { MobileBottomTabBar } from "@/components/dashboard/MobileBottomTabBar";
import { useState } from "react";
import { AuthUser } from "@/lib/auth-types";
import { FloatingQuickActions } from "@/components/dashboard/FloatingQuickActions";
import { DashboardProvider } from "@/lib/dashboard-context";

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
        <DashboardProvider>
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
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-0 pb-20 lg:pb-4 w-full custom-scrollbar">
                        <div className="w-full max-w-full">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Mobile Sidebar — with section labels */}
                <MobileSidebar
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />

                <FloatingQuickActions />

                {/* Mobile Bottom Tab Bar */}
                <MobileBottomTabBar />
            </div>
        </DashboardProvider>
    );
}

