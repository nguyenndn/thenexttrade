"use client";

import { Crown, Timer, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useResolvedProStatus } from "@/components/pro/useResolvedProStatus";

/**
 * Compact Pro status bar for mobile main content area.
 * Note: "ACTIVE" VIP state is now rendered as a compact inline "VIP" badge
 * directly beside the trader's name in GreetingHeader, so no full-width banner
 * occupies vertical space when VIP is active.
 */
export function MobileProStatusBanner({
    hideFreeNudge = false,
}: {
    hideFreeNudge?: boolean;
}) {
    const { loading, currentStatus, isPro, expiresAt } = useResolvedProStatus();

    if (loading) return null;

    // VIP Active is displayed inline beside userName in GreetingHeader on mobile
    if (currentStatus === "ACTIVE") return null;

    if (hideFreeNudge && currentStatus === "NONE") return null;

    if (currentStatus === "GRACE") {
        return (
            <div className="md:hidden mb-0 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-gold/10 border border-amber-200 dark:border-gold/20 px-3 py-2">
                <Timer className="h-4 w-4 text-amber-600 dark:text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-amber-700 dark:text-gold">
                        Grace Period
                    </span>
                    {expiresAt && (
                        <span className="ml-2 text-[10px] font-mono tabular-nums text-amber-600/70 dark:text-gold/70">
                            Expires{" "}
                            {new Date(expiresAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    )}
                </div>
                <Link
                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                    className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-gold hover:underline"
                >
                    Verify
                </Link>
            </div>
        );
    }

    if (currentStatus === "EXPIRED") {
        return (
            <div className="md:hidden mb-0 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">
                    VIP Expired
                </span>
                <Link
                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                    className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                    Renew <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        );
    }

    if (!isPro && !hideFreeNudge) {
        return (
            <div className="md:hidden mb-0 flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard px-3 py-2">
                <Crown className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                    Free Plan
                </span>
                <Link
                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                    className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                    Apply for Partner Pro <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        );
    }

    return null;
}
