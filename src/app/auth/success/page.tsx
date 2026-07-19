"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

function SuccessTransitionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const name = searchParams.get("name") || "Trader";
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Kick off progress bar animation
        const progressTimer = setTimeout(() => setProgress(100), 80);

        // Redirect to dashboard after animation completes
        const redirectTimer = setTimeout(() => {
            // Build dashboard URL with accountId + today (same as login overlay)
            const match = document.cookie.match(
                /(?:^|;\s*)last_account_id=([^;]+)/
            );
            const accountId = match?.[1];
            const today = new Date().toISOString().slice(0, 10);
            const url = accountId
                ? `/dashboard?accountId=${accountId}&from=${today}&to=${today}`
                : "/dashboard";
            router.push(url);
        }, 2200);

        return () => {
            clearTimeout(progressTimer);
            clearTimeout(redirectTimer);
        };
    }, [router]);

    return (
        <div className="flex flex-col items-center space-y-8 max-w-sm px-6 text-center z-10 select-none">
            {/* Logo with scale-up entrance animation */}
            <div className="mb-2 animate-in zoom-in-75 duration-600 ease-out">
                <div className="relative">
                    {/* Glow ring behind logo */}
                    <div className="absolute inset-0 scale-[2] rounded-full bg-gradient-to-r from-primary/20 via-emerald-500/10 to-primary/20 blur-2xl animate-pulse" />
                    <div className="relative scale-[1.6]">
                        <Logo />
                    </div>
                </div>
            </div>

            {/* Welcome text */}
            <div className="space-y-2 animate-in slide-in-from-bottom-3 fade-in duration-700 delay-200 fill-mode-both">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    Welcome back, <span className="text-primary">{name}</span>
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                    Preparing your dashboard…
                </p>
            </div>

            {/* Glowing progress bar */}
            <div className="w-56 animate-in fade-in duration-500 delay-400 fill-mode-both">
                <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden relative">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-primary shadow-[0_0_16px_rgba(0,200,136,0.55),0_0_4px_rgba(0,200,136,0.8)] transition-all duration-2000 ease-login"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function SuccessTransitionPage() {
    return (
        <main className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0E14] text-white overflow-hidden select-none">
            {/* Radial glow background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,136,0.07)_0%,rgba(0,200,136,0.02)_40%,transparent_70%)] pointer-events-none" />

            {/* Secondary warm glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(247,201,72,0.04)_0%,transparent_50%)] pointer-events-none" />

            {/* Noise texture */}
            <div className="absolute inset-0 noise-bg opacity-[0.015] pointer-events-none" />

            {/* Fade-in entrance for the whole page */}
            <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center">
                <Suspense
                    fallback={
                        <div className="flex flex-col items-center space-y-8 max-w-sm px-6 text-center z-10 animate-pulse">
                            <div className="scale-[1.6] mb-2">
                                <Logo />
                            </div>
                            <div className="space-y-2">
                                <div className="h-7 w-48 bg-slate-800 rounded-lg mx-auto" />
                                <div className="h-4 w-36 bg-slate-800/60 rounded-lg mx-auto" />
                            </div>
                            <div className="w-56 h-1 bg-white/[0.08] rounded-full" />
                        </div>
                    }
                >
                    <SuccessTransitionContent />
                </Suspense>
            </div>
        </main>
    );
}
