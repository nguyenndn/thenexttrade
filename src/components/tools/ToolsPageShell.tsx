import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";
import type { AuthUser } from "@/lib/auth-types";

interface ToolsPageShellProps {
    children: React.ReactNode;
    className?: string;
    mainClassName?: string;
    maxWidth?: string; // e.g. "max-w-6xl"
    variant?: "library" | "workspace";
    user?: AuthUser | null;
}

export function ToolsPageShell({
    children,
    className = "",
    mainClassName = "",
    maxWidth = "max-w-6xl",
    variant = "library",
    user,
}: ToolsPageShellProps) {
    const isWorkspace = variant === "workspace";

    return (
        <div
            className={`min-h-screen flex flex-col bg-white dark:bg-transparent text-gray-700 dark:text-white relative isolate overflow-hidden ${className}`}
        >
            {/* Subtle Gold Atmosphere Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.08),transparent_75%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_15%,rgba(245,158,11,0.12),transparent_75%)] pointer-events-none" />

            {/* Technical Grid Pattern */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="absolute inset-x-0 top-[63px] -z-10 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
            <div className="absolute left-0 top-0 -z-10 h-full w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent" />
            <div className="absolute right-0 top-0 -z-10 h-full w-px bg-gradient-to-b from-transparent via-primary/15 to-transparent" />

            {/* Noise Background texture */}
            <div className="absolute inset-0 -z-10 noise-bg opacity-[0.018] dark:opacity-[0.035] pointer-events-none" />

            {/* Dynamic Firefly effect */}
            {!isWorkspace && <DynamicFirefly />}

            <PublicHeader user={user} />

            <main
                className={`flex-1 pt-28 sm:pt-32 pb-16 relative z-10 ${mainClassName}`}
            >
                <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
                    {children}
                </div>
            </main>

            <ScrollToTop />
            <SiteFooter />
        </div>
    );
}
