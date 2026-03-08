
"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar"; // Assuming this is just the wrapper for Sidebar
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { adminMenuItems } from "@/config/navigation";

import { AuthUser } from "@/lib/auth-types";

export function DashboardShell({ children, user, bell }: { children: React.ReactNode; user?: AuthUser | null; bell?: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="h-screen font-sans flex flex-col overflow-hidden bg-gray-50 dark:bg-[#0F1117]">
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
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                items={adminMenuItems}
            />
        </div>
    );
}
