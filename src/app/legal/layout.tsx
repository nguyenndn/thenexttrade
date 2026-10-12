"use client";

import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-transparent transition-colors duration-300 relative overflow-hidden">
            {/* Ambient Background Atmosphere & Technical Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <PublicHeader />

            <main className="flex-grow pt-24 pb-20 relative z-10 px-4">
                {children}
            </main>

            <SiteFooter />
        </div>
    );
}
