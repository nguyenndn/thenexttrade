"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar"; // Assuming this is just the wrapper for Sidebar
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { MobileBottomTabBar } from "./MobileBottomTabBar";
import { adminMenuItems } from "@/config/navigation";

import { AuthUser } from "@/lib/auth-types";

export function DashboardShell({
    children,
    user,
    bell,
}: {
    children: React.ReactNode;
    user?: AuthUser | null;
    bell?: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className="h-dvh font-sans flex flex-col overflow-hidden"
            style={{ backgroundColor: "var(--dashboard-bg)" }}
        >
            {/* Top Header - Full Width */}
            <Header
                onMobileMenuClick={() => setIsMobileMenuOpen(true)}
                searchRoute="/admin/search" // Specifically for Admin
                showAccountSelector={false}
                user={user}
                bell={bell}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <Sidebar
                    items={adminMenuItems}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 sm:px-4 pt-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:p-4 lg:pt-0 w-full custom-scrollbar">
                    <div className="w-full max-w-full">{children}</div>
                </main>
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                items={adminMenuItems}
            />

            {/* Mobile Bottom Tab Bar */}
            <MobileBottomTabBar />
        </div>
    );
}
