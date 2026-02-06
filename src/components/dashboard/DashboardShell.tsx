
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

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#0F1117] font-sans">
            {/* Desktop Sidebar */}
            <Sidebar items={adminMenuItems} />

            {/* Mobile Sidebar */}
            <MobileSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                items={adminMenuItems}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onMobileMenuClick={() => setIsMobileMenuOpen(true)}
                    searchRoute="/admin/search" // Specifically for Admin
                    showAccountSelector={false}
                    user={user}
                    bell={bell}
                />
                <main className="flex-1 p-6 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
