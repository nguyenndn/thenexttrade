"use client";

import { useProAccess } from "./ProProvider";
import { Crown, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
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
    const {
        isPro,
        loading,
        getAccountStatus,
        policyState: globalPolicyState,
    } = useProAccess();

    // Account-scoped check: if accountId is provided, check that specific account
    const accountStatus = accountId ? getAccountStatus(accountId) : null;
    const isUnlocked = accountId ? (accountStatus?.isPro ?? false) : isPro;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
        );
    }

    if (isUnlocked) return <>{children}</>;

    if (fallback) return <>{fallback}</>;

    return (
        <ProTeaser
            feature={feature}
            policyState={accountStatus?.policyState ?? globalPolicyState}
        />
    );
}

function ProTeaser({
    feature,
    policyState,
}: {
    feature?: string;
    policyState: "ACTIVE" | "WARNED" | "PAUSED";
}) {
    const featureLabels: Record<string, string> = {
        "ai-coach": "AI Weekly Coach",
        "edge-leak": "Edge Leak Detector",
        "rule-violations": "Rule Violation Tracker",
        "advanced-analytics": "Advanced Analytics",
        export: "Data Export",
    };

    const label = feature ? featureLabels[feature] || feature : "This feature";
    const isPaused = policyState === "PAUSED";
    const title = isPaused
        ? "Your VIP access is paused"
        : "Your trial ended";
    const description = isPaused
        ? "Restore access by meeting the current VIP activity policy."
        : `Your 7-day trial has ended. Continue using ${label} by activating VIP access.`;

    return (
        <div className="relative overflow-hidden rounded-lg border border-dashboard bg-white dark:bg-[#1E2028]">
            {/* Blurred background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-4 rounded-full bg-amber-50 dark:bg-amber-500/10 p-4">
                    <Lock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                </div>

                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {title}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>
                <ul className="mt-4 space-y-2 text-left text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        Connect and fund a REAL partner MT5 account with at least
                        $200.
                    </li>
                    <li className="flex items-start gap-2">
                        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        Trade at least 2.0 lots during a rolling 30-day period.
                    </li>
                    <li className="flex items-start gap-2">
                        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        Connect the EA or request Support Sync to verify your
                        activity.
                    </li>
                </ul>

                <Link
                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                    className={cn(
                        buttonVariants({ variant: "primary", size: "md" }),
                        "mt-6 inline-flex gap-2 font-bold"
                    )}
                >
                    <Crown className="h-4 w-4" />
                    Review Access Requirements
                    <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    Demo, contest, and evaluation accounts never count toward
                    funding or VIP volume.
                </p>
            </div>
        </div>
    );
}
