"use client";

import { Crown, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useProAccess } from "@/components/pro/ProProvider";
import type { VipRequest } from "@prisma/client";

interface VipTabSummaryProps {
    vipRequest?: VipRequest | null;
}

const PRO_BENEFITS = [
    "Access to all Expert Advisor (EA) downloads",
    "Advanced Intelligence features & trade analysis",
    "VIP Telegram community access",
    "Priority support & automated trade sync",
    "Account-scoped entitlements — control per broker account",
];

export function VipTabSummary({ vipRequest }: VipTabSummaryProps) {
    const { isPro, status, loading } = useProAccess();

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-6 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading Pro status...</span>
            </div>
        );
    }

    if (isPro) {
        return (
            <div className="space-y-4 p-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                    <Crown className="h-6 w-6 text-emerald-500 shrink-0" />
                    <div>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">Pro Active</p>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/70">
                            You have full Pro access. Manage your accounts from the Account Hub.
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                    Go to Account Hub <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        );
    }

    if (vipRequest?.status === "PENDING") {
        return (
            <div className="space-y-4 p-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <Crown className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                        <p className="font-bold text-amber-700 dark:text-amber-400">Verification Under Review</p>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/70">
                            Submitted on {new Date(vipRequest.createdAt).toLocaleDateString("en-US")}. We'll notify you once reviewed.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <Crown size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Unlock Partner Pro — Free</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Open a trading account under our IB to get free Pro access with full EA, VIP tools, and auto-sync.
                    </p>
                </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
                {PRO_BENEFITS.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-primary shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
                >
                    <Crown size={16} />
                    Get Pro Access Free
                    <ArrowRight size={16} />
                </Link>
                <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Manage Accounts
                </Link>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
                Account verified through our IB partner network. No fees, no subscriptions.
            </p>
        </div>
    );
}
