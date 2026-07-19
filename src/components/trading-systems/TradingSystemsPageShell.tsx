import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { DynamicFirefly } from "@/components/ui/DynamicFirefly";

interface TradingSystemsPageShellProps {
    children: React.ReactNode;
    className?: string;
    mainClassName?: string;
    maxWidth?: string; // e.g. "max-w-6xl"
}

export function TradingSystemsPageShell({
    children,
    className = "",
    mainClassName = "",
    maxWidth = "max-w-7xl",
}: TradingSystemsPageShellProps) {
    return (
        <div
            className={`min-h-screen flex flex-col bg-[#f8faf9] dark:bg-transparent text-gray-700 dark:text-white relative isolate overflow-hidden ${className}`}
        >
            {/* Base premium paper surface */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(245,158,11,0.026)_0%,rgba(255,255,255,0)_24%),linear-gradient(110deg,rgba(16,185,129,0.04)_0%,rgba(255,255,255,0)_34%,rgba(14,165,233,0.026)_72%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.028)_0%,rgba(15,17,23,0)_24%),linear-gradient(110deg,rgba(16,185,129,0.028)_0%,rgba(15,17,23,0)_34%,rgba(14,165,233,0.018)_72%,rgba(15,17,23,0)_100%)]" />

            {/* Technical grid */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:50px_50px] opacity-70 [mask-image:linear-gradient(to_bottom,transparent_0%,#000_12%,#000_82%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

            {/* Amber radial glow */}
            <div className="absolute inset-x-0 top-16 -z-10 h-[440px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.05),transparent_62%),linear-gradient(90deg,transparent,rgba(16,185,129,0.038)_50%,transparent)] [mask-image:linear-gradient(to_bottom,#000,transparent)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.05),transparent_62%),linear-gradient(90deg,transparent,rgba(16,185,129,0.038)_50%,transparent)]" />

            <div className="absolute inset-x-0 top-[63px] -z-10 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
            <div className="absolute left-0 top-0 -z-10 h-full w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent" />
            <div className="absolute right-0 top-0 -z-10 h-full w-px bg-gradient-to-b from-transparent via-primary/15 to-transparent" />

            {/* Noise Background texture */}
            <div className="absolute inset-0 -z-10 noise-bg opacity-[0.018] dark:opacity-[0.035] pointer-events-none" />

            {/* Dynamic Firefly effect */}
            <DynamicFirefly />

            <PublicHeader />

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
