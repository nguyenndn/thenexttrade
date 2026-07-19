"use client";

import { useProAccess } from "./ProProvider";
import { Crown, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface ProGateProps {
    children: ReactNode;
    feature?: string;
    accountId?: string;
    fallback?: ReactNode;
    previewCount?: number;
}

/**
 * Wraps Pro-only content. Shows children for Pro users,
 * shows a blurred preview + upgrade CTA for free users.
 */
export function ProGate({
    children,
    feature,
    accountId,
    fallback,
    previewCount,
}: ProGateProps) {
    const { isPro, loading, getAccountStatus } = useProAccess();

    // Account-scoped check: if accountId is provided, check that specific account
    const isUnlocked = accountId
        ? (getAccountStatus(accountId)?.isPro ?? false)
        : isPro;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
        );
    }

    if (isUnlocked) return <>{children}</>;

    if (fallback) return <>{fallback}</>;

    return <ProTeaser feature={feature} />;
}

function ProTeaser({ feature }: { feature?: string }) {
    const featureLabels: Record<string, string> = {
        "ai-coach": "AI Weekly Coach",
        "edge-leak": "Edge Leak Detector",
        "rule-violations": "Rule Violation Tracker",
        "advanced-analytics": "Advanced Analytics",
        export: "Data Export",
    };

    const label = feature ? featureLabels[feature] || feature : "This feature";

    return (
        <div className="relative overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028]">
            {/* Blurred background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-4 rounded-full bg-amber-50 dark:bg-amber-500/10 p-4">
                    <Lock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                </div>

                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {label} is a Pro Feature
                </h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                    Unlock all Pro features for free by verifying as a Gold
                    Scalper Ninja VIP trader. No subscription required.
                </p>

                <Link
                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/40 hover:from-amber-600 hover:to-orange-700"
                >
                    <Crown className="h-4 w-4" />
                    Unlock Pro Free
                    <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    Open a broker account via our partner link → Verify → Get
                    instant Pro access
                </p>
            </div>
        </div>
    );
}
