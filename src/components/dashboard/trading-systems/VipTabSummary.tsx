"use client";

import {
    Crown,
    ArrowRight,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Send,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { useProAccess } from "@/components/pro/ProProvider";
import type { VipRequest } from "@prisma/client";

interface VipTabSummaryProps {
    vipRequest?: VipRequest | null;
    vipLink?: string | null;
}

const PRO_BENEFITS = [
    "Access to all Expert Advisor (EA) downloads",
    "Advanced Intelligence features & trade analysis",
    "VIP Telegram community access",
    "Priority support & VIP trading resources",
    "VIP access scoped to your verified broker account",
];

export function VipTabSummary({ vipRequest, vipLink }: VipTabSummaryProps) {
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
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">
                            VIP Active
                        </p>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/70">
                            You have full VIP access. Manage your accounts from
                            the Account Hub.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/dashboard/accounts"
                        className={cn(
                            buttonVariants({ variant: "primary", size: "smd" }),
                            "bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 border-none shadow-lg shadow-gold/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                        )}
                    >
                        Go to Account Hub
                        <ExternalLink size={16} className="ml-2" />
                    </Link>
                    {vipLink && (
                        <a
                            href={vipLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2AABEE] text-white font-bold text-sm shadow-lg shadow-[#2AABEE]/20 hover:bg-[#2298d4] transition-all hover:scale-105"
                        >
                            <Send size={16} />
                            Join VIP Telegram
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (vipRequest?.status === "PENDING") {
        return (
            <div className="space-y-4 p-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <Crown className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                        <p className="font-bold text-amber-700 dark:text-amber-400">
                            Verification Under Review
                        </p>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/70">
                            Your VIP request is under review. We will
                            update your account once eligibility is verified.
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
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        Unlock Partner Pro - Free
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Open a trading account under our IB to apply for free
                        VIP access with EA downloads, VIP tools, and advanced
                        trading intelligence. VIP access depends on supported
                        broker and account eligibility.
                    </p>
                </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
                {PRO_BENEFITS.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <CheckCircle2
                            size={16}
                            className="text-primary shrink-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {benefit}
                        </span>
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
                    Get VIP Access Free
                    <ArrowRight size={16} />
                </Link>
                <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-dashboard text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Manage Accounts
                </Link>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
                Account verified through our IB partner network. No fees, no
                subscriptions.
            </p>
        </div>
    );
}
